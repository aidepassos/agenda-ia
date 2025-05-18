
// src/ai/flows/suggest-available-slots.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow to suggest available time slots based on user request and real Google Calendar availability.
 *
 * - suggestAvailableSlots - A function that suggests the nearest available time slots.
 * - SuggestAvailableSlotsInput - The input type for the suggestAvailableSlots function.
 * - SuggestAvailableSlotsOutput - The return type for the suggestAvailableSlots function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { google } from 'googleapis';
// Attempting to alias the import as a potential fix for the export error
import { toZonedTime, format, zonedTimeToUtc as internalZonedTimeToUtc } from 'date-fns-tz';

const SuggestAvailableSlotsInputSchema = z.object({
  requestedTime: z
    .string()
    .describe(
      'The time slot requested by the user.  Must be in ISO 8601 format (e.g. 2024-04-29T14:00:00-07:00).'
    ),
  userTimezone: z
    .string()
    .optional()
    .describe(
      'The timezone of the user, in IANA format (e.g. America/Los_Angeles).  If not provided, UTC is assumed.'
    ),
  language: z.string().optional().describe('The user\'s preferred language (e.g., "en", "pt", "es"). Defaults to "en" if not provided.'),
});
export type SuggestAvailableSlotsInput = z.infer<typeof SuggestAvailableSlotsInputSchema>;

const SuggestAvailableSlotsOutputSchema = z.object({
  suggestedTimeSlots: z
    .array(z.string())
    .describe(
      'An array of suggested time slots in ISO 8601 format (e.g. 2024-04-29T15:00:00-07:00), nearest to the requested time, within working hours, based on Google Calendar availability.'
    ),
});
export type SuggestAvailableSlotsOutput = z.infer<typeof SuggestAvailableSlotsOutputSchema>;

export async function suggestAvailableSlots(
  input: SuggestAvailableSlotsInput
): Promise<SuggestAvailableSlotsOutput> {
  return suggestAvailableSlotsFlow(input);
}

// --- Google Calendar Integration Constants ---
// IMPORTANT: REPLACE 'primary' with the actual Calendar ID of the professional.
// This could be the professional's email address or a specific calendar ID.
// The Service Account MUST have "Make changes to events" (or at least "See all event details")
// permission on this calendar.
const PROFESSIONAL_CALENDAR_ID = 'primary'; 

// Adjust to the professional's actual timezone.
// A list of IANA timezone names can be found here: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
const PROFESSIONAL_TIMEZONE = 'America/Sao_Paulo'; 

const WORKING_HOURS_START = 9; // 9 AM in PROFESSIONAL_TIMEZONE
const WORKING_HOURS_END = 18;  // 6 PM in PROFESSIONAL_TIMEZONE (slots must END by this time)
const SLOT_DURATION_MINUTES = 60;
const MAX_SUGGESTIONS = 3;
const SEARCH_DAYS_RANGE = 14; // How many days into the future to search for availability

