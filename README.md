# Mercury CLI

Mercury CLI is an advanced command-line interface tool that integrates powerful AI capabilities with a robust authentication system and intelligent tool calling features. It provides users with an interactive AI assistant that can perform various tasks including web searching, code execution, and application generation.

## Features

### Core Capabilities

- **AI-Powered Chat**: Interactive conversations with Google's Gemini AI model
- **Tool Integration**: Web search, code execution, and system information tools
- **Agentic Mode**: Advanced AI agent that can generate complete applications
- **User Authentication**: Secure OAuth-based authentication with session management
- **Conversation History**: Persistent chat history with database storage
- **Real-time Streaming**: Live AI response streaming for better user experience

### Chat Modes

1. **Basic Chat**: Simple AI conversation without tools
2. **Tool-Enhanced Chat**: AI with access to external tools and capabilities
3. **Agentic Mode**: AI agent that can create complete applications based on descriptions

### Available Tools

- **Web Search**: Search the web for current information and real-time data
- **Code Execution**: Execute JavaScript/Node.js code snippets safely
- **System Information**: Get system details like date, time, and basic system commands

## Tech Stack

### Backend (Server)

- **Runtime**: Node.js with ES Modules
- **AI Integration**:
  - `@ai-sdk/google` - Google Gemini AI integration
  - `ai` - Vercel AI SDK for streaming and tool calling
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth for OAuth and session management
- **CLI Framework**: Commander.js for command structure
- **UI Components**:
  - `@clack/prompts` - Interactive CLI prompts
  - `chalk` - Terminal colors and styling
  - `boxen` - Terminal boxes and layouts
  - `figlet` - ASCII art text
  - `marked` & `marked-terminal` - Markdown rendering in terminal
- **Development**:
  - `nodemon` - Development server
  - `dotenv` - Environment variable management
  - `yocto-spinner` - Loading spinners
  - `zod` - Schema validation

### Frontend (Client)

- **Framework**: Next.js 16.0.3 with React 19.2.0
- **Styling**: Tailwind CSS with custom UI components
- **UI Components**:
  - Radix UI primitives (@radix-ui/\*)
  - Custom UI component library
  - Lucide React icons
- **Authentication**: Better Auth integration
- **Development**:
  - TypeScript support
  - ESLint configuration
  - Component library with shadcn/ui style components

### Database Schema

- **Users**: User profiles with authentication data
- **Sessions**: Session management and tokens
- **Conversations**: Chat conversation storage
- **Messages**: Individual chat messages with roles and content
- **Accounts**: OAuth account linking

## Installation

### Prerequisites

- Node.js (version 18 or higher)
- PostgreSQL database
- pnpm package manager
- Google AI API key

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/TheMercury1229/MercuryCLI.git
   cd MercuryCLI
   ```

2. **Install dependencies for both server and client**

   ```bash
   # Install server dependencies
   cd server
   pnpm install

   # Install client dependencies
   cd ../client
   pnpm install
   ```

3. **Environment Configuration**

   Create a `.env` file in the server directory:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/mercury_cli"

   # Google AI
   GOOGLE_GENERATIVE_AI_API_KEY="your_google_ai_api_key_here"
   MERCURYCLI_MODEL="gemini-2.0"

   # Authentication
   BETTER_AUTH_URL="http://localhost:3000"
   BETTER_AUTH_SECRET="your_auth_secret_here"
   ```

4. **Database Setup**

   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   ```

5. **Install CLI globally (Optional)**
   ```bash
   cd server
   npm link
   # or
   pnpm link --global
   ```

### Getting Your Google AI API Key

1. Visit the [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new project or select an existing one
3. Generate an API key
4. Add the key to your `.env` file

## Usage

### Running the Application

#### Start the CLI

```bash
# If installed globally
mercury-cli

# Or run directly
cd server
node src/cli/main.js
```

#### Start the Web Client (Development)

```bash
cd client
pnpm dev
```

### CLI Commands

#### Authentication

```bash
# Log in to your account
mercury-cli login

# Check current user
mercury-cli whoami

