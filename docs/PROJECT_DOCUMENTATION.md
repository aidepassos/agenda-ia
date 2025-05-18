
# Documentação do Projeto: Agenda AI

## 1. Visão Geral do Projeto

**Nome:** Agenda AI
**Objetivo:** Um assistente de chatbot inteligente projetado para facilitar o agendamento de compromissos de forma conversacional.
**Funcionalidade Principal:**
- Compreensão de linguagem natural (NLU) para identificar a intenção de agendamento, datas, horários e outros detalhes relevantes a partir da solicitação do usuário.
- Sugestão de horários disponíveis, com integração com a API do Google Calendar para verificar a disponibilidade em tempo real no calendário de um profissional.
- Interface de chat multilíngue (Inglês, Português, Espanhol) que se adapta ao idioma do usuário.
- Geração de arquivos .ics para que os usuários possam adicionar facilmente os compromissos agendados aos seus calendários pessoais.

## 2. Tecnologias Utilizadas

O projeto Agenda AI é construído sobre um stack moderno de tecnologias para desenvolvimento web e IA:

- **Next.js (v15.2.3):** Framework React para renderização do lado do servidor (SSR) e geração de sites estáticos (SSG).
  - **App Router:** Utilizado para o sistema de roteamento e layout, permitindo o uso de Server Components.
  - **Server Components:** Melhoram o desempenho e reduzem o JavaScript enviado ao cliente.
  - **`next/image`:** Componente otimizado para imagens.
- **React (v18.3.1):** Biblioteca JavaScript para construir interfaces de usuário interativas.
  - **Functional Components & Hooks:** Padrões modernos para componentização e gerenciamento de estado.
- **TypeScript:** Superset do JavaScript que adiciona tipagem estática, melhorando a qualidade do código e a experiência de desenvolvimento.
- **Tailwind CSS (v3.4.1):** Framework CSS utility-first para estilização rápida e customizável.
- **ShadCN UI:** Coleção de componentes de UI reutilizáveis, acessíveis e esteticamente agradáveis, construídos com Radix UI e Tailwind CSS.
  - Componentes notáveis utilizados: `Input`, `Button`, `Avatar`, `ScrollArea`, `Card`, `Toaster`, `Toast`, `Dialog`, `Select`, etc.
  - O tema é definido em `src/app/globals.css` usando variáveis CSS HSL.
- **Genkit (v1.8.0):** Framework do Google para construir aplicações com IA generativa.
  - **`@genkit-ai/googleai`:** Plugin para integrar modelos de linguagem do Google AI (como Gemini).
  - **`ai.defineFlow`:** Para definir a lógica de múltiplos passos para as interações de IA.
  - **`ai.definePrompt`:** Para criar e configurar prompts para os modelos de linguagem.
  - **`ai.defineTool`:** Permite que os modelos de IA chamem funções TypeScript (ferramentas) para interagir com sistemas externos (ex: Google Calendar).
  - Modelo Padrão: `googleai/gemini-2.0-flash` (configurado em `src/ai/genkit.ts`).
- **Lucide React:** Biblioteca de ícones SVG leves e customizáveis.
- **`date-fns-tz` (v3.1.3):** Biblioteca para manipulação robusta de datas e fusos horários, crucial para a integração com o Google Calendar.
- **`googleapis` (v137.1.0):** Biblioteca cliente oficial do Google para interagir com suas APIs, especificamente a API do Google Calendar.
- **Zod (v3.24.2):** Biblioteca para declaração e validação de esquemas de dados, amplamente utilizada nos fluxos Genkit para definir os formatos de entrada e saída.
- **`dotenv` (v16.5.0):** Módulo para carregar variáveis de ambiente de um arquivo `.env` para o `process.env` durante o desenvolvimento local.

## 3. Estrutura do Projeto e Detalhamento dos Componentes

A seguir, uma descrição das principais pastas e arquivos do projeto:

---

### Raiz do Projeto

