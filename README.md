# MCP Time Server - Streamable HTTP

⚠️ **This Server is for Demo and Testing Purposes** ⚠️

This is a **bare bones example server** designed for testing MCP Streamable HTTP protocol functionality. It is **NOT intended for production use** and lacks proper authentication and security measures.

---

A Model Context Protocol (MCP) server providing time-related tools, implemented as a Cloudflare Worker.

This server allows LLMs to access various date/time functions.

## Features

Provides the following MCP tools:

*   `current_time`: Get the current date and time in specified formats and timezones.
*   `relative_time`: Get a human-readable relative time string (e.g., "in 5 minutes", "2 hours ago").
*   `days_in_month`: Get the number of days in a specific month.
*   `get_timestamp`: Get the Unix timestamp (milliseconds) for a given time.
*   `convert_time`: Convert a time between different IANA timezones.
*   `get_week_year`: Get the week number and ISO week number for a given date.

## Project Structure

```
mcp-server-http-time/
├── src/
│   └── index.ts      # Cloudflare Worker entry point & MCP logic
├── package.json      # Project dependencies and scripts
├── tsconfig.json     # TypeScript configuration
└── wrangler.toml     # Cloudflare Worker configuration
```

## Getting Started

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Cam10001110101/mcp-server-http-time.git
    cd mcp-server-http-time
    ```

## Development

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Build:**
    Compile the TypeScript code:
    ```bash
    npm run build
    ```
    (This compiles `src/index.ts` to `dist/index.js`)

3.  **Local Development (using Wrangler):**
    Run the worker locally for testing:
    ```bash
    npx wrangler dev
    ```
    This will typically start the server on `http://localhost:8787`. You can then point your MCP client configuration to this local endpoint.

## Deployment

### Configuration

Before deploying, you need to configure your Cloudflare Worker:

1. Copy the example configuration file:
   ```bash
   cp wrangler.toml.example wrangler.toml
   ```

2. Edit `wrangler.toml` to configure your domain (optional):
   - Uncomment and modify the `[[routes]]` section if you want to use a custom domain
   - Replace `your-subdomain.your-domain.com` with your actual domain
   - Update `zone_name` with your domain

### Deploy

Deploy the worker to Cloudflare:

```bash
npx wrangler deploy
```
(Ensure you are logged into Cloudflare via `wrangler login` first).

## Connectors for Streamable HTTP Servers

**NEW**: Major providers have adopted the Model Context Protocol and now support Streamable HTTP servers directly. Anthropic, OpenAI, and Microsoft have all adopted this modern transport protocol.

> **📋 Protocol Note**: Streamable HTTP is the modern replacement for the deprecated HTTP+SSE transport.

#### Anthropic MCP Connector

Anthropic's [MCP Connector](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector) allows you to use Streamable HTTP servers directly through the Messages API without needing a separate MCP client.

The MCP Connector is perfect for this server since it uses the Streamable HTTP architecture. Simply include the server in your API requests:

```bash
curl https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: mcp-client-2025-04-04" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1000,
    "messages": [{
      "role": "user", 
      "content": "What time is it in Tokyo?"
    }],
    "mcp_servers": [{
      "type": "url",
      "url": "https://your.worker.url.workers.dev",
      "name": "http-time-server"
    }]
  }'
```

#### Anthropic MCP Connector Benefits:
- **No client setup required** - Connect directly through the API
- **Native Streamable HTTP support** - Designed for servers like this one

#### OpenAI Agents SDK

OpenAI also supports Streamable HTTP servers through their [Agents SDK](https://openai.github.io/openai-agents-python/ref/mcp/server/#agents.mcp.server.MCPServerStreamableHttp) using the `MCPServerStreamableHttp` class:

```python
from agents.mcp.server import MCPServerStreamableHttp

# Connect to this Streamable HTTP server
server = MCPServerStreamableHttp({
    "url": "https://your.worker.url.workers.dev",
    "headers": {"Authorization": "Bearer your-token"},  # if needed
})

# Use the server in your OpenAI agent
await server.connect()
tools = await server.list_tools()
result = await server.call_tool("current_time", {"timezone": "Asia/Tokyo"})
```

#### Microsoft Copilot Studio

Microsoft Copilot Studio now supports Streamable HTTP servers with [MCP integration generally available](https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/model-context-protocol-mcp-is-now-generally-available-in-microsoft-copilot-studio/). You can connect this server to Copilot Studio by:

1. **Building a custom connector** that links your MCP server to Copilot Studio
2. **Adding the tool in Copilot Studio** by selecting 'Add a Tool' and searching for your MCP server
3. **Using the server directly** in your agents with generative orchestration enabled

#### More MCP Clients Coming Soon

Keep an eye out as more MCP clients adopt support for Streamable HTTP. Here are a few resources that maintain lists of MCP clients and their capabilities:

- [PulseMCP Client Directory](https://www.pulsemcp.com/clients) - Comprehensive list of MCP clients
- [Official MCP Servers Repository](https://github.com/modelcontextprotocol/servers) - Official collection including client information
- [MCP.so Client Listings](https://mcp.so/?tab=clients) - Community-maintained client directory

---

## Authentication & Security Considerations

⚠️ **IMPORTANT: This example server has NO authentication or security measures implemented.**

For production MCP servers, you should implement proper authentication as outlined in the [official MCP documentation](https://modelcontextprotocol.io/introduction#authentication)
