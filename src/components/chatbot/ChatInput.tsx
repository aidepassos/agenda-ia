// src/components/chatbot/ChatInput.tsx
"use client";

import type React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SendHorizontal } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  language: string | null; // 'en', 'pt', 'es'
}

export default function ChatInput({ value, onChange, onSubmit, isLoading, language }: ChatInputProps) {
  const getPlaceholderText = () => {
    if (language === 'pt') return "Digite sua mensagem...";
    if (language === 'es') return "Escribe tu mensaje...";
    return "Type your message...";
  };

  const getAriaLabel = () => {
    if (language === 'pt') return "Enviar mensagem";
    if (language === 'es') return "Enviar mensaje";
    return "Send message";
  };
  
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 p-4 border-t border-border bg-card">
      <Input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={getPlaceholderText()}
        className="flex-grow bg-background focus:ring-primary"
        disabled={isLoading}
        aria-label="Chat message input"
      />
      <Button type="submit" size="icon" disabled={isLoading} aria-label={getAriaLabel()}>
        <SendHorizontal className="h-5 w-5" />
      </Button>
    </form>
  );
}
