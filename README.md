# MCP Time Server

A Model Context Protocol (MCP) server providing time-related tools with **dual-mode support**:
- **Stdio transport** for local MCP clients (via npm)
- **Streamable HTTP transport** for remote access (via Cloudflare Workers)

This server allows LLMs to access various date/time functions through multiple connection methods.

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
mcp-time/
├── src/
│   └── index.ts      # Cloudflare Worker entry point & MCP logic
├── package.json      # Project dependencies and scripts
├── tsconfig.json     # TypeScript configuration
└── wrangler.toml     # Cloudflare Worker configuration
```

## Installation

### Option 1: Install from npm (Stdio Mode)

Install the package globally or use with npx:

```bash
# Global installation
npm install -g @cbuk100011/mcp-time

# Or use directly with npx
npx @cbuk100011/mcp-time
```

### Option 2: Use Remote Server (HTTP Mode)

Connect directly to the deployed Cloudflare Worker:  
  
Example:
```
https://mcp.time.mcpcentral.io
```

## Usage

### Stdio Transport (Local)

Configure your MCP client (e.g., Claude Desktop) to use the stdio transport:

```json
{
  "mcpServers": {
    "time-server": {
      "command": "npx",
      "args": ["@cbuk100011/mcp-time"]
    }
  }
}
```

Or with global installation:
```json
{
  "mcpServers": {
    "time-server": {
      "command": "/path/to/node/bin/mcp-time"
    }
  }
}
```

### Streamable HTTP Transport (Remote)

Configure your MCP client to use the remote HTTP endpoint:

```json
{
  "mcpServers": {
    "time-server": {
      "url": "https://mcp.time.mcpcentral.io",
      "transport": "streamable-http"
    }
  }
}
```

## Development

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Cam10001110101/mcp-server-http-time.git
    cd mcp-server-http-time
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Build:**
    Compile the TypeScript code:
    ```bash
    npm run build
    ```
    (This compiles `src/index.ts` to `dist/index.js`)

4.  **Test Locally:**

    **Test Stdio Mode:**
    ```bash
    echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node dist/index.js
    ```

    **Test HTTP Mode (via Wrangler):**
    ```bash
    npx wrangler dev
    ```
    This will start the server on `http://localhost:8787`. You can then test with curl or point your MCP client to this local endpoint.

## Deployment

### Deploy to Cloudflare Workers (HTTP Mode)

1. **Configure Cloudflare:**
   ```bash
   cp wrangler.toml.example wrangler.toml
   ```
   Edit `wrangler.toml` to configure your domain (optional).

2. **Login and Deploy:**
   ```bash
   wrangler login
   npx wrangler deploy
   ```

### Publish to npm (Stdio Mode)

1. **Build the package:**
   ```bash
   npm run build
   ```

2. **Publish:**
   ```bash
   npm publish --access public
   ```

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

## Testing and Validation

### MCP Inspector (HTTP Mode)

The official [MCP Inspector](https://github.com/modelcontextprotocol/inspector) tool provides a web-based interface to test your server.

1. **Start your server:**
   ```bash
   # Local HTTP server
   npx wrangler dev

   # Or use deployed URL: https://mcp.time.mcpcentral.io
   ```

2. **Open MCP Inspector:**
   - Visit: https://github.com/modelcontextprotocol/inspector
   - Or run: `npx @modelcontextprotocol/inspector`

3. **Configure connection:**
   - Transport: **Streamable HTTP**
   - URL: `http://localhost:8787` or `https://mcp.time.mcpcentral.io`
   - Click **Connect**

### Command Line Testing (Stdio Mode)

Test the stdio transport directly:

```bash
# Test initialization
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | npx @cbuk100011/mcp-time

# Test tool call
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"current_time","arguments":{"timezone":"America/New_York"}}}' | npx @cbuk100011/mcp-time
```

### Available Tools to Test

The inspector will show all six time-related tools:

- **`current_time`**: Test with different timezones (e.g., "America/New_York", "Europe/London")
- **`relative_time`**: Test with various time strings (e.g., "2024-12-25T00:00:00Z")
- **`days_in_month`**: Test with different months and years
- **`get_timestamp`**: Convert date-time strings to Unix timestamps
- **`convert_time`**: Convert between different timezones
- **`get_week_year`**: Get week numbers for specific dates

### Example Test Cases

Try these test cases in the inspector:

```json
// current_time
{"timezone": "Asia/Tokyo", "format": "iso"}

// relative_time  
{"time": "2024-12-25T00:00:00Z"}

// days_in_month
{"month": 2, "year": 2024}

// get_timestamp
{"time": "2024-06-15T12:00:00Z"}

// convert_time
{"time": "2024-06-15T12:00:00", "from": "UTC", "to": "America/Los_Angeles"}

// get_week_year
{"date": "2024-06-15"}
```

### Validation Checklist

Use the inspector to verify:

- ✅ Server connects successfully
- ✅ All 6 tools are listed
- ✅ Tool schemas are properly defined
- ✅ Tools execute without errors
- ✅ Results are formatted correctly
- ✅ Error handling works for invalid inputs

The MCP Inspector provides the most comprehensive way to test your server before integrating it with AI clients.

---

## Authentication & Security Considerations

⚠️ **IMPORTANT: This example server has NO authentication or security measures implemented.**

For production MCP servers, you should implement proper authentication as outlined in the [official MCP documentation](https://modelcontextprotocol.io/introduction#authentication)
