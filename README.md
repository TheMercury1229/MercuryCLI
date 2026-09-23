# Mercury CLI

<p align="center">
  <strong>An intelligent, autonomous AI CLI assistant built for modern software development.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#cli-commands">CLI Commands</a> •
  <a href="#ai-modes">AI Modes</a> •
  <a href="#environment-variables">Configuration</a> •
  <a href="#project-structure">Project Structure</a>
</p>

---

## Overview

**Mercury CLI** is a terminal-native AI development tool that connects state-of-the-art language models to your local codebase. Powered by the **Vercel AI SDK**, **OpenRouter**, **Firecrawl**, and **Better Auth**, Mercury CLI offers three distinct operating modes: read-only codebase exploration (**Ask**), autonomous code generation with staged diff approval (**Agent**), and multi-phase project execution (**Plan**).

Mercury CLI includes a full-stack authentication system utilizing RFC 8628-style device authorization flows backed by an Express server, Next.js web application, and PostgreSQL database with Prisma ORM.

---

## Features

### 🧠 Three Specialized AI Modes
- **Ask Mode**: Fast, read-only multi-turn Q&A agent for analyzing repository structure, inspecting files, searching code patterns, reading skill documents, and querying live web documentation without modifying your disk.
- **Agent Mode**: Autonomous multi-step coding agent that plans and stages workspace mutations (creating, editing, and deleting files, creating folders, running terminal commands) with an interactive staging and review system.
- **Plan Mode**: Two-stage architectural planner that breaks complex goals down into actionable steps, allows you to interactively pick which steps to execute, and runs each step with full tool capabilities before presenting a unified diff for approval.

### 🛡️ Safe Staging & Interactive Approval
- **Unified Diff Inspection**: Review staged changes with terminal-rendered syntax highlighting and color-coded diffs before anything is written to disk.
- **Granular Approval**: Choose to apply all changes, review changes file-by-file, or discard all staged mutations.
- **Safe Command Queueing**: Shell commands proposed by the agent are queued and executed only upon explicit user confirmation.

### 🔍 Comprehensive Tool Ecosystem
- **File System Operations**: Read files, search files by glob pattern and content substring, create/modify/delete files, create directories, and generate structural codebase summaries.
- **Skills System**: Discovers and interprets `SKILL.md` files located across standard agent skill directories.
- **Web Intelligence (Firecrawl)**: Integrated web search, markdown web page scraping, and HTTP fetching for real-time documentation and library lookups.

### 🔐 Secure Authentication & Persistence
- **Device Authorization Flow**: Seamless terminal login via browser verification with GitHub OAuth and session token management.
- **Persistent Conversation History**: Every interaction, plan, step execution, and agent response is stored in PostgreSQL via Prisma ORM for full auditability and multi-turn context.

---

## Tech Stack

