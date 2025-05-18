
// src/components/chatbot/Chatbot.tsx
"use client";

import { useState, useEffect, useRef, FormEvent } from 'react';
import type { Message, StoredUnderstandOutput } from '@/types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { understandUserRequest, UnderstandUserRequestOutput } from '@/ai/flows/understand-user-request';
import { suggestAvailableSlots, SuggestAvailableSlotsOutput } from '@/ai/flows/suggest-available-slots';
import { identifyLanguage, IdentifyLanguageOutput } from '@/ai/flows/identify-language-flow';
import { generateICS } from '@/lib/ics';
import { useToast } from "@/hooks/use-toast";

const CHAT_LANGUAGE_STORAGE_KEY = 'chatLanguagePreference';

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUnderstoodRequest, setCurrentUnderstoodRequest] = useState<StoredUnderstandOutput | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null); // 'en', 'pt', 'es', or null
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedLang = localStorage.getItem(CHAT_LANGUAGE_STORAGE_KEY);
    if (storedLang && ['en', 'pt', 'es'].includes(storedLang)) {
      setSelectedLanguage(storedLang);
      addInitialMessage(storedLang);
    } else {
      addInitialMessage(null);
    }
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const addInitialMessage = (lang: string | null) => {
    if (lang === null) {
        addMessage('bot', "Hello! I'm Agenda AI, your scheduling assistant. I understand English, Portuguese, and Spanish. How can I help you today?");
        addMessage('bot', "Olá! Sou a Agenda AI, sua assistente de agendamento. Entendo inglês, português e espanhol. Como posso ajudar hoje?");
        addMessage('bot', "¡Hola! Soy Agenda AI, tu asistente de programación. Entiendo inglés, portugués y español. ¿Cómo puedo ayudarte hoy?");
    } else {
      let greeting = "";
      if (lang === 'pt') {
        greeting = "Olá! Sou sua assistente Agenda AI. Como posso ajudar a agendar seu compromisso hoje? Também entendo inglês e espanhol.";
      } else if (lang === 'es') {
        greeting = "¡Hola! Soy tu asistente Agenda AI. ¿Cómo puedo ayudarte a programar tu cita hoy? También entiendo inglés y portugués.";
      } else { // lang === 'en' or default
        greeting = "Hello! I'm your Agenda AI assistant. How can I help you schedule your appointment today? I also understand Portuguese and Spanish.";
      }
      addMessage('bot', greeting);
    }
  };

  const addMessage = (sender: 'user' | 'bot', text: React.ReactNode, extraProps?: Partial<Message>) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: crypto.randomUUID(), sender, text, timestamp: Date.now(), ...extraProps },
    ]);
  };

  const updateLastBotMessage = (newText: React.ReactNode, newExtraProps?: Partial<Message>) => {
    setMessages(prevMessages => {
      const lastBotLoadingMessageIndex = prevMessages.findLastIndex(
        m => m.sender === 'bot' && m.isLoading
      );
  
      if (lastBotLoadingMessageIndex !== -1) {
        const updatedMessages = [...prevMessages];
        const currentMessage = updatedMessages[lastBotLoadingMessageIndex];
        updatedMessages[lastBotLoadingMessageIndex] = {
          ...currentMessage,
          text: newText,
          timestamp: Date.now(), // Update timestamp
          ...newExtraProps, // Apply newExtraProps, potentially overriding isLoading
          // Explicitly set isLoading. If newExtraProps has isLoading, use it. Otherwise, default to false.
          isLoading: (newExtraProps && newExtraProps.isLoading !== undefined) ? newExtraProps.isLoading : false,
        };
        return updatedMessages;
      } else {
        // If no bot message is currently loading, add a new one.
        // This handles cases where the bot initiates a new message without a prior loading state,
        // or if a loading state was unexpectedly cleared.
        const newMessage: Message = {
          id: crypto.randomUUID(),
          sender: 'bot',
          text: newText,
          timestamp: Date.now(),
          ...newExtraProps,
          isLoading: (newExtraProps && newExtraProps.isLoading !== undefined) ? newExtraProps.isLoading : false,
        };
        return [...prevMessages, newMessage];
      }
    });
  };

  const getLocalizedText = (enText: string, ptText: string, esText: string, langOverride?: string | null): string => {
    const langToUse = langOverride || selectedLanguage;
    if (langToUse === 'pt') return ptText;
    if (langToUse === 'es') return esText;
    return enText;
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessageText = userInput;
    addMessage('user', userMessageText);
    setUserInput('');
    setIsLoading(true);
    let currentLang = selectedLanguage;

    addMessage('bot', "...", { isLoading: true }); 

    try {
      const identifyResult: IdentifyLanguageOutput = await identifyLanguage({ text: userMessageText });
      currentLang = identifyResult.language || currentLang || 'en'; 
      if (currentLang !== selectedLanguage) {
        setSelectedLanguage(currentLang);
        localStorage.setItem(CHAT_LANGUAGE_STORAGE_KEY, currentLang);
      }
      
      updateLastBotMessage(getLocalizedText("Okay, let me see what I can do for your request...", "Ok, deixe-me ver o que posso fazer pela sua solicitação...", "Ok, déjame ver qué puedo hacer por tu solicitud...", currentLang), { isLoading: true });

      const understandingResult: UnderstandUserRequestOutput = await understandUserRequest({ request: userMessageText, language: currentLang });
      setCurrentUnderstoodRequest(understandingResult);

      if (understandingResult.understood) {
        if (understandingResult.dateTime) {
          updateLastBotMessage(getLocalizedText("Got it! Let me check for available slots around that time for you...", "Entendi! Deixe-me verificar os horários disponíveis próximos a esse horário para você...", "¡Entendido! Déjame revisar los horarios disponibles cerca de esa hora para ti...", currentLang));
          addMessage('bot', '', { isLoading: true });

          const slotsResult: SuggestAvailableSlotsOutput = await suggestAvailableSlots({
            requestedTime: understandingResult.dateTime,
            userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: currentLang,
          });

          if (slotsResult.suggestedTimeSlots && slotsResult.suggestedTimeSlots.length > 0) {
            updateLastBotMessage(
              getLocalizedText("Here are some available slots. Please choose one, or let me know if another time works better:", "Aqui estão alguns horários disponíveis. Por favor, escolha um, ou me diga se outro horário funciona melhor:", "Aquí hay algunos horarios disponibles. Por favor, elige uno, o dime si otro horario te viene mejor:", currentLang),
              { suggestions: slotsResult.suggestedTimeSlots }
            );
          } else {
            updateLastBotMessage(getLocalizedText("I'm sorry, I couldn't find any openings that match your request. Would you like to try a different time or perhaps another day?", "Desculpe, não consegui encontrar nenhum horário disponível que corresponda à sua solicitação. Gostaria de tentar um horário ou dia diferente?", "Lo siento, no pude encontrar ningún horario disponible que coincida con tu solicitud. ¿Te gustaría intentar una hora o día diferente?", currentLang));
          }
        } else { 
           updateLastBotMessage(getLocalizedText("Certainly! Let me find the next available slots for you...", "Claro! Deixe-me verificar os próximos horários disponíveis para você...", "¡Claro! Déjame revisar los próximos horarios disponibles para ti...", currentLang));
           addMessage('bot', '', {isLoading: true});

          const slotsResult: SuggestAvailableSlotsOutput = await suggestAvailableSlots({
            requestedTime: new Date().toISOString(), 
            userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: currentLang,
          });

          if (slotsResult.suggestedTimeSlots && slotsResult.suggestedTimeSlots.length > 0) {
            updateLastBotMessage(
              getLocalizedText("Here are some available slots. Please choose one, or let me know if another time works better:", "Aqui estão alguns horários disponíveis. Por favor, escolha um, ou me diga se outro horário funciona melhor:", "Aquí hay algunos horarios disponibles. Por favor, elige uno, o dime si otro horario te viene mejor:", currentLang),
              { suggestions: slotsResult.suggestedTimeSlots }
            );
          } else {
            updateLastBotMessage(getLocalizedText("Unfortunately, I don't see any immediate openings. Would you like to try specifying a particular time or day?", "Infelizmente, não vejo nenhum horário disponível no momento. Gostaria de tentar especificar um horário ou dia diferente?", "Desafortunadamente, no veo ningún horario disponible en este momento. ¿Te gustaría intentar especificar una hora o día diferente?", currentLang));
          }
        }
      } else { 
        updateLastBotMessage(getLocalizedText(
            "I'm here to help! What can I do for you today? Would you like to schedule an appointment?",
            "Estou aqui para ajudar! O que posso fazer por você hoje? Gostaria de marcar um atendimento?",
            "¡Estoy aquí para ayudar! ¿Qué puedo hacer por ti hoy? ¿Te gustaría programar una cita?",
            currentLang
        ));
      }
    } catch (error) {
      console.error("Error processing request:", error);
      const langForError = currentLang || 'en';
      updateLastBotMessage(getLocalizedText("Apologies, I seem to have run into a technical hiccup. Could you please try your request again?", "Desculpas, parece que tive um problema técnico. Você poderia tentar sua solicitação novamente?", "Disculpas, parece que he tenido un contratiempo técnico. ¿Podrías intentar tu solicitud de nuevo?", langForError));
      toast({
        title: getLocalizedText("Error", "Erro", "Error", langForError),
        description: getLocalizedText("Failed to process your request. Please check your connection or try again later.", "Falha ao processar sua solicitação. Verifique sua conexão ou tente novamente mais tarde.", "Error al procesar tu solicitud. Por favor, verifica tu conexión o inténtalo de nuevo más tarde.", langForError),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotSelect = (slot: string) => {
    setIsLoading(true);
    const langForSlotMsg = selectedLanguage || 'en'; 
    const selectedSlotText = new Date(slot).toLocaleString(langForSlotMsg || undefined, {dateStyle: 'medium', timeStyle: 'short'});
    
    addMessage('user', `${getLocalizedText("I'd like to book the slot:", "Gostaria de reservar o horário:", "Me gustaría reservar el horario:", langForSlotMsg)} ${selectedSlotText}`);
    addMessage('bot', getLocalizedText("Confirming your selection...", "Confirmando sua seleção...", "Confirmando tu selección...", langForSlotMsg), { isLoading: true });

    const subject = currentUnderstoodRequest?.subject || getLocalizedText("Appointment", "Compromisso", "Cita", langForSlotMsg);
    const attendeeName = getLocalizedText("Valued User", "Estimado Usuário", "Estimado Usuario", langForSlotMsg);
    const { icsData, fileName } = generateICS(slot, subject, attendeeName, "user@example.com");

    setTimeout(() => {
      updateLastBotMessage(
        getLocalizedText(`Great! Your appointment for "${subject}" is confirmed. You'll find an "Add to Calendar" button below.`, `Ótimo! Seu compromisso para "${subject}" está confirmado. Você encontrará um botão "Adicionar ao Calendário" abaixo.`, `¡Genial! Tu cita para "${subject}" está confirmada. Encontrarás un botón "Añadir al Calendario" abajo.`, langForSlotMsg),
        {
          confirmation: {
            slot,
            subject,
            icsData,
            fileName,
          },
        }
      );
      setIsLoading(false);
      toast({
        title: getLocalizedText("Appointment Confirmed!", "Compromisso Confirmado!", "¡Cita Confirmada!", langForSlotMsg),
        description: `${getLocalizedText("Scheduled for", "Agendado para", "Programada para", langForSlotMsg)} ${new Date(slot).toLocaleString(langForSlotMsg || undefined)}. ${getLocalizedText("You can download the .ics file.", "Você pode baixar o arquivo .ics.", "Puedes descargar el archivo .ics.", langForSlotMsg)}`,
      });
    }, 500);
  };

  return (
    <Card className="w-full shadow-2xl rounded-lg overflow-hidden">
      <CardHeader className="bg-card-foreground/5">
        <CardTitle className="flex items-center text-xl">
          <MessageCircle className="mr-3 h-7 w-7 text-primary" />
          Agenda AI Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] w-full p-4" ref={scrollAreaRef}>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} onSlotSelect={handleSlotSelect} language={selectedLanguage} />
          ))}
        </ScrollArea>
        <ChatInput
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onSubmit={handleSendMessage}
          isLoading={isLoading}
          language={selectedLanguage}
        />
      </CardContent>
    </Card>
  );
}