const getAvailableTimeSlots = ai.defineTool(
  {
    name: 'getAvailableTimeSlots',
    description: 'Returns a list of available time slots from Google Calendar, within working hours (Monday to Friday, 9 AM to 6 PM in the professional\'s timezone).',
    inputSchema: z.object({
      requestedTime: z
        .string()
        .describe(
          'The time slot requested by the user. Must be in ISO 8601 format (e.g. 2024-04-29T14:00:00-07:00).'
        ),
      userTimezone: z
        .string()
        .optional()
        .describe(
          'The timezone of the user, in IANA format (e.g. America/Los_Angeles). If not provided, UTC is assumed.'
        ),
      language: z.string().optional().describe('The user\'s preferred language (e.g., "en", "pt", "es"). Defaults to "en" if not provided.'),
    }),
    outputSchema: z.array(z.string()),
  },
  async (input: { requestedTime: string; userTimezone?: string | undefined; language?: string | undefined; }) => {
    console.log('Tool `getAvailableTimeSlots` called with input:', input);
    try {
      // 1. Initialize Google Calendar API client
      // This assumes GOOGLE_APPLICATION_CREDENTIALS environment variable is set to the path of your Service Account JSON key file.
      // The Service Account needs appropriate permissions on the PROFESSIONAL_CALENDAR_ID.
      // Minimum "See all event details" for free/busy, "Make changes to events" for creating appointments.
      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'], // Read-only for free/busy. For creating events, add 'https://www.googleapis.com/auth/calendar.events'
      });
      const authClient = await auth.getClient();
      const calendar = google.calendar({ version: 'v3', auth: authClient });

      // 2. Determine search window (timeMin, timeMax)
      const nowInProfessionalTZ = toZonedTime(new Date(), PROFESSIONAL_TIMEZONE);
      let searchStartDateTime = new Date(input.requestedTime); // Parses the input ISO string
      
      // If requestedTime is in the past according to professional's TZ, start searching from the next possible hour from now.
      let searchStartInProfessionalTZ = toZonedTime(searchStartDateTime, PROFESSIONAL_TIMEZONE);
      if (searchStartInProfessionalTZ < nowInProfessionalTZ) {
        searchStartInProfessionalTZ = new Date(nowInProfessionalTZ); // Start from now (in prof TZ)
        searchStartInProfessionalTZ.setMinutes(0,0,0); // Align to the hour
        searchStartInProfessionalTZ.setHours(searchStartInProfessionalTZ.getHours() + 1); // Start from next hour
      }

      // Adjust searchStartInProfessionalTZ to be a valid working day/time
      let attempts = 0;
      const maxAttempts = SEARCH_DAYS_RANGE * 24; // Safety break
      while (attempts < maxAttempts) {
        const dayOfWeek = searchStartInProfessionalTZ.getDay(); // 0 (Sun) - 6 (Sat)
        const hour = searchStartInProfessionalTZ.getHours();
        if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= WORKING_HOURS_START && hour < WORKING_HOURS_END) {
          break; // Found a valid start time
        }
        searchStartInProfessionalTZ.setHours(searchStartInProfessionalTZ.getHours() + 1, 0, 0, 0);
        if (searchStartInProfessionalTZ.getHours() >= WORKING_HOURS_END) { 
           searchStartInProfessionalTZ.setDate(searchStartInProfessionalTZ.getDate() + 1);
           searchStartInProfessionalTZ.setHours(WORKING_HOURS_START, 0, 0, 0);
        }
        attempts++;
      }
      if (attempts >= maxAttempts) {
         console.error("Could not find a valid starting search time within the range.");
         return [];
      }

      // For Google API, timeMin and timeMax should be in RFC3339 format (ISO string with Z or offset)
      const timeMinUTC = searchStartInProfessionalTZ.toISOString();

      // Construct searchEndDateTime in professional's timezone
      let searchEndDateTimeInProfessionalTZ = toZonedTime(new Date(searchStartInProfessionalTZ), PROFESSIONAL_TIMEZONE);
      searchEndDateTimeInProfessionalTZ.setDate(searchStartInProfessionalTZ.getDate() + SEARCH_DAYS_RANGE);
      searchEndDateTimeInProfessionalTZ.setHours(WORKING_HOURS_END, 0, 0, 0);
      const timeMaxUTC = searchEndDateTimeInProfessionalTZ.toISOString();

      console.log(`Querying Google Calendar FreeBusy for ${PROFESSIONAL_CALENDAR_ID} from ${timeMinUTC} to ${timeMaxUTC} (Timezone: ${PROFESSIONAL_TIMEZONE})`);

      // 3. Query Google Calendar API for busy slots
      const freeBusyResponse = await calendar.freebusy.query({
        requestBody: {
          timeMin: timeMinUTC,
          timeMax: timeMaxUTC,
          // The timeZone here specifies the context for the items, but timeMin/timeMax should be full RFC3339
          timeZone: PROFESSIONAL_TIMEZONE, 
          items: [{ id: PROFESSIONAL_CALENDAR_ID }],
        },
      });

      const busySlots = freeBusyResponse.data.calendars?.[PROFESSIONAL_CALENDAR_ID]?.busy || [];
      console.log('Busy slots from Google Calendar:', JSON.stringify(busySlots, null, 2));

      // 4. Calculate available slots
      const availableSlots: string[] = [];
      // currentDayScanStart is a JS Date object, its internal value is UTC,
      // but it's initialized to represent the start of the search in PROFESSIONAL_TIMEZONE
      let currentDayScanStart = new Date(searchStartInProfessionalTZ); 

      for (let dayOffset = 0; dayOffset < SEARCH_DAYS_RANGE && availableSlots.length < MAX_SUGGESTIONS; dayOffset++) {
        // Create a date for the current day of scanning, in PROFESSIONAL_TIMEZONE's wall clock
        let dayToScan = toZonedTime(new Date(currentDayScanStart), PROFESSIONAL_TIMEZONE);
        dayToScan.setDate(currentDayScanStart.getDate() + dayOffset);
        
        const dayOfWeek = dayToScan.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Skip Sunday (0) and Saturday (6)
          continue;
        }

        // Iterate through possible start hours of the day in PROFESSIONAL_TIMEZONE
        for (let hour = WORKING_HOURS_START; hour < WORKING_HOURS_END; hour++) {
          if (availableSlots.length >= MAX_SUGGESTIONS) break;

          // Create a Date object representing 'hour' on 'dayToScan' in PROFESSIONAL_TIMEZONE
          // We use internalZonedTimeToUtc to get the correct UTC Date object for that wall clock time.
          // Example: internalZonedTimeToUtc('2024-07-20 09:00:00', 'America/Sao_Paulo')
          // This requires careful construction of the date string if dayToScan is just a Date object.
          // A safer way:
          let slotCandidateInProfessionalTZ = toZonedTime(new Date(dayToScan), PROFESSIONAL_TIMEZONE);
          slotCandidateInProfessionalTZ.setHours(hour, 0, 0, 0); // Sets wall clock time for professional's zone

          // Ensure this slot candidate is not before our adjusted searchStartInProfessionalTZ
          if (slotCandidateInProfessionalTZ < searchStartInProfessionalTZ) {
            continue;
          }
          
          const potentialSlotStartUTC = slotCandidateInProfessionalTZ; // JS Date is internally UTC
          const potentialSlotEndUTC = new Date(potentialSlotStartUTC.getTime() + SLOT_DURATION_MINUTES * 60000);

          // Check for overlap with busySlots (busy.start and busy.end are ISO strings - UTC)
          let isOverlapping = busySlots.some(busy => {
            const busyStart = new Date(busy.start!).getTime();
            const busyEnd = new Date(busy.end!).getTime();
            return Math.max(potentialSlotStartUTC.getTime(), busyStart) < Math.min(potentialSlotEndUTC.getTime(), busyEnd);
          });

          if (!isOverlapping) {
            // Slot is free, add its UTC ISO string
            availableSlots.push(potentialSlotStartUTC.toISOString());
          }
        }
      }
      
      console.log('Calculated available slots:', availableSlots);
      return availableSlots.slice(0, MAX_SUGGESTIONS);

    } catch (error: any) {
      console.error('Error in getAvailableTimeSlots tool:', error.message, error.stack);
      if (error.response && error.response.data) {
        console.error('Google API Error Details:', JSON.stringify(error.response.data, null, 2));
      }
      return []; // Return empty array on error
    }
  }
);

