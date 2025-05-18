// src/app/page.tsx
import Chatbot from '@/components/chatbot/Chatbot';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 selection:bg-primary/30">
      <header className="my-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-primary drop-shadow-md">
          Agenda AI
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Your intelligent appointment scheduling assistant.
        </p>
      </header>
      <main className="w-full max-w-2xl flex-grow">
        <Chatbot />
      </main>
      <footer className="py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Agenda AI. Powered by Genkit and Next.js.</p>
        <p>Designed by an expert AI designer.</p>
      </footer>
    </div>
  );
}
