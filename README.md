
# Agenda AI

Seu assistente inteligente de agendamento de compromissos, construído com Next.js, Genkit e Google Calendar.

## Visão Geral do Projeto

Agenda AI é uma interface de chatbot que permite aos usuários agendar compromissos de forma conversacional. Ele utiliza o Gemini do Google para compreensão de linguagem natural e o Genkit para orquestrar os fluxos de IA. A funcionalidade principal inclui entender os pedidos dos usuários para compromissos, verificar a disponibilidade no Google Calendar de um profissional e sugerir horários disponíveis.

Para uma arquitetura detalhada do projeto, detalhamento de componentes e stack de tecnologia, por favor, consulte a [Documentação do Projeto](./docs/PROJECT_DOCUMENTATION.md) (atualmente em inglês, mas pode ser traduzida se necessário).

## Pré-requisitos

Antes de começar, certifique-se de ter o seguinte instalado:

*   **Node.js:** (Versão 18.x ou superior recomendada) - [Baixar Node.js](https://nodejs.org/)
*   **npm** ou **yarn:** (Vem com o Node.js ou pode ser instalado separadamente)
*   **Firebase CLI:** Para implantar a aplicação.
    ```bash
    npm install -g firebase-tools
    ```
    Após a instalação, faça login:
    ```bash
    firebase login
    ```
*   **Genkit CLI:** Para executar e testar fluxos Genkit localmente.
    ```bash
    npm install -g genkit-cli
    ```

## Configuração

Siga estes passos para configurar o projeto em sua máquina local.

### 1. Clone o Repositório (se aplicável)

Se você baixou isso como um ZIP, extraia-o. Se for um repositório Git:
```bash
# git clone <url-do-repositorio>
# cd agenda-ai # ou o nome do diretório do seu projeto
```
(Assumindo que você já está no diretório do projeto se estiver usando o Firebase Studio)

### 2. Instale as Dependências do Projeto

Instale os pacotes Node.js necessários:
```bash
npm install
# ou
# yarn install
```

### 3. Configuração do Google Cloud e Google Calendar

Esta aplicação requer integração com o Google Calendar para verificar a disponibilidade e criar compromissos. Isso é feito usando uma Conta de Serviço do Google Cloud.

#### a. Crie ou Selecione um Projeto Google Cloud
   *   Vá para o [Console do Google Cloud](https://console.cloud.google.com/).
   *   Crie um novo projeto ou selecione um existente. Este projeto abrigará sua Conta de Serviço e chaves de API. O ID do projeto usado em `firebase.json` (ex: `gen-lang-client-0476740779`) deve ser o que você usa.

#### b. Habilite a API do Google Calendar
   *   No Console do Google Cloud, para o seu projeto selecionado, navegue até "APIs e Serviços" > "Biblioteca".
   *   Procure por "Google Calendar API" e clique nela.
   *   Clique no botão "ATIVAR" se ainda não estiver habilitada.

#### c. Crie uma Conta de Serviço
   Uma Conta de Serviço é uma conta especial do Google que pertence ao seu projeto em vez de um usuário individual. É usada por aplicações para fazer chamadas de API autorizadas.
   *   No Console do Google Cloud, vá para "IAM e Admin" > "Contas de serviço".
   *   Clique em "+ CRIAR CONTA DE SERVIÇO".
   *   **Nome da conta de serviço:** Insira um nome descritivo (ex: `gerenciador-calendario` ou `agenda-ai-calendar-manager`). O ID da Conta de Serviço será gerado. (Para este projeto, estamos usando `gerenciador-calendario`).
   *   **Descrição:** (Opcional) Adicione uma descrição como "Conta de serviço para o Agenda AI gerenciar o Google Calendar."
   *   Clique em "CRIAR E CONTINUAR".
   *   **Conceder a esta conta de serviço acesso ao projeto (Opcional):** Por enquanto, você pode pular a adição de papéis aqui (ou adicionar "Projeto > Leitor" se preferir). As permissões cruciais serão definidas no próprio Google Calendar. Clique em "CONTINUAR".
   *   **Conceder aos usuários acesso a esta conta de serviço (Opcional):** Você também pode pular isso. Clique em "CONCLUÍDO".
   *   **Nota:** O e-mail da conta de serviço usado em `firebase.json` é `gerenciador-calendario@gen-lang-client-0476740779.iam.gserviceaccount.com`. Certifique-se de que esta conta de serviço específica exista no seu projeto ou ajuste o nome durante a criação e atualize `firebase.json` e o compartilhamento do calendário de acordo.

#### d. Crie uma Chave JSON para a Conta de Serviço
   Este arquivo de chave permite que sua aplicação se autentique como a Conta de Serviço ao rodar localmente.
   *   Encontre sua Conta de Serviço recém-criada (ou existente) (`gerenciador-calendario@gen-lang-client-0476740779.iam.gserviceaccount.com`) na lista.
   *   Clique nos três pontos (Ações) ao lado dela e selecione "Gerenciar chaves".
   *   Clique em "ADICIONAR CHAVE" > "Criar nova chave".
   *   Selecione **JSON** como o tipo de chave.
   *   Clique em "CRIAR". Um arquivo JSON será baixado para o seu computador. **Mantenha este arquivo seguro e privado.** Não o envie para o controle de versão.
   *   Renomeie este arquivo se desejar (ex: `agenda-ai-google-credentials.json`) e mova-o para um local seguro e memorável em seu computador.

#### e. Compartilhe seu Google Calendar com a Conta de Serviço
   O Google Calendar do profissional (aquele que o Agenda AI irá gerenciar) precisa conceder permissões à sua Conta de Serviço.
   *   Abra o Google Calendar que você deseja que o Agenda AI use (ex: o calendário principal do profissional).
   *   Vá para "Configurações e compartilhamento" para aquele calendário (geralmente passando o mouse sobre o nome do calendário na barra lateral esquerda e clicando nos três pontos).
   *   Em "Compartilhar com pessoas ou grupos específicos", clique em "+ Adicionar pessoas ou grupos".
   *   Cole o **endereço de e-mail da Conta de Serviço** que você está usando (ex: `gerenciador-calendario@gen-lang-client-0476740779.iam.gserviceaccount.com`).
   *   Para "Permissões", selecione **"Fazer alterações nos eventos"**. Isso permite que o Agenda AI verifique horários livres/ocupados e (eventualmente) crie novos compromissos.
   *   Clique em "Enviar".

### 4. Configure as Variáveis de Ambiente

Sua aplicação precisa saber onde encontrar a chave da Conta de Serviço para o desenvolvimento local. Isso é feito usando um arquivo `.env`.
   *   No diretório raiz do projeto, certifique-se de ter um arquivo chamado `.env`.
   *   Adicione ou atualize a seguinte linha no seu arquivo `.env`, substituindo o caminho do placeholder pelo caminho completo real para o arquivo de chave JSON que você baixou no passo 3d:
     ```env
     GOOGLE_APPLICATION_CREDENTIALS=/caminho/para/sua/chave-de-conta-de-servico-baixada.json
     ```
     *   **Exemplo Windows:** `GOOGLE_APPLICATION_CREDENTIALS=C:\Users\SeuNome\Documentos\Chaves\agenda-ai-google-credentials.json`
     *   **Exemplo macOS/Linux:** `GOOGLE_APPLICATION_CREDENTIALS=/Users/SeuNome/Documentos/Chaves/agenda-ai-google-credentials.json`

   *   **Chave da API do Gemini (Se não estiver usando Credenciais Padrão da Aplicação para o Genkit):**
     O plugin Google AI do Genkit (`@genkit-ai/googleai`) tentará primariamente usar as Credenciais Padrão da Aplicação (ADC - Application Default Credentials). Se `GOOGLE_APPLICATION_CREDENTIALS` estiver definido, as credenciais da conta de serviço podem ser usadas pelo ADC. Se você configurou o ADC via `gcloud auth application-default login` com sua conta de usuário, isso também pode ser usado.
     Se preferir usar uma chave de API específica para os modelos Gemini, você também pode adicioná-la ao seu arquivo `.env`:
     ```env
     GEMINI_API_KEY=SUA_CHAVE_API_GEMINI
     ```
     Você pode criar uma chave de API do Gemini no [Google AI Studio](https://aistudio.google.com/app/apikey). O plugin `googleAI()` irá pegá-la se disponível.

   **Importante:** O arquivo `.env` deve estar listado no seu arquivo `.gitignore` (se você estiver usando Git) para evitar o versionamento de credenciais sensíveis.

## Executando a Aplicação Localmente

Este projeto consiste em um frontend/backend Next.js e fluxos Genkit. Para desenvolvimento e teste local completo, você normalmente executará ambas as partes.

### 1. Inicie o Servidor de Desenvolvimento Next.js
   Este servidor lida com a interface do usuário e também faz chamadas para os fluxos Genkit.
   ```bash
   npm run dev
   ```
   A aplicação geralmente estará disponível em `http://localhost:9002` (ou a porta especificada no script do seu `package.json`).

### 2. Inicie a UI de Desenvolvimento do Genkit (Opcional, mas Recomendado para Teste de Fluxos de IA)
   O Genkit vem com uma UI local onde você pode inspecionar, testar e rastrear seus fluxos de IA. Isso é muito útil para depurar a lógica da IA.
   ```bash
   npm run genkit:dev
   # ou para recarregamento automático em mudanças nos fluxos Genkit:
   # npm run genkit:watch
   ```
   A UI do Genkit geralmente está disponível em `http://localhost:4000`.
   Seu aplicativo Next.js chamará esses fluxos conforme necessário. O arquivo `src/ai/dev.ts` garante que seus fluxos sejam registrados com este servidor Genkit local.
   Ao rodar localmente, a aplicação Next.js chama os fluxos Genkit. O ambiente Genkit (iniciado por `genkit:dev` ou `genkit:watch`) carrega `GOOGLE_APPLICATION_CREDENTIALS` do arquivo `.env` (devido ao `dotenv` ser usado em `src/ai/dev.ts`) para permitir que o fluxo `getAvailableTimeSlots` acesse o Google Calendar.

## Implantação no Firebase

Esta aplicação está configurada para implantação no Firebase Hosting. A configuração do Firebase em `firebase.json` está definida para:
*   Hospedar o frontend e backend Next.js (usando Cloud Run via `frameworksBackend`).
*   Usar a Conta de Serviço `gerenciador-calendario@gen-lang-client-0476740779.iam.gserviceaccount.com` para o backend implantado, para que ele possa acessar o Google Calendar. Certifique-se de que esta conta de serviço tenha a permissão necessária de "Fazer alterações nos eventos" no seu Google Calendar alvo e exista no seu projeto Google Cloud.

Para implantar:
```bash
firebase deploy
```
Certifique-se de estar logado na Firebase CLI (`firebase login`) e ter selecionado o projeto Firebase correto (`firebase use <seu-id-de-projeto>`).

## Informações Adicionais

Para mais detalhes sobre a arquitetura do projeto, componentes específicos e lógica dos fluxos de IA, por favor, consulte a [Documentação do Projeto](./docs/PROJECT_DOCUMENTATION.md).

## Agradecimentos Especiais

Ao Kleber Tiko pelo auxílio.
A Alura pela oportunidade de crescimento no aprendizado.
    
