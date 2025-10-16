# Prolibu Script Builder Documentation

This documentation covers the event-driven architecture, script execution models, and integration patterns used in the Prolibu platform.

## 📚 Table of Contents

- [Event System Overview](#event-system-overview)
- [Event Types](#event-types)
- [Examples & Use Cases](#examples--use-cases)

## Event System Overview

The Prolibu Script Builder uses an event-driven architecture where scripts are triggered by specific events in the platform. Scripts can respond to API calls, scheduled tasks, custom endpoints, and entity lifecycle changes.

### How It Works

```mermaid
flowchart TB
    subgraph External["Triggers"]
        API["HTTP POST /v2/script/run<br/>🌐 Direct API Call"]
        ENDPOINT["HTTP CALL /v2/endpoint/{method}/{route}<br/>🔗 Custom Endpoint"]
        CRON["Periodic Scheduled Task<br/>⏰ Cron Job"]
        LIFECYCLE["Lifecycle Hooks<br/>📝 CRUD Db Change<br/><br/>Triggers one of 6 events:<br/>• Entity.beforeCreate<br/>• Entity.afterCreate<br/>• Entity.beforeUpdate<br/>• Entity.afterUpdate<br/>• Entity.beforeDelete<br/>• Entity.afterDelete"]
    end

    subgraph EventNames["Event Names"]
        API_NAME["ApiRun"]
        ENDPOINT_NAME["EndpointRequest"]
        CRON_NAME["ScheduledTask"]
        LIFECYCLE_NAME["Entity.[action]"]
    end

    subgraph EventData["Event Data Structure"]
        API_DATA["eventData: {<br/>  query: {...},<br/>  body: {...}<br/>}"]
        ENDPOINT_DATA["eventData: {<br/>  endpoint: {...},<br/>  authenticated: Boolean,<br/>  headers: {...},<br/>  query: {...},<br/>  body: {...}<br/>}"]
        CRON_DATA["eventData: {<br/>  scheduledAt: Date,<br/>  periodicity: String<br/>}"]
        LIFECYCLE_DATA["eventData: {<br/>  doc: {...},<br/>  payload: {...},<br/>  beforeUpdateDoc: {...}<br/>}"]
    end

    subgraph Engine["Script Execution Engine"]
        EXECUTE_API["Execute Script"]
        EXECUTE_ENDPOINT["Execute Script"]
        EXECUTE_CRON["Execute Script"]
        EXECUTE_LIFECYCLE["Execute Script"]
    end

    subgraph Responses["Responses"]
        direction LR
        subgraph HTTPResponses["HTTP Responses"]
            API_RESULT["ApiRun - HTTP 200 always<br/><br/>✅ Success:<br/>{<br/>  output: {...},<br/>  error: null,<br/>  stack: undefined<br/>}<br/><br/>❌ Error:<br/>{<br/>  error: 'message',<br/>  stack: '...'<br/>}"]
            
            ENDPOINT_RESULT["EndpointRequest - Variable Status<br/><br/>✅ 200 Success:<br/>{<br/>  authenticated: Boolean,<br/>  output: {...}<br/>}<br/><br/>❌ 400 Error:<br/>{<br/>  error: 'message',<br/>  stack: '...'<br/>}<br/><br/>❌ 401 Unauthorized - If Auth Required"]
        end

        subgraph SystemResponses["System Responses"]
            TASK_RESULT["ScheduledTask - No HTTP Response<br/><br/>✅ Success:<br/>Logged to system<br/><br/>❌ Error throw:<br/>Logged to system logs"]
            
            HOOK_RESULT["Lifecycle Hooks - No HTTP Response<br/><br/>✅ Success:<br/>Side effects execute<br/><br/>❌ Error in 'before' hooks:<br/>BLOCKS execution cycle<br/><br/>❌ Error in 'after' hooks:<br/>Logged, cycle continues"]
        end
    end

    API --> API_NAME
    ENDPOINT --> ENDPOINT_NAME
    CRON --> CRON_NAME
    LIFECYCLE --> LIFECYCLE_NAME

    API_NAME --> API_DATA
    ENDPOINT_NAME --> ENDPOINT_DATA
    CRON_NAME --> CRON_DATA
    LIFECYCLE_NAME --> LIFECYCLE_DATA

    API_DATA --> EXECUTE_API
    ENDPOINT_DATA --> EXECUTE_ENDPOINT
    CRON_DATA --> EXECUTE_CRON
    LIFECYCLE_DATA --> EXECUTE_LIFECYCLE

    EXECUTE_API --> API_RESULT
    EXECUTE_ENDPOINT --> ENDPOINT_RESULT
    EXECUTE_CRON --> TASK_RESULT
    EXECUTE_LIFECYCLE --> HOOK_RESULT

    style API fill:#0091EA,stroke:#01579B,color:#fff
    style ENDPOINT fill:#6A1B9A,stroke:#4A148C,color:#fff
    style CRON fill:#FF6F00,stroke:#E65100,color:#fff
    style LIFECYCLE fill:#2E7D32,stroke:#1B5E20,color:#fff
    
    style API_NAME fill:#0091EA,stroke:#01579B,color:#fff
    style ENDPOINT_NAME fill:#6A1B9A,stroke:#4A148C,color:#fff
    style CRON_NAME fill:#FF6F00,stroke:#E65100,color:#fff
    style LIFECYCLE_NAME fill:#2E7D32,stroke:#1B5E20,color:#fff
    
    style API_DATA fill:#0091EA,stroke:#01579B,color:#fff
    style ENDPOINT_DATA fill:#6A1B9A,stroke:#4A148C,color:#fff
    style CRON_DATA fill:#FF6F00,stroke:#E65100,color:#fff
    style LIFECYCLE_DATA fill:#2E7D32,stroke:#1B5E20,color:#fff

    style EXECUTE_API fill:#0091EA,stroke:#01579B,color:#fff
    style EXECUTE_ENDPOINT fill:#6A1B9A,stroke:#4A148C,color:#fff
    style EXECUTE_CRON fill:#FF6F00,stroke:#E65100,color:#fff
    style EXECUTE_LIFECYCLE fill:#2E7D32,stroke:#1B5E20,color:#fff

    style API_RESULT fill:#0091EA,stroke:#01579B,color:#fff
    style ENDPOINT_RESULT fill:#6A1B9A,stroke:#4A148C,color:#fff
    style TASK_RESULT fill:#FF6F00,stroke:#E65100,color:#fff
    style HOOK_RESULT fill:#2E7D32,stroke:#1B5E20,color:#fff
```

## Understanding the Event Flow

The diagram above shows how each event type flows through the system in 5 distinct levels:

1. **External Triggers** - The initial action that starts the event (HTTP request, cron tick, or database change)
2. **Event Names** - The system assigns a specific `eventName` identifier to categorize the event
3. **Event Data Structure** - Each event type carries different data in the `eventData` object
4. **Script Execution Engine** - Your custom script code runs with access to the eventData
5. **Responses** - The system returns different response formats depending on the event type

### Response Types

The platform uses two distinct response mechanisms:

**HTTP Responses** (Left side - Blue & Purple)
- **ApiRun**: Always returns HTTP 200 with success/error in the body
- **EndpointRequest**: Returns variable HTTP status codes (200, 400, 401) based on execution

**System Responses** (Right side - Orange & Green)
- **ScheduledTask**: No HTTP response, execution is logged to the system
- **Lifecycle Hooks**: No HTTP response, triggers side effects or blocks execution on errors

## Event Types

The platform supports 4 main event types:

| Event Type | Event Name | Trigger | Response Type | Documentation |
|------------|------------|---------|---------------|---------------|
| **ApiRun** | `'ApiRun'` | `/v2/script/run` endpoint | HTTP 200 (always) | [Details](./events/01-api-run.md) |
| **EndpointRequest** | `'EndpointRequest'` | `/v2/endpoint/{method}/{route}` | HTTP (200/400/401) | [Details](./events/03-endpoint-request.md) |
| **ScheduledTask** | `'ScheduledTask'` | Cron scheduler | System Logs | [Details](./events/02-scheduled-task.md) |
| **Lifecycle Hooks** | `'Entity.[action]'` | Entity CRUD operations | System (6 variations) | [Details](./events/04-lifecycle-hooks.md) |

## Event System Features

### 🔄 Event-Driven Architecture
- Asynchronous event processing
- Non-blocking execution model

### 🔐 Security
- API key authentication for HTTP events
- Script-level access control

### 📊 Monitoring & Logging
- Real-time log streaming via WebSockets
- Structured error handling
- Performance metrics

### 🔌 Integration Patterns
- Outbound API adapters (Salesforce, HubSpot)
- Data mapping and transformation
- Bidirectional synchronization

## Examples & Use Cases

### Real-World Implementations

The codebase includes production-ready examples:

- **[Salesforce Integration](../accounts/dev10.prolibu.com/hook-integrations/outbound-salesforce.js)** - Bidirectional sync using lifecycle hooks
- **[HubSpot Integration](../accounts/dev10.prolibu.com/hook-integrations/outbound-hubspot.js)** - CRM synchronization with OAuth2
- **[Scheduled Reports](../accounts/dev10.prolibu.com/hook-integrations/)** - Automated data processing

### Common Patterns

1. **Data Synchronization**: Sync entities between Prolibu and external systems using lifecycle hooks
2. **Scheduled Processing**: Run periodic tasks like reports, cleanups, or aggregations
3. **Custom APIs**: Expose custom business logic through dedicated endpoints
4. **Webhooks**: Receive and process external webhook events

## Getting Started

1. **Understand Event Types**: Start with the [Events Overview](./events/README.md)
2. **Choose Your Event Type**: Pick the appropriate event type for your use case
3. **Follow the Examples**: Reference the detailed documentation for each event type
4. **Test Your Script**: Use the `/v2/script/run` endpoint or watch mode for development

## Additional Resources

- **[API Adapters](../lib/vendors/)** - Vendor-specific API implementations
- **[Data Mappers](../lib/vendors/prolibu/)** - Field mapping utilities
- **[Test Examples](../accounts/dev10.prolibu.com/hook-integrations/test/)** - Integration test suites
