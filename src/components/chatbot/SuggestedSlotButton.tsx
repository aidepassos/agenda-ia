// src/components/chatbot/SuggestedSlotButton.tsx
"use client";

import { Button } from '@/components/ui/button';
import { CalendarClock } from 'lucide-react';

interface SuggestedSlotButtonProps {
  slot: string; // ISO date string
  onSelect: (slot: string) => void;
  language: string | null; // 'en', 'pt', 'es'
}

const formatDisplayDateTime = (isoString: string, lang: string | null) => {
  if (!isoString) return "Invalid time";
  try {
    let locale = 'en-US';
    if (lang === 'pt') locale = 'pt-BR';
    if (lang === 'es') locale = 'es-ES';
    
    return new Date(isoString).toLocaleString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return isoString; // fallback
  }
};

export default function SuggestedSlotButton({ slot, onSelect, language }: SuggestedSlotButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onSelect(slot)}
      className="m-1 text-sm hover:bg-accent hover:text-accent-foreground"
    >
      <CalendarClock className="mr-2 h-4 w-4" />
      {formatDisplayDateTime(slot, language)}
    </Button>
  );
}
