# Orchka

An AI-powered workflow automation platform that helps you build, manage, and automate complex workflows effortlessly.

## Features

### 🤖 AI-Powered Automation
- **Intelligent Workflow Execution**: Leverage Google Gemini AI for smart automation
- **Natural Language Processing**: Create workflows using conversational AI
- **Automated Decision Making**: AI-driven workflow routing and execution

### 🔄 Workflow Management
- **Visual Workflow Builder**: Intuitive drag-and-drop interface for creating workflows
- **Workflow Templates**: Pre-built templates for common automation scenarios
- **Version Control**: Track changes and versions of your workflows
- **Real-time Monitoring**: Live execution tracking and status updates

### ⚡ Execution Engine
- **Background Processing**: Reliable execution using Inngest for job queuing
- **Execution History**: Complete audit trail of all workflow runs
- **Error Handling**: Robust error recovery and retry mechanisms
- **Performance Analytics**: Detailed execution metrics and performance insights

### 🔐 Security & Authentication
- **Secure Authentication**: Built with Better Auth for enterprise-grade security
- **Role-Based Access**: Granular permissions and access control
- **Credential Management**: Secure storage and management of API keys and credentials
- **Team Collaboration**: Multi-user support with team management features

### 💳 Billing & Limits
- **Flexible Pricing**: Subscription-based pricing with Polar.sh integration
- **Usage Limits**: Configurable execution limits and quotas
- **Upgrade Options**: Seamless plan upgrades and downgrades
- **Billing History**: Transparent billing and payment tracking

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly across all devices
- **Dark/Light Themes**: Customizable theme support
- **Accessible Components**: Built with Radix UI primitives
- **Real-time Updates**: Live data synchronization with tRPC

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API routes, tRPC
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth
- **AI**: Google Gemini AI SDK
- **Job Processing**: Inngest
- **Payments**: Polar.sh
- **Monitoring**: Sentry
- **State Management**: TanStack Query

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- pnpm package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/manyeya/flowbase.git
cd flowbase
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Configure the following environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random secret for authentication
- `GOOGLE_AI_API_KEY`: Google AI API key
- `INNGEST_SIGNING_KEY`: Inngest signing key
- `POLAR_ACCESS_TOKEN`: Polar.sh access token

4. Set up the database:
```bash
pnpm prisma migrate dev
pnpm prisma generate
```

5. Start the development server:
```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Development Commands

```bash
# Start development server
pnpm dev

# Start all services (dev server + Inngest)
pnpm dev:all

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Database commands
pnpm prisma studio    # Open Prisma Studio
pnpm prisma migrate dev  # Run migrations
pnpm prisma generate  # Generate Prisma client

# Inngest development
pnpm inngest
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   │   ├── (editor)/      # Workflow editor
│   │   └── (rest)/        # REST-style pages
│   └── api/               # API routes
├── components/            # Reusable UI components
├── features/              # Feature-specific code
│   ├── auth/             # Authentication logic
│   ├── payments/         # Payment integration
│   └── workflows/        # Workflow management
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── prisma/               # Database schema and migrations
├── trpc/                 # tRPC configuration
└── inngest/              # Background job functions
```

## API Documentation

The application uses tRPC for type-safe API communication. Key endpoints include:

- `workflows.*`: Workflow CRUD operations
- `executions.*`: Execution management
- `credentials.*`: Credential management
- `auth.*`: Authentication operations

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@orchka.com or join our Discord community.

## Roadmap

- [ ] Advanced workflow branching and conditional logic
- [ ] Third-party integrations (Slack, Discord, Zapier)
- [ ] Mobile application
- [ ] Advanced analytics and reporting
- [ ] Multi-tenant architecture
- [ ] Custom workflow actions and triggers
