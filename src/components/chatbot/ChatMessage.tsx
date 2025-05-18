// src/components/chatbot/ChatMessage.tsx
"use client";

import type { Message } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Download, CalendarCheck2 } from 'lucide-react';
import SuggestedSlotButton from './SuggestedSlotButton';
import { Button } from '../ui/button';

interface ChatMessageProps {
  message: Message;
  onSlotSelect: (slot: string) => void;
  language: string | null; // 'en', 'pt', 'es'
}

const formatTimestamp = (timestamp: number, lang: string | null) => {
  let locale = 'en-US';
  if (lang === 'pt') locale = 'pt-BR';
  if (lang === 'es') locale = 'es-ES';
  return new Date(timestamp).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
};

export default function ChatMessage({ message, onSlotSelect, language }: ChatMessageProps) {
  const isBot = message.sender === 'bot';

  const getLocalizedText = (enText: string, ptText: string, esText: string): string => {
    if (language === 'pt') return ptText;
    if (language === 'es') return esText;
    return enText;
  };

  return (
    <div className={cn('flex items-start gap-3 p-4', isBot ? 'justify-start' : 'justify-end')}>
      {isBot && (
        <Avatar className="h-8 w-8 border border-primary shadow-sm">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot size={18} />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[75%] rounded-lg p-3 shadow-md',
          isBot ? 'bg-secondary text-secondary-foreground rounded-tl-none' : 'bg-primary text-primary-foreground rounded-tr-none'
        )}
      >
        <div className="text-sm whitespace-pre-wrap">{message.text}</div>
        
        {message.isLoading && (
          <div className="mt-2 text-xs italic text-muted-foreground">
            {getLocalizedText("Agenda AI is thinking...", "Agenda AI está pensando...", "Agenda AI está pensando...")}
          </div>
        )}

        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap">
            {message.suggestions.map((slot, index) => (
              <SuggestedSlotButton key={index} slot={slot} onSelect={onSlotSelect} language={language} />
            ))}
          </div>
        )}

        {message.confirmation && (
          <div className="mt-3 pt-3 border-t border-primary-foreground/20">
            <p className="text-sm font-semibold flex items-center">
              <CalendarCheck2 className="mr-2 h-4 w-4 text-primary-foreground/80" />
              {getLocalizedText("Appointment Confirmed!", "Compromisso Confirmado!", "¡Cita Confirmada!")}
            </p>
            <p className="text-xs mt-1">
              {getLocalizedText("Time:", "Horário:", "Hora:")} {new Date(message.confirmation.slot).toLocaleString(language || undefined, { dateStyle: 'full', timeStyle: 'short' })}
            </p>
            <p className="text-xs">
              {getLocalizedText("Subject:", "Assunto:", "Asunto:")} {message.confirmation.subject}
            </p>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="mt-2 text-primary-foreground bg-primary/80 hover:bg-primary/70 border-primary-foreground/50 hover:text-primary-foreground"
            >
              <a href={message.confirmation.icsData} download={message.confirmation.fileName}>
                <Download className="mr-2 h-4 w-4" />
                {getLocalizedText("Add to Calendar (.ics)", "Adicionar ao Calendário (.ics)", "Añadir al Calendario (.ics)")}
              </a>
            </Button>
          </div>
        )}
        
        <div className={cn('text-xs mt-2', isBot ? 'text-muted-foreground' : 'text-primary-foreground/70')}>
          {formatTimestamp(message.timestamp, language)}
        </div>
      </div>
      {!isBot && (
         <Avatar className="h-8 w-8 border border-secondary shadow-sm">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User size={18} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