- **`.env`**:
  - **Descrição:** Armazena variáveis de ambiente para desenvolvimento local.
  - **Tecnologia:** `dotenv`.
  - **Exemplo de Uso:** `GOOGLE_APPLICATION_CREDENTIALS` para o caminho do arquivo JSON da chave da Conta de Serviço do Google.
  - **Importante:** Este arquivo não deve ser versionado (geralmente está no `.gitignore`).

- **`components.json`**:
  - **Descrição:** Arquivo de configuração para o ShadCN UI, definindo o estilo, caminhos, etc.

- **`next.config.ts`**:
  - **Descrição:** Arquivo de configuração principal do Next.js.
  - **Tecnologia:** Next.js.
  - **Configurações Notáveis:** Desabilita erros de build para TypeScript e ESLint (para simplificar o desenvolvimento no Studio), configura padrões remotos para imagens (`next/image`).

- **`package.json`**:
  - **Descrição:** Define as dependências do projeto, scripts (dev, build, start, lint, etc.) e metadados do projeto.
  - **Tecnologia:** NPM/Yarn.

- **`tailwind.config.ts`**:
  - **Descrição:** Arquivo de configuração do Tailwind CSS, onde o tema (cores, fontes, etc., referenciando `globals.css`) e plugins são definidos.
  - **Tecnologia:** Tailwind CSS.

- **`tsconfig.json`**:
  - **Descrição:** Arquivo de configuração do TypeScript, especificando opções do compilador e caminhos.
  - **Tecnologia:** TypeScript.

---

### `/docs/`

- **`PROJECT_DOCUMENTATION.md`** (este arquivo):
  - **Descrição:** Documentação geral do projeto.
  - **Tecnologia:** Markdown.

---

### `/src/ai/`

Pasta contendo toda a lógica relacionada à Inteligência Artificial usando Genkit.

- **`genkit.ts`**:
  - **Descrição:** Ponto central de configuração do Genkit. Inicializa a instância global `ai` com os plugins necessários (como `googleAI`) e define o modelo de linguagem padrão.
  - **Tecnologia:** Genkit, `@genkit-ai/googleai`.

- **`dev.ts`**:
  - **Descrição:** Arquivo de entrada para o servidor de desenvolvimento do Genkit (`genkit start`). Importa e, portanto, registra todos os fluxos definidos no projeto para que possam ser testados e inspecionados.
  - **Tecnologia:** Genkit, `dotenv` (para carregar variáveis de ambiente para os fluxos em desenvolvimento).

- **`/flows/`**: Subpasta para os fluxos de IA individuais.

  - **`identify-language-flow.ts`**:
    - **Descrição:** Define um fluxo Genkit para detectar o idioma do texto fornecido pelo usuário (suporta Inglês, Português e Espanhol).
    - **Tecnologia:** Genkit (`ai.defineFlow`, `ai.definePrompt`), Zod (para esquemas de entrada/saída).
    - **Exporta:** Função `identifyLanguage` e tipos `IdentifyLanguageInput`, `IdentifyLanguageOutput`.

  - **`suggest-available-slots.ts`**:
    - **Descrição:** Define um fluxo Genkit para sugerir horários de agendamento. Este fluxo utiliza uma ferramenta (`getAvailableTimeSlots`) que interage com a API do Google Calendar para verificar a disponibilidade real no calendário do profissional.
    - **Tecnologia:** Genkit (`ai.defineFlow`, `ai.definePrompt`, `ai.defineTool`), Zod, `googleapis`, `date-fns-tz`.
    - **Componentes Chave:**
        - **`getAvailableTimeSlots` (ferramenta):** Contém a lógica para autenticar com a API do Google Calendar (usando uma Conta de Serviço), consultar os horários ocupados (`freebusy.query`) e calcular os slots livres, considerando o fuso horário do profissional e o horário de trabalho (Seg-Sex, 09:00-18:00).
        - Constantes importantes: `PROFESSIONAL_CALENDAR_ID` (ID do calendário a ser consultado), `PROFESSIONAL_TIMEZONE`, `WORKING_HOURS_START`, `WORKING_HOURS_END`, `SLOT_DURATION_MINUTES`.
    - **Exporta:** Função `suggestAvailableSlots` e tipos `SuggestAvailableSlotsInput`, `SuggestAvailableSlotsOutput`.

  - **`understand-user-request.ts`**:
    - **Descrição:** Define um fluxo Genkit para interpretar a solicitação do usuário em linguagem natural. Extrai a intenção de agendamento, data/hora (convertendo referências relativas como "amanhã" ou "próximo mês" para datas absolutas), duração e assunto do compromisso.
    - **Tecnologia:** Genkit (`ai.defineFlow`, `ai.definePrompt`), Zod.
    - **Considerações:** Recebe o idioma do usuário e a data/hora atual como referência para uma interpretação mais precisa.
    - **Exporta:** Função `understandUserRequest` e tipos `UnderstandUserRequestInput`, `UnderstandUserRequestOutput`.