# Log out
mercury-cli logout
```

#### AI Interaction

```bash
# Wake up the AI service and start interaction
mercury-cli wakeup
```

After running `wakeup`, you'll be presented with three options:

1. **Chat with AI**: Basic conversation mode
2. **Use AI Tool**: Enhanced chat with tool capabilities
3. **Agentic Mode**: AI agent that can generate applications

### Tool Selection

In Tool mode, you can select from:

- **Web Search**: For real-time information and current events
- **Code Execution**: For running and testing code snippets
- **System Information**: For system details and basic commands

### Example Usage

1. **Basic Chat Example**:

   ```
   You: What is the capital of France?
   AI: The capital of France is Paris.
   ```

2. **Tool-Enhanced Chat Example**:

   ```
   You: What's the weather like today?
   AI: I'll search for current weather information for you.
   [Uses web search tool]
   AI: Based on my search, here's the current weather...
   ```

3. **Agentic Mode Example**:
   ```
   You: Create a todo app with React and TailwindCSS
   AI: I'll generate a complete todo application for you...
   [Creates full application with all files, package.json, README, etc.]
   ```

## Project Structure

```
mercury-cli/
├── server/                 # Backend CLI application
│   ├── src/
│   │   ├── cli/           # CLI commands and chat interfaces
│   │   │   ├── commands/  # Authentication and AI commands
│   │   │   └── chat/      # Different chat modes
│   │   ├── service/       # AI and chat services
│   │   ├── config/        # Configuration files
│   │   └── lib/           # Utilities and database
│   ├── prisma/            # Database schema and migrations
│   └── package.json
│
├── client/                # Frontend web application
│   ├── src/
│   │   ├── app/           # Next.js app directory
│   │   ├── components/    # React components
│   │   └── lib/           # Client utilities
│   └── package.json
│
└── README.md
```

## Screenshots and Demo

### CLI Interface

#### Authentication and Setup

**Login Flow**
![Login](./screenshots/login.png)
_OAuth-based authentication flow with device authorization_

**User Information**
![User Info](./screenshots/whoami.png)
_Display current authenticated user information_

#### AI Interaction Modes

**Mode Selection**
![Options](./screenshots/options.png)
_Choose between different AI interaction modes_

**Basic Chat Mode**
![Chat with AI](./screenshots/chatwithai.png)
_Simple AI conversation without tools_

**Tool-Enhanced Chat**
![AI Tools](./screenshots/aitools.png)
_AI chat with access to web search, code execution, and system tools_

**Agentic Mode**
![AI Agent](./screenshots/aiagent.png)
_Advanced AI agent that generates complete applications_

### Key Interface Features

- **Interactive CLI**: Rich terminal interface with colors, boxes, and spinners
- **Real-time Streaming**: Live AI response streaming with markdown rendering
- **Tool Integration**: Visual feedback when AI uses tools like web search or code execution
- **Conversation History**: Persistent chat sessions with database storage
- **Error Handling**: Clear error messages and graceful failure handling

## Development

### Running in Development Mode

1. **Server Development**:

   ```bash
   cd server
   pnpm dev
   ```

2. **Client Development**:
   ```bash
   cd client
   pnpm dev
   ```

### Database Management

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma db push --force-reset

# Generate Prisma client after schema changes
npx prisma generate
```

### Adding New Tools

To add new tools to the AI system:

1. Edit `server/src/config/tool.config.js`
2. Add your tool definition using the `tool()` helper from the AI SDK
3. Include proper input schema validation with Zod
4. Implement the execute function

Example:

```javascript
{
  id: "my_tool",
  name: "My Custom Tool",
  description: "Description of what the tool does",
  getTool: () => tool({
    description: "Detailed description for AI",
    inputSchema: z.object({
      param: z.string().describe("Parameter description")
    }),
    execute: async ({ param }) => {
      // Tool implementation
      return { result: "Tool output" };
    }
  }),
  enabled: false,
}
```

## Configuration

### Environment Variables

| Variable                       | Description                           | Required |
| ------------------------------ | ------------------------------------- | -------- |
| `DATABASE_URL`                 | PostgreSQL connection string          | Yes      |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key                     | Yes      |
| `MERCURYCLI_MODEL`             | AI model to use (default: gemini-2.0) | No       |
| `BETTER_AUTH_URL`              | Authentication server URL             | Yes      |
| `BETTER_AUTH_SECRET`           | Authentication secret key             | Yes      |

### AI Model Configuration

The application supports different Gemini models:

- `gemini-2.5-flash` (default)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support and questions:

- Create an issue on GitHub
- Check existing documentation
- Review the troubleshooting section

---

Built with ❤️ using modern JavaScript, AI, and great developer tools.
