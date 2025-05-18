
// This file uses server-side code.
'use server';

/**
 * @fileOverview This file defines a Genkit flow to understand user requests for scheduling appointments using natural language.
 *
 * - understandUserRequest - A function that processes the user's natural language request and extracts relevant information.
 * - UnderstandUserRequestInput - The input type for the understandUserRequest function.
 * - UnderstandUserRequestOutput - The return type for the understandUserRequest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UnderstandUserRequestInputSchema = z.object({
  request: z.string().describe('The user request in natural language.'),
  language: z.string().optional().describe('The detected language of the user request (e.g., "en", "pt", "es"). Defaults to "en" if not provided.'),
});
export type UnderstandUserRequestInput = z.infer<typeof UnderstandUserRequestInputSchema>;

const UnderstandUserRequestOutputSchema = z.object({
  understood: z.boolean().describe('Whether the request was understood as being related to scheduling or availability.'),
  dateTime: z.string().optional().describe('The date and time extracted from the request, in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ).'),
  duration: z.number().optional().describe('The duration of the appointment in minutes.'),
  subject: z.string().optional().describe('The subject or purpose of the appointment.'),
});
export type UnderstandUserRequestOutput = z.infer<typeof UnderstandUserRequestOutputSchema>;

export async function understandUserRequest(input: UnderstandUserRequestInput): Promise<UnderstandUserRequestOutput> {
  return understandUserRequestFlow(input);
}

// Internal schema for the prompt, including the dynamic current date
const UnderstandUserRequestPromptInternalInputSchema = UnderstandUserRequestInputSchema.extend({
  currentDateForReference: z.string().describe('The current date and time in ISO format, for context for the LLM.'),
});

const prompt = ai.definePrompt({
  name: 'understandUserRequestPrompt',
  input: {schema: UnderstandUserRequestPromptInternalInputSchema},
  output: {schema: UnderstandUserRequestOutputSchema},
  prompt: `You are a helpful AI secretary assisting with scheduling appointments.
The user's request is in the language: {{{language}}}. Please interpret the user's intent strictly within the context of this language.

Analyze the user's request.
If the request seems to be related to scheduling, booking, inquiring about an appointment, availability, or modifying/cancelling an existing appointment, set "understood" to true.
If "understood" is true, then attempt to extract the date and time.
  - The target date and time should be converted to an ISO 8601 string (YYYY-MM-DDTHH:mm:ss.sssZ).
  - If the user provides a relative date (e.g., "today", "tomorrow", "next Monday", "in 3 weeks", "next month", "daqui a um mês"), use the '{{{currentDateForReference}}}' to calculate the absolute ISO date and time.
  - If no specific time is mentioned by the user for a future date, you can assume a default time like the start of the working day (e.g., 09:00 in the relevant timezone, which should be normalized to Z in the final ISO string if possible, or reflect the local start time accurately).
Also extract duration (in minutes) and subject if available. It's okay if not all details are present.
If the request is clearly unrelated to scheduling (e.g., a general greeting like "Hello", a question about the weather, or off-topic chitchat), or if you cannot confidently determine a scheduling intent, set "understood" to false.

User Request: {{{request}}}

Current date for reference: {{{currentDateForReference}}}

Output in JSON format. Ensure "understood" is always present. If other fields (dateTime, duration, subject) cannot be determined, they can be omitted or left blank.
Example of understood scheduling request: {"understood": true, "dateTime": "2025-05-20T14:00:00.000Z", "subject": "Doctor's visit"}
Example for relative future date: User says "next month" (or "daqui a um mês") and current date is 2025-05-17T10:00:00.000Z, the output dateTime should be for around 2025-06-17 (e.g., "2025-06-17T09:00:00.000Z" if no time specified by user, representing 9 AM on that future date).
Example of understood general availability query (no specific date from user): {"understood": true, "subject": "check availability"}
Example of not understood request (e.g. "Hello there"): {"understood": false}
  `,
});

const understandUserRequestFlow = ai.defineFlow(
  {
    name: 'understandUserRequestFlow',
    inputSchema: UnderstandUserRequestInputSchema,
    outputSchema: UnderstandUserRequestOutputSchema,
  },
  async (input: UnderstandUserRequestInput) => {
    const {output} = await prompt({
      ...input,
      language: input.language || 'en',
      currentDateForReference: new Date().toISOString()
    });
    // Ensure that 'understood' is always a boolean, defaulting to false if somehow missing.
    if (output && typeof output.understood === 'boolean') {
      return output;
    }
    // Fallback if output is malformed.
    return { understood: false };
  }
);