---

### `/src/app/`

Arquivos centrais da aplicação Next.js utilizando o App Router.

- **`globals.css`**:
  - **Descrição:** Define estilos globais e as variáveis CSS HSL para o tema do ShadCN UI (cores de fundo, texto, primária, acento, etc., para modos claro e escuro).
  - **Tecnologia:** Tailwind CSS, CSS.

- **`layout.tsx`**:
  - **Descrição:** Componente de layout raiz da aplicação. Configura a estrutura HTML básica, inclui as fontes (Geist Sans e Geist Mono) e renderiza o `Toaster` para notificações.
  - **Tecnologia:** Next.js (App Router), React.

- **`page.tsx`**:
  - **Descrição:** Componente da página inicial (`/`). Renderiza o cabeçalho, o componente principal do `Chatbot` e o rodapé.
  - **Tecnologia:** Next.js (App Router), React.

---

### `/src/components/`

Componentes React reutilizáveis da aplicação.

- **`/chatbot/`**: Componentes específicos para a interface do chatbot.

  - **`Chatbot.tsx`**:
    - **Descrição:** O coração da interface do chatbot. Gerencia o estado da conversa (mensagens, entrada do usuário, estado de carregamento), o idioma selecionado, e orquestra as chamadas para os fluxos Genkit (`identifyLanguage`, `understandUserRequest`, `suggestAvailableSlots`). Lida com a seleção de slots e a geração do arquivo .ics.
    - **Tecnologia:** React (Hooks: `useState`, `useEffect`, `useRef`), chamadas às funções dos fluxos Genkit, `useToast` (hook do ShadCN).

  - **`ChatInput.tsx`**:
    - **Descrição:** Renderiza o campo de entrada de texto e o botão de envio. O placeholder do campo de entrada e a label ARIA do botão são traduzidos de acordo com o idioma selecionado.
    - **Tecnologia:** React, ShadCN UI (`Input`, `Button`), Lucide React (`SendHorizontal` icon).

  - **`ChatMessage.tsx`**:
    - **Descrição:** Renderiza uma mensagem individual no chat (seja do usuário ou do bot). Exibe o texto da mensagem, avatar, timestamp formatado para o idioma, sugestões de horários (como botões), e a confirmação do agendamento com um link para download do arquivo .ics.
    - **Tecnologia:** React, ShadCN UI (`Avatar`, `Button`), Lucide React (ícones `Bot`, `User`, `Download`, `CalendarCheck2`).

  - **`SuggestedSlotButton.tsx`**:
    - **Descrição:** Renderiza um botão para um horário sugerido. Formata a exibição da data e hora de acordo com o idioma selecionado.
    - **Tecnologia:** React, ShadCN UI (`Button`), Lucide React (`CalendarClock` icon).