### CLI & Backend (Server)
- **Runtime**: Node.js (ES Modules)
- **AI Integration**:
  - [Vercel AI SDK](https://sdk.vercel.ai/) (`ai` v7) — `ToolLoopAgent` and `generateObject`
  - [`@openrouter/ai-sdk-provider`](https://openrouter.ai/) — OpenRouter model provider
  - [`@mendable/firecrawl-js`](https://firecrawl.dev/) — Web search, web scraping, and content extraction
- **Backend API & Auth**:
  - [Express](https://expressjs.com/) v5
  - [Better Auth](https://www.better-auth.com/) — Device code authorization and OAuth session management
  - [Prisma ORM](https://www.prisma.io/) with PostgreSQL
- **Terminal UI & UX**:
  - [`commander`](https://github.com/tj/commander.js/) — CLI command routing and option parsing
  - [`@clack/prompts`](https://github.com/natemoo-re/clack) — Interactive terminal prompts and spinners
  - [`chalk`](https://github.com/chalk/chalk) & [`figlet`](https://github.com/patorjk/figlet.js) — Terminal styling and ASCII banners
  - [`marked`](https://marked.js.org/) & [`marked-terminal`](https://github.com/mizchi/marked-terminal) — Markdown rendering in the terminal
  - [`diff`](https://github.com/kpdecker/jsdiff) — Unified diff computation
  - [`yocto-spinner`](https://github.com/sindresorhus/yocto-spinner) — Minimal terminal spinners
  - [`zod`](https://zod.dev/) — Tool input validation schemas

### Web Client (Frontend)
- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router) with [React](https://react.dev/) 19 & TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **UI Components**: [Radix UI](https://www.radix-ui.com/) primitives with custom glassmorphism design
- **Authentication**: Better Auth React Client (`/device` verification flow and `/sign-in`)

---

## Architecture

```
                  ┌───────────────────────────────┐
                  │          Next.js Web          │
                  │   - GitHub OAuth Login        │
                  │   - Device Code Approval      │
                  │   - User Profile Dashboard    │
                  └───────────────┬───────────────┘
                                  │ (HTTP / Auth)
                                  ▼
┌─────────────────┐       ┌───────────────────────────────┐
│   Mercury CLI   │◄─────►│    Express Backend Server     │
│  (Terminal App) │       │   - Better Auth Engine        │
└────────┬────────┘       │   - Prisma ORM / PostgreSQL   │
         │                └───────────────┬───────────────┘
         │                                │
         ├─► OpenRouter AI Provider       │ (Chat History & Sessions)
         ├─► Firecrawl Web Engine         ▼
         └─► Workspace File System ┌─────────────┐
                                   │ PostgreSQL  │
                                   └─────────────┘
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **Package Manager**: [pnpm](https://pnpm.io/) (v10+ recommended)
- **Database**: PostgreSQL instance running locally or hosted (e.g. Supabase, Neon)
- **API Keys**:
  - [OpenRouter API Key](https://openrouter.ai/keys)
  - [Firecrawl API Key](https://firecrawl.dev/) *(Optional, for web search and crawling)*
  - GitHub OAuth Application credentials *(For authentication)*

---

### Installation & Setup

#### 1. Clone the repository
```bash
git clone https://github.com/TheMercury1229/MercuryCLI.git
cd MercuryCLI
```

#### 2. Install dependencies
```bash
# Install backend dependencies
cd server
pnpm install

# Install web client dependencies
cd ../client
pnpm install
```

#### 3. Configure Environment Variables

**Server Configuration (`server/.env`)**:
```env
# Application
PORT=3005
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mercury_cli"

# Better Auth
BETTER_AUTH_SECRET="your_better_auth_secret_key"
BETTER_AUTH_URL="http://localhost:3005"

# GitHub OAuth
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"

# OpenRouter AI
OPENROUTER_API_KEY="your_openrouter_api_key"
OPENROUTER_DEFAULT_MODEL="openrouter/auto"  # or anthropic/claude-3.5-sonnet, google/gemini-2.5-flash, etc.

# Firecrawl (Optional: Enables web_search, web_crawl, and fetch_url)
FIRECRAWL_API_KEY="your_firecrawl_api_key"
```

**Client Configuration (`client/.env`)**:
```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:3005"
NEXT_PUBLIC_AUTH_CALLBACK_URL="http://localhost:3000"
```

#### 4. Initialize the Database
```bash
cd server
npx prisma generate
npx prisma db push
```

#### 5. Link the CLI globally (Optional)
```bash
cd server
npm link
# or
pnpm link --global
```

---

## Running the Application

### 1. Start the Auth Server
```bash
cd server
pnpm dev
```
The server will run on `http://localhost:3005`.

### 2. Start the Web Client
```bash
cd client
pnpm dev
```
The client will run on `http://localhost:3000`.

### 3. Launch Mercury CLI
```bash
# If globally linked:
mercury-cli

# Or run directly from server folder:
cd server
node src/cli/main.js
```

---

## CLI Commands

| Command | Description |
| :--- | :--- |
| `mercury-cli login` | Initiates the device authorization flow, opens the browser to `/device`, and polls until authenticated. |
| `mercury-cli logout` | Clears stored session tokens from `~/.mercury/token.json`. |
| `mercury-cli whoami` | Displays details of the currently authenticated user and active session. |
| `mercury-cli wakeup` | Launches the interactive mode selector (**Ask**, **Agent**, or **Plan**). |

---

## AI Modes

### 1. Ask Mode (`ask`)
Designed for **read-only codebase understanding and exploration**.

- **Workflow**:
  1. Prompts for your question about the codebase.
  2. The AI reads workspace files, executes glob search queries, inspects repository statistics, or checks skills.
  3. If configured with Firecrawl, searches external documentation and URLs.
  4. Answers your questions in rendered markdown with full multi-turn conversational context saved to the database.
- **Safety**: Purely read-only; file creation, modification, deletion, and shell commands are disabled.

### 2. Agent Mode (`agent`)
Designed for **autonomous multi-step file editing and code generation**.

- **Workflow**:
  1. Enter a concrete objective or feature request.
  2. The agent autonomously inspects the codebase and stages mutations (`create_file`, `modify_file`, `delete_file`, `create_folder`, `execute_shell`).
  3. The agent presents an **Interactive Approval Flow**:
     - **Approve and apply all**: Immediately applies all staged changes to disk and runs approved commands.
     - **Review one by one**: Inspect color-coded unified diffs for every modified file, and selectively accept or reject individual changes.
     - **Cancel**: Discards all pending changes without modifying workspace files.
  4. Summaries of applied changes and execution status are recorded in the database.

### 3. Plan Mode (`plan`)
Designed for **complex, multi-phase architectural features and refactoring**.

- **Workflow**:
  1. Specify your high-level goal.
  2. The AI performs preliminary research and outputs a structured **Research Summary** and **Ordered Execution Plan**.
  3. An interactive multi-select prompt lets you choose exactly which steps you want to execute.
  4. Mercury CLI executes the selected steps sequentially using the full tool suite.
  5. Presents a staged approval flow with diffs before applying any changes to disk.

---

## Available Tools

Mercury CLI equips its AI agents with a comprehensive suite of tools defined using Zod schemas:

| Tool | Category | Description |
| :--- | :--- | :--- |
| `read_file` | File System | Reads full contents of a file relative to the workspace root. |
| `create_file` | File System | Stages creation of a new file with content. |
| `modify_file` | File System | Stages full-file replacement for an existing file. |
| `delete_file` | File System | Stages deletion of a target file. |
| `create_folder` | File System | Stages creation of directory trees (`mkdir -p`). |
| `list_files` | File System | Lists files and subdirectories, with optional recursive traversal. |
| `search_files` | File System | Searches files by glob pattern (`*.ts`, `**/*.md`) with optional content substring matching. |
| `analyze_codebase` | Analysis | Summarizes workspace structure, file counts, sizes, and file extension distributions. |
| `execute_shell` | System | Stages execution of a terminal command in the workspace upon approval. |
| `list_skills` | Skills | Discovers `SKILL.md` files across agent skill roots. |
| `read_skill` | Skills | Reads detailed instructions from a selected skill file. |
| `web_search` | Web (Firecrawl) | Searches the web and returns ranked titles, URLs, and snippets. |
| `web_crawl` | Web (Firecrawl) | Scrapes a webpage directly into clean markdown. |
| `fetch_url` | Web | Executes HTTP GET request against a target URL. |

---

## Project Structure

```
mercury-cli/
├── server/
│   ├── prisma/
│   │   └── schema.prisma           # Prisma PostgreSQL database schema
│   ├── src/
│   │   ├── cli/
│   │   │   ├── commands/
│   │   │   │   ├── ai/
│   │   │   │   │   └── wakeup.js   # 'wakeup' command & mode router
│   │   │   │   └── auth/
│   │   │   │       ├── login.js    # Device code OAuth login
│   │   │   │       ├── logout.js   # Session logout
│   │   │   │       └── me.js       # User profile check ('whoami')
│   │   │   ├── modes/
│   │   │   │   ├── agent/          # Autonomous agent mode & approval system
│   │   │   │   │   ├── action-tracker.js # Tracks staged mutations & logs
│   │   │   │   │   ├── agent-tools.js    # Agent tool definitions
│   │   │   │   │   ├── approval.js       # Interactive diff approval flow
│   │   │   │   │   ├── diff-view.js      # Unified patch generator
│   │   │   │   │   ├── orchestrator.js   # Agent loop orchestrator
│   │   │   │   │   ├── tool-executor.js  # File & shell tool executor
│   │   │   │   │   └── types.js          # Action and config definitions
│   │   │   │   ├── ask/            # Read-only exploration mode
│   │   │   │   │   ├── ask-tools.js      # Read-only tools
│   │   │   │   │   └── orchestrator.js   # Multi-turn Q&A loop
│   │   │   │   ├── plan/           # Step-by-step planning mode
│   │   │   │   │   ├── orchestrator.js   # Plan execution orchestrator
│   │   │   │   │   ├── plan-tools.js     # Research tools
│   │   │   │   │   ├── planner.js        # Plan generation schema & AI call
│   │   │   │   │   ├── selection.js      # Step selection prompt
│   │   │   │   │   └── types.js          # Plan step definitions
│   │   │   │   ├── web-tools.js    # Firecrawl web search & crawl tools
│   │   │   │   ├── terminal-md.js  # Terminal markdown renderer
│   │   │   │   └── main.js         # Commander CLI entrypoint
│   │   │   ├── config/
│   │   │   │   ├── agent-model.js  # OpenRouter provider instance
│   │   │   │   ├── agent.config.js # Application generator config
│   │   │   │   └── ai.config.js    # OpenRouter API key & model settings
│   │   │   ├── lib/
│   │   │   │   ├── auth.js         # Better Auth server configuration
│   │   │   │   ├── db.js           # Prisma client singleton
│   │   │   │   └── token.js        # Local token management (~/.mercury)
│   │   │   ├── service/
│   │   │   │   └── chat.service.js # Persistent conversation & message storage
│   │   │   └── index.js            # Express server entrypoint
│   │   └── package.json
│   │
├── client/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   └── sign-in/        # Web sign-in page (GitHub OAuth)
│   │   │   ├── device/             # Device code verification page
│   │   │   ├── approve/            # Web approval interface
│   │   │   ├── layout.tsx          # Root layout
│   │   │   └── page.tsx            # Authenticated user dashboard
│   │   ├── components/ui/          # Radix UI + Tailwind components
│   │   └── lib/
│   │       └── auth-client.ts      # Better Auth client instance
│   └── package.json
│
├── screenshots/                    # CLI and web UI screenshots
└── README.md
```

---

## Screenshots & Interface

### Authentication Flow
**Device Code Login Flow**
![Login](./screenshots/login.png)
*CLI prompts with verification URL and user code, automatically opening the browser to authorize.*

**Authenticated User Status**
![User Info](./screenshots/whoami.png)
*View current session and identity via `mercury-cli whoami`.*

### AI Modes in Action
**Interactive Mode Selection**
![Options](./screenshots/options.png)
*Choose between Ask, Agent, and Plan modes when running `mercury-cli wakeup`.*

**Ask Mode**
![Chat with AI](./screenshots/chatwithai.png)
*Explore your codebase with multi-turn conversation and real-time tool tracking.*

**Agent & Plan Modes**
![AI Tools](./screenshots/aitools.png)
*Autonomous tool execution with live step-by-step progress.*

**Staged Code Modifications**
![AI Agent](./screenshots/aiagent.png)
*Review generated file trees and unified diffs before applying changes.*

---

## Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## License

This project is licensed under the [ISC License](LICENSE).
