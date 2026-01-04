# Orchka

A powerful, developer-first workflow automation platform. Design, execute, and monitor complex workflows through a high-performance visual interface. Built for performance, observability, and AI-native automation.

[Documentation](docs-site) • [Getting Started Guide](docs-site/content/docs/getting-started.mdx) • [Node Reference](docs-site/content/docs/nodes.mdx)

## Features

### Visual Workflow Editor
- **Intuitive Canvas**: Drag-and-drop interface powered by React Flow for building workflows
- **Step Connections**: Clean, right-angled connections for easy readability
- **Node Palette**: Organized nodes with search functionality
- **Organization Tools**: Group nodes with automatic child movement and add annotations (sticky notes)
- **Advanced Interaction**: Resizable nodes and improved canvas performance

### AI Integration
- **AI Agent Nodes**: Connect AI agents with tool calling for intelligent automation
- **Simplified Configuration**: Modular tool architecture using connected `AI_TOOL` nodes
- **AI Generate**: Simple text generation for content creation and transformation
- **AI Classify**: Categorize content with structured output (sentiment, intent, priority)
- **Multiple Providers**: Support for OpenAI, Anthropic, and Google AI
- **Smart Automation**: AI-driven decision making and workflow execution

### Expression Engine
- **JSONata Support**: Transform data dynamically between nodes
- **Data Mapping**: Map and transform outputs to inputs seamlessly
- **Conditional Logic**: Complex expressions for branching and filtering

### Real-time Execution & Monitoring
- **Enhanced Execution View**: Detailed execution history with a visual trace timeline
- **Trace Timeline**: D3-powered visualization of step durations and execution flow
- **Payload Viewer**: Deep inspection of input/output data with a premium JSON viewer
- **Live Updates**: Watch workflows execute with real-time status updates
- **Background Processing**: Reliable execution with Inngest for job queuing
- **Error Handling**: Robust retry mechanisms and error recovery


### Node Types
- **Triggers**: Manual Trigger, Webhook Trigger
- **Actions**: HTTP Request
- **AI**: AI Agent, AI Generate, AI Classify, AI Tool
- **Control**: Condition (If), Switch, Wait, Loop

### Credential Management
- **Secure Storage**: AES-256-GCM encryption for API keys and tokens
- **Multiple Types**: API Key, Basic Auth, Bearer Token, OAuth2, and AI provider credentials
- **Node Integration**: Reference credentials in HTTP Request and AI Agent nodes
- **Credential Testing**: Validate credentials before use in workflows

## Tech Stack

- **Frontend**: Next.js 15 (Turbopack), React 19, TypeScript
- **Workflow Canvas**: React Flow (@xyflow/react) 12
- **Observability**: D3.js (Trace Timelines), @uiw/react-json-view (Payload Inspection)
- **Styling**: Tailwind CSS 4, shadcn/ui, Framer Motion, GSAP
- **Backend**: Next.js API routes, tRPC 11
- **Database**: PostgreSQL with Prisma ORM 6
- **Authentication**: Better Auth with Polar integration
- **AI**: AI SDK, LangChain (OpenAI, Anthropic, Google Gemini, Groq)
- **Job Processing**: Inngest
- **Expression Engine**: JSONata
- **State Management**: Jotai, TanStack Query 5
- **Forms**: React Hook Form, Zod

## Getting Started

### Prerequisites

- Bun runtime
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/manyeya/flowbase.git
cd flowbase
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Configure the following environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Random secret for authentication
- `BETTER_AUTH_URL`: Your app URL
- `CREDENTIAL_ENCRYPTION_KEY`: 64-character hex key for credential encryption (generate with `openssl rand -hex 32`)
- `OPENAI_API_KEY`: OpenAI API key (optional, can use stored credentials)
- `ANTHROPIC_API_KEY`: Anthropic API key (optional, can use stored credentials)
- `GOOGLE_GENERATIVE_AI_API_KEY`: Google AI API key (optional, can use stored credentials)
- `GROQ_API_KEY`: Groq API key (optional)
- `INNGEST_SIGNING_KEY`: Inngest signing key
- `INNGEST_EVENT_KEY`: Inngest event key
- `INNGEST_APP_URL`: Inngest application URL

4. Set up the database:
```bash
bun run prisma migrate dev
bun run prisma generate
```

5. Start the development server:
```bash
bun run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Development Commands

```bash
# Start development server
bun run dev

# Start all services (dev server + Inngest)
bun run dev:all

# Build for production
bun run build

# Start production server
bun run start

# Run linting
bun run lint

# Database commands
bun run prisma studio    # Open Prisma Studio
bun run prisma migrate dev  # Run migrations
bun run prisma generate  # Generate Prisma client

# Inngest development
bun run inngest

# Docs site
bun run docs:dev
bun run docs:build
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages (login, register)
│   ├── (dashboard)/       # Dashboard and editor pages
│   ├── (editor)/          # Workflow editor interface
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── react-flow/       # React Flow node components
│   └── ui/               # shadcn/ui components
├── features/              # Feature-specific code
│   ├── auth/             # Authentication forms and logic
│   ├── credentials/      # Credential management (CRUD, encryption)
│   ├── editor/           # Workflow editor components
│   ├── executions/       # Execution history and monitoring
│   ├── landing-page/     # Landing page features
│   ├── nodes/            # Workflow node implementations
│   ├── payments/         # Polar payment integration
│   └── workflows/        # Workflow management
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── inngest/              # Background job functions
├── trpc/                 # tRPC routers and configuration
├── prisma/               # Database schema and migrations
└── docs-site/            # Documentation site
```

## API Documentation

The application uses tRPC for type-safe API communication. Key procedures include:

### Workflows
- `workflows.getWorkflows`: List workflows with pagination and search
- `workflows.getOneWorkflow`: Get a single workflow with nodes and connections
- `workflows.createWorkflow`: Create a new workflow with a default trigger node
- `workflows.updateWorkflow`: Update workflow nodes and connections
- `workflows.updateWorkflowName`: Update workflow name
- `workflows.removeWorkflow`: Delete a workflow
- `workflows.executeWorkflow`: Trigger workflow execution

### Credentials
- `credentials.list`: List credentials with optional type filter
- `credentials.getById`: Get credential metadata by ID
- `credentials.create`: Create a new encrypted credential
- `credentials.update`: Update credential name or data
- `credentials.delete`: Delete a credential and clear node references
- `credentials.test`: Test credential validity with the provider

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Documentation

For detailed documentation, visit the [docs site](https://github.com/manyeya/flowbase/tree/main/docs-site) or run `bun run docs:dev` locally.
