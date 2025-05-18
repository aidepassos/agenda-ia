
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-available-slots.ts';
import '@/ai/flows/understand-user-request.ts';
import '@/ai/flows/identify-language-flow.ts';