- **`/ui/`**:
  - **Descrição:** Contém os componentes da biblioteca ShadCN UI que foram adicionados ao projeto (ex: `accordion.tsx`, `button.tsx`, `card.tsx`, etc.). São componentes reutilizáveis que formam a base da interface do usuário.
  - **Tecnologia:** React, Radix UI, Tailwind CSS.

---

### `/src/hooks/`

Hooks React customizados.

- **`use-toast.ts`**:
  - **Descrição:** Hook fornecido pelo ShadCN UI para gerenciar e disparar notificações do tipo "toast".
  - **Tecnologia:** React.
- **`use-mobile.tsx`**:
    - **Descrição:** Hook (atualmente não utilizado ativamente no fluxo principal do chatbot) para detectar se o usuário está em um dispositivo móvel com base na largura da tela.
    - **Tecnologia:** React.


---

### `/src/lib/`

Funções utilitárias e lógica de bibliotecas.

- **`ics.ts`**:
  - **Descrição:** Contém a função `generateICS` que cria o conteúdo de um arquivo iCalendar (.ics) com base nos detalhes do compromisso (horário, assunto, participante).
  - **Tecnologia:** TypeScript, manipulação de datas.

- **`utils.ts`**:
  - **Descrição:** Utilitário `cn` fornecido pelo ShadCN UI para mesclar classes Tailwind CSS condicionalmente de forma eficiente.
  - **Tecnologia:** `clsx`, `tailwind-merge`.

---

### `/src/types/`

Definições de tipos TypeScript para o projeto.

- **`index.ts`**:
  - **Descrição:** Define tipos compartilhados em toda a aplicação, como `Message` (para a estrutura das mensagens do chat), `MessageSender` ('user' ou 'bot'), e `StoredUnderstandOutput` (para o output do fluxo de compreensão).
  - **Tecnologia:** TypeScript.

## 4. Fluxo de Dados (Agendamento - Alto Nível)

1.  O usuário digita uma mensagem no `ChatInput.tsx`.
2.  O `Chatbot.tsx` lida com o envio:
    a.  Chama o fluxo `identifyLanguage` para detectar o idioma da mensagem do usuário.
    b.  Atualiza o estado do idioma (e persiste no `localStorage`).
    c.  Chama o fluxo `understandUserRequest` com a mensagem do usuário e o idioma detectado.
    d.  Se a solicitação for entendida como um pedido de agendamento (`understood: true`):
        i.  Se `dateTime` estiver presente no resultado (usuário especificou uma data/hora), chama o fluxo `suggestAvailableSlots` com essa `dateTime`, o fuso horário do usuário e o idioma.
        ii. Se `dateTime` não estiver presente (consulta genérica de disponibilidade), chama `suggestAvailableSlots` com a data/hora atual, fuso horário do usuário e idioma.
    e.  O fluxo `suggestAvailableSlots` (através da ferramenta `getAvailableTimeSlots`) interage com a API do Google Calendar para buscar horários livres.
    f.  As sugestões de horários são exibidas como `SuggestedSlotButton`s dentro de um `ChatMessage.tsx`.
3.  O usuário clica em um `SuggestedSlotButton.tsx`.
4.  O `Chatbot.tsx` lida com a seleção do slot:
    a.  Gera um arquivo .ics usando a função de `src/lib/ics.ts`.
    b.  Exibe uma mensagem de confirmação no `ChatMessage.tsx` com o link para download do .ics.
    c.  Mostra uma notificação "toast" de sucesso.

## 5. Considerações Futuras / Melhorias Potenciais

- Implementar a criação de eventos diretamente no Google Calendar após a confirmação do usuário (atualmente apenas gera .ics).
- Permitir modificação/cancelamento de agendamentos.
- Internacionalização completa das respostas geradas pela IA (atualmente, os prompts são instruídos a considerar o idioma, mas a tradução da interface e dos textos fixos é mais robusta).
- Testes unitários e de integração.
- Tratamento de erros mais granular na comunicação com a API do Google Calendar.
