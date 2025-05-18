// src/lib/ics.ts

export function generateICS(
  startTimeISO: string,
  subject: string,
  attendeeName: string = "Valued User",
  attendeeEmail: string = "user@example.com"
): { icsData: string; fileName: string } {
  const startDate = new Date(startTimeISO);
  // Assume 1 hour duration for simplicity, can be adjusted based on understandUserRequestOutput.duration
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatDateForICS = (date: Date): string => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, "");
  };

  const uid = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}@agenda-ai.com`;
  const now = formatDateForICS(new Date());
  const start = formatDateForICS(startDate);
  const end = formatDateForICS(endDate);

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AgendaAI//App//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `ORGANIZER;CN=Agenda AI:MAILTO:noreply@agenda-ai.com`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${subject || "Appointment"}`,
    `DESCRIPTION:Your appointment scheduled via Agenda AI.\n\nThis is a meeting with ${attendeeName}.`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${attendeeName};X-NUM-GUESTS=0:MAILTO:${attendeeEmail}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  
  const safeSubject = subject?.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_') || 'event';
  const fileName = `appointment-${safeSubject}-${startDate.toISOString().slice(0,10)}.ics`;

  return {
    icsData: `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`,
    fileName: fileName
  };
}
