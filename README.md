# MCP Server HTTP Time

⚠️ **TESTING/EXAMPLE SERVER ONLY** ⚠️

This is a **bare bones example server** designed for testing MCP HTTP protocol functionality. It is **NOT intended for production use** and lacks proper authentication, rate limiting, and security measures.

---

A Model Context Protocol (MCP) server providing time-related tools, implemented as a Cloudflare Worker using a standard HTTP interface.

This server allows MCP clients (like AI assistants) to access various time functions.

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

Deploy the worker to Cloudflare:

```bash
npx wrangler deploy
```
(Ensure you are logged into Cloudflare via `wrangler login` first and have configured your `wrangler.toml` appropriately).

## Using with MCP Clients (Example: Claude Desktop)

---

⚠️ **Compatibility Note**

- Only a limited number of MCP clients currently support the Streamable HTTP protocol required by this server.
- The recommended way to connect is using the [mcp-remote](https://github.com/modelcontextprotocol/mcp-remote) tool as a bridge.
- The following configuration is **confirmed to work in VSCode** (and other clients that support mcp-remote):
  ```json
  "mcp-time-http-deployed": {
      "command": "npx",
      "args": [
          "mcp-remote",
          "https://mcp-server-http-time.cbrohn.workers.dev"
      ]
  }
  ```
- You do **not** need to use a `/sse` endpoint; the base URL is sufficient for mcp-remote and compatible clients.
- If your client does not support Streamable HTTP or mcp-remote, it may not be able to connect to this server.

---

To connect this server to an MCP client like Claude Desktop, you'll need to add its configuration.

### Local Development Example

Add this configuration to your Claude Desktop config file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-time-http-local": {
      "url": "http://localhost:8787" // Default wrangler dev URL
    }
    // ... other servers
  }
}
```
*(Restart Claude Desktop after adding the configuration)*

### Deployed Example

Once deployed, Cloudflare will provide a URL for your worker (e.g., `https://my-time-worker.<your-subdomain>.workers.dev`). For best compatibility with MCP clients, especially those requiring Streamable HTTP, use the following configuration (confirmed to work in VSCode):

```json
{
  "mcpServers": {
    "mcp-time-http-deployed": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp-server-http-time.cbrohn.workers.dev"
      ]
    }
    // ... other servers
  }
}
```

*(Replace the URL with your actual deployed worker URL if different.)*

#### Direct URL (for clients that support it)

Some clients may support a direct URL field:

```json
{
  "mcpServers": {
    "mcp-time-http-deployed": {
      "url": "https://mcp-server-http-time.cbrohn.workers.dev"
    }
    // ... other servers
  }
}
```

However, the mcp-remote configuration above is recommended for full protocol compatibility and is required for Streamable HTTP support.

## Authentication & Security Considerations

⚠️ **IMPORTANT: This example server has NO authentication or security measures implemented.**

For production MCP servers, you should implement proper authentication as outlined in the [official MCP documentation](https://modelcontextprotocol.io/docs):

### Recommended Security Measures for Production:

1. **API Key Authentication**: Implement API key validation for all requests
2. **Rate Limiting**: Add request rate limiting to prevent abuse
3. **CORS Configuration**: Restrict allowed origins appropriately
4. **Input Validation**: Validate and sanitize all user inputs
5. **Logging & Monitoring**: Implement comprehensive request logging
6. **Error Handling**: Avoid exposing internal error details

### MCP Connector Authentication:

When using MCP Connector for production deployments, refer to the [MCP Connector Authentication Guide](https://modelcontextprotocol.io/docs/tools/mcp-connector#authentication) for:

- Setting up secure authentication flows
- Managing API credentials
- Implementing proper access controls
- Handling authentication errors gracefully

**This example server should only be used for:**
- Testing MCP protocol functionality
- Development and debugging
- Learning MCP implementation patterns

**Do NOT use this server in production environments without implementing proper security measures.**
