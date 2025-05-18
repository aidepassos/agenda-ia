import type { UnderstandUserRequestOutput } from '@/ai/flows/understand-user-request';

export type MessageSender = 'user' | 'bot';

export interface Message {
  id: string;
  sender: MessageSender;
  text: React.ReactNode; // Can be string or JSX for complex messages
  timestamp: number;
  suggestions?: string[]; // Array of ISO date strings
  confirmation?: {
    slot: string; // ISO date string
    subject: string;
    icsData: string;
    fileName: string;
  };
  isLoading?: boolean;
}

export type StoredUnderstandOutput = UnderstandUserRequestOutput;
