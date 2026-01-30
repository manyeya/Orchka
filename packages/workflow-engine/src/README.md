# BullMQ Implementation for Orchka

This directory contains the BullMQ-based orchestration engine that replaces Inngest for workflow execution.

## Architecture

```
┌─────────────────────────────────────────┐
│       BullMQ Setup               │
│  - Queues (workflows, nodes)     │
│  - FlowProducer                  │
│  - QueueEvents                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Workflow Orchestrator           │
│  - Execute workflow logic         │
│  - Handle control flow           │
│  - Manage node execution         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Workers                     │
│  - Workflow Worker               │
│  - Node Worker                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Redis Pub/Sub                  │
│  - Real-time events             │
│  - Execution history             │
└─────────────────────────────────────────┘
```

## File Structure

- `setup.ts` - BullMQ queues, FlowProducer, and QueueEvents configuration
- `types.ts` - TypeScript types for BullMQ execution (replaces Inngest types)
- `orchestrator.ts` - Workflow execution logic (replaces `inngest/functions.ts`)
- `publisher.ts` - Redis pub/sub for real-time updates
- `events.ts` - QueueEvents listeners for job lifecycle monitoring
- `workers.ts` - Worker setup for processing jobs

## Key Components

### 1. Queues

- **workflowQueue** - Orchestrates workflow execution
- **nodeQueue** - Processes individual node executions
- **webhookQueue** - Handles webhook-triggered workflows

### 2. FlowProducer

Manages parent-child job dependencies for complex workflows:
- Linear execution (A → B → C)
- Parallel execution (A + B + C)
- Conditional branching (IF/SWITCH)
- Loop patterns

### 3. Real-time Updates

Replaces Inngest realtime middleware:
- Redis pub/sub for live execution updates
- SSE endpoint: `/api/bullmq/stream/[id]`
- Event history for late-joiner support

### 4. Job Schedulers

Replaces Inngest scheduled workflows:
- Cron patterns for recurring workflows
- Interval-based triggers
- End date support

## API Routes

### Manual Execution
`POST /api/bullmq/execute`

```typescript
{
  "workflowId": "workflow-123",
  "initialData": { ... } // optional
}

// Response
{
  "success": true,
  "executionId": "exec_123456_abc",
  "jobId": "bull-job-123"
}
```

### Webhook Trigger
`POST /api/bullmq/webhook/[id]`

Receives webhooks for workflows with webhook trigger nodes. Payload and headers are passed to workflow execution.

### Real-time Stream
`GET /api/bullmq/stream/[id]`

Server-Sent Events endpoint for frontend real-time updates:
- Job lifecycle events
- Node execution updates
- Progress updates
- Error notifications

## Worker Setup

Start workers in your application entry point:

```typescript
import { startWorkflowWorker, startNodeWorker, setupQueueEvents } from '@/bullmq/workers';

async function main() {
  setupQueueEvents();
  startWorkflowWorker();
  startNodeWorker();
}

main();
```

## Configuration

Add to `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
# OR
REDIS_URL=redis://localhost:6379
```

## Migration Status

### Completed ✅

1. **BullMQ Setup** - Queues, FlowProducer, QueueEvents configured
2. **Workflow Orchestrator** - Execution logic ported from Inngest
3. **Control Flow** - IF/SWITCH/LOOP/WAIT nodes implemented with BullMQ
4. **Real-time Updates** - Redis pub/sub replaces Inngest realtime
5. **Workers** - Workflow and node workers created
6. **API Routes** - Manual execution and webhook triggers
7. **Queue Events** - Job lifecycle monitoring set up

### Remaining ⏳

1. **Job Schedulers** - Cron triggers for scheduled workflows
2. **Node Executor Refactor** - Update 11 executors to work without Inngest step tools
3. **Frontend Updates** - Update to use Redis pub/sub instead of Inngest realtime
4. **Wait Node** - Implement durable sleep with delayed jobs
5. **End-to-end Testing** - Full workflow execution testing

## Differences from Inngest

| Feature | Inngest | BullMQ |
|----------|----------|---------|
| Durable execution | Built-in | Manual implementation |
| Step checkpointing | Automatic | Custom (Redis-based) |
| Event triggers | Native | Job Schedulers |
| Real-time | Native middleware | Redis pub/sub |
| Retry logic | Built-in | Built-in (more configurable) |
| Rate limiting | Automatic | Manual configuration |

## Next Steps

1. Set up Redis server (or use Redis Cloud)
2. Run workers: `node -e require=./bullmq/workers.js`
3. Update frontend to consume SSE endpoint
4. Test workflow execution
5. Implement Job Schedulers for cron triggers
6. Refactor node executors for full BullMQ compatibility
