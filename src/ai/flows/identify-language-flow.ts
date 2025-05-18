
'use server';
/**
 * @fileOverview A Genkit flow to identify the language of a given text.
 *
 * - identifyLanguage - A function that identifies the language.
 * - IdentifyLanguageInput - The input type for the identifyLanguage function.
 * - IdentifyLanguageOutput - The return type for the identifyLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyLanguageInputSchema = z.object({
  text: z.string().describe('The text whose language needs to be identified.'),
});
export type IdentifyLanguageInput = z.infer<typeof IdentifyLanguageInputSchema>;

const IdentifyLanguageOutputSchema = z.object({
  language: z.string().describe("The identified language code (e.g., 'en', 'pt', 'es'). Defaults to 'en' if uncertain."),
});
export type IdentifyLanguageOutput = z.infer<typeof IdentifyLanguageOutputSchema>;

export async function identifyLanguage(input: IdentifyLanguageInput): Promise<IdentifyLanguageOutput> {
  return identifyLanguageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyLanguagePrompt',
  input: {schema: IdentifyLanguageInputSchema},
  output: {schema: IdentifyLanguageOutputSchema},
  prompt: `Analyze the following text and identify its primary language.
Respond with the two-letter ISO 639-1 code for the language.
Supported languages are English (en), Portuguese (pt), and Spanish (es).
If the language is mixed, unclear, or not one of the supported languages, default to 'en'.

Text:
"{{{text}}}"

Respond ONLY with the JSON object containing the language code as per the output schema.
Example for Portuguese: {"language": "pt"}
Example for English or unclear: {"language": "en"}
`,
});

const identifyLanguageFlow = ai.defineFlow(
  {
    name: 'identifyLanguageFlow',
    inputSchema: IdentifyLanguageInputSchema,
    outputSchema: IdentifyLanguageOutputSchema,
  },
  async (input: IdentifyLanguageInput) => {
    const {output} = await prompt(input);
    if (output && output.language) {
        const lang = output.language.toLowerCase().trim();
        if (['en', 'pt', 'es'].includes(lang)) {
            return { language: lang };
        }
    }
    return { language: 'en' }; // Default if not recognized or malformed
  }
);
