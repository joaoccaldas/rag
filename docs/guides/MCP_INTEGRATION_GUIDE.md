# Model Context Protocol (MCP) Integration Guide

## What is MCP?

The Model Context Protocol (MCP) is a standardized protocol for connecting AI models to external tools, data sources, and services. It enables AI assistants to access real-time information and perform actions beyond their training data.

## Available MCP Servers

### Official MCP Servers

1. **File System Server**
   - Purpose: Read and manage local files
   - Installation: `npm install @modelcontextprotocol/server-filesystem`
   - Use case: Document analysis, code review

2. **Web Search Server**
   - Purpose: Search the web using various search engines
   - Installation: `npm install @modelcontextprotocol/server-web-search`
   - Use case: Real-time information retrieval

3. **Database Server**
   - Purpose: Connect to SQL databases
   - Installation: `npm install @modelcontextprotocol/server-database`
   - Use case: Query business data, analytics

4. **Git Server**
   - Purpose: Interact with Git repositories
   - Installation: `npm install @modelcontextprotocol/server-git`
   - Use case: Code management, version control

5. **Memory Server**
   - Purpose: Persistent memory across conversations
   - Installation: `npm install @modelcontextprotocol/server-memory`
   - Use case: Remember user preferences, context

### Community MCP Servers

1. **Weather Server**
   - Purpose: Get weather information
   - Repository: `https://github.com/modelcontextprotocol/servers/tree/main/src/weather`
   - Use case: Weather forecasts and conditions

2. **Calendar Server**
   - Purpose: Manage calendar events
   - Repository: `https://github.com/modelcontextprotocol/servers/tree/main/src/calendar`
   - Use case: Schedule management

3. **Email Server**
   - Purpose: Send and read emails
   - Repository: `https://github.com/modelcontextprotocol/servers/tree/main/src/email`
   - Use case: Email automation

## Implementation Steps for Miele Dashboard

### 1. Install MCP Client

```bash
npm install @modelcontextprotocol/sdk
```

### 2. Create MCP Configuration

Create `mcp-config.json`:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["./node_modules/@modelcontextprotocol/server-filesystem/dist/index.js"],
      "env": {
        "ALLOWED_DIRECTORIES": ["./data", "./uploads"]
      }
    },
    "web-search": {
      "command": "node",
      "args": ["./node_modules/@modelcontextprotocol/server-web-search/dist/index.js"],
      "env": {
        "SEARCH_ENGINE": "duckduckgo"
      }
    },
    "memory": {
      "command": "node",
      "args": ["./node_modules/@modelcontextprotocol/server-memory/dist/index.js"]
    }
  }
}
```

### 3. Create MCP Client Wrapper

```typescript
// src/lib/mcp-client.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

class MCPManager {
  private clients: Map<string, Client> = new Map()
  
  async initializeServer(name: string, config: any) {
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: config.env
    })
    
    const client = new Client({
      name: `miele-dashboard-${name}`,
      version: '1.0.0'
    }, {
      capabilities: {
        tools: {},
        resources: {}
      }
    })
    
    await client.connect(transport)
    this.clients.set(name, client)
    return client
  }
  
  async callTool(serverName: string, toolName: string, args: any) {
    const client = this.clients.get(serverName)
    if (!client) {
      throw new Error(`MCP server '${serverName}' not initialized`)
    }
    
    return await client.callTool({ name: toolName, arguments: args })
  }
  
  async getResources(serverName: string) {
    const client = this.clients.get(serverName)
    if (!client) {
      throw new Error(`MCP server '${serverName}' not initialized`)
    }
    
    return await client.listResources()
  }
}

export const mcpManager = new MCPManager()
```

### 4. Integrate with Chat API

```typescript
// src/app/api/chat/route.ts (additions)
import { mcpManager } from '@/lib/mcp-client'

// Add to chat processing
if (message.includes('/search')) {
  const query = message.replace('/search', '').trim()
  const result = await mcpManager.callTool('web-search', 'search', { query })
  // Process search results and add to context
}

if (message.includes('/memory')) {
  const content = message.replace('/memory', '').trim()
  await mcpManager.callTool('memory', 'store', { 
    key: 'user_preference', 
    value: content 
  })
}
```

### 5. Add MCP Commands to Chat

Available chat commands:
- `/search [query]` - Search the web
- `/memory [store|recall] [content]` - Store or recall information
- `/files [list|read] [path]` - Interact with files
- `/weather [location]` - Get weather information

## Benefits of MCP Integration

1. **Real-time Data**: Access current information beyond training data
2. **Tool Integration**: Connect to existing business tools and APIs
3. **Persistent Memory**: Remember user context across sessions
4. **Extensibility**: Easy to add new capabilities
5. **Standardization**: Common protocol across different AI providers

## Security Considerations

1. **Sandboxing**: Restrict file system access to specific directories
2. **Authentication**: Implement proper auth for external services
3. **Rate Limiting**: Prevent abuse of external APIs
4. **Input Validation**: Sanitize all inputs to MCP servers
5. **Logging**: Track all MCP interactions for audit

## Next Steps for Implementation

1. **Phase 1**: Install MCP SDK and basic file system server
2. **Phase 2**: Add web search capabilities
3. **Phase 3**: Implement memory persistence
4. **Phase 4**: Create custom MCP server for Miele product data
5. **Phase 5**: Add calendar and email integration

## Custom MCP Server for Miele

Create a custom MCP server specifically for Miele appliance data:

```typescript
// mcp-servers/miele-appliances/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'

const server = new Server({
  name: 'miele-appliances',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {
      "get-appliance-status": {
        description: "Get real-time status of Miele appliances",
        inputSchema: {
          type: "object",
          properties: {
            applianceId: { type: "string" }
          }
        }
      },
      "start-program": {
        description: "Start a program on a Miele appliance",
        inputSchema: {
          type: "object",
          properties: {
            applianceId: { type: "string" },
            programId: { type: "string" }
          }
        }
      }
    }
  }
})

// Implement tool handlers
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params
  
  switch (name) {
    case 'get-appliance-status':
      return await getApplianceStatus(args.applianceId)
    case 'start-program':
      return await startProgram(args.applianceId, args.programId)
  }
})
```

This guide provides a comprehensive overview of MCP integration possibilities for enhancing the Miele dashboard's AI capabilities.