const suggestAvailableSlotsPrompt = ai.definePrompt({
  name: 'suggestAvailableSlotsPrompt',
  tools: [getAvailableTimeSlots],
  input: {schema: SuggestAvailableSlotsInputSchema},
  output: {schema: SuggestAvailableSlotsOutputSchema},
  prompt: `You are a scheduling assistant. The user has requested a time slot, or they have asked for general availability.
The user's preferred language is {{{language}}}.
Using the getAvailableTimeSlots tool, find appropriate available time slots. The tool considers working hours (Monday to Friday, 9 AM to 6 PM in the professional's timezone: ${PROFESSIONAL_TIMEZONE}) and checks the professional's Google Calendar.

The user's original request was for around: {{{requestedTime}}}.
The tool will try to find slots on or after this date/time.
If the tool returns slots, present them.

Return the suggested time slots in the format specified in the output schema.
`,
});

const suggestAvailableSlotsFlow = ai.defineFlow(
  {
    name: 'suggestAvailableSlotsFlow',
    inputSchema: SuggestAvailableSlotsInputSchema,
    outputSchema: SuggestAvailableSlotsOutputSchema,
  },
  async (input: SuggestAvailableSlotsInput) => {
    const {output} = await suggestAvailableSlotsPrompt({ ...input, language: input.language || 'en' });
    return { suggestedTimeSlots: output?.suggestedTimeSlots || [] };
  }
);
    