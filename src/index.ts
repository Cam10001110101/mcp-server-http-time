import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import weekOfYear from 'dayjs/plugin/weekOfYear.js';
import isoWeek from 'dayjs/plugin/isoWeek.js';

// Initialize dayjs plugins
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

// Define the Worker interface (optional but good practice)
export interface Env {
  // Environment variables can be configured in wrangler.toml or via the Cloudflare dashboard
}

// Create MCP server instance
const server = new McpServer({
  name: 'mcp-server-http-time',
  version: '0.2.0',
  protocolVersion: '2025-03-26',
  capabilities: {},
});

// --- Tool Registration ---

// current_time tool
server.tool(
  'current_time',
  {
    format: z.string().default('YYYY-MM-DD HH:mm:ss').describe('The format of the time, default is empty string').optional(),
    timezone: z.string().describe('The timezone of the time, IANA timezone name, e.g. Asia/Shanghai').optional(),
  },
  async ({ format = 'YYYY-MM-DD HH:mm:ss', timezone }: { format?: string; timezone?: string }) => {
    const utcTime = dayjs.utc();
    const localTimezone = timezone ?? dayjs.tz.guess();
    const localTime = utcTime.tz(localTimezone);
    return {
      content: [
        {
          type: 'text',
          text: `Current UTC time is ${utcTime.format(format)}, and the time in ${localTimezone} is ${localTime.format(format)}.`,
        },
      ],
    };
  }
);

// relative_time tool
server.tool(
  'relative_time',
  {
    time: z.string().describe('The time to get the relative time from now. Format: YYYY-MM-DD HH:mm:ss'),
  },
  async ({ time }: { time: string }) => {
    return {
      content: [
        {
          type: 'text',
          text: dayjs(time).fromNow(),
        },
      ],
    };
  }
);

// days_in_month tool
server.tool(
  'days_in_month',
  {
    date: z.string().describe('The date to get the days in month. Format: YYYY-MM-DD').optional(),
  },
  async ({ date }: { date?: string }) => {
    const result = date ? dayjs(date).daysInMonth() : dayjs().daysInMonth();
    return {
      content: [
        {
          type: 'text',
          text: `The number of days in month is ${result}.`,
        },
      ],
    };
  }
);

// get_timestamp tool
server.tool(
  'get_timestamp',
  {
    time: z.string().describe('The time to get the timestamp. Format: YYYY-MM-DD HH:mm:ss').optional(),
  },
  async ({ time }: { time?: string }) => {
    const result = time ? dayjs(time).valueOf() : dayjs().valueOf();
    return {
      content: [
        {
          type: 'text',
          text: `The timestamp of ${time || 'now'} is ${result} ms.`,
        },
      ],
    };
  }
);

// convert_time tool
server.tool(
  'convert_time',
  {
    sourceTimezone: z.string().describe('The source timezone. IANA timezone name, e.g. Asia/Shanghai'),
    targetTimezone: z.string().describe('The target timezone. IANA timezone name, e.g. Europe/London'),
    time: z.string().describe('Date and time in 24-hour format. e.g. 2025-03-23 12:30:00'),
  },
  async ({ sourceTimezone, targetTimezone, time }: { sourceTimezone: string; targetTimezone: string; time: string }) => {
    const sourceTime = dayjs.tz(time, sourceTimezone);
    const targetTime = sourceTime.tz(targetTimezone);
    const formatString = 'YYYY-MM-DD HH:mm:ss';
    const timeDiff = targetTime.utcOffset() - sourceTime.utcOffset();
    const hoursDiff = Math.round(timeDiff / 60);
    return {
      content: [
        {
          type: 'text',
          text: `Time ${time} in ${sourceTimezone} converts to ${targetTime.format(formatString)} in ${targetTimezone}. ${targetTimezone} is ${hoursDiff} hours ${hoursDiff > 0 ? 'ahead of' : hoursDiff < 0 ? 'behind' : 'same as'} ${sourceTimezone}.`,
        },
      ],
    };
  }
);

// get_week_year tool
server.tool(
  'get_week_year',
  {
    date: z.string().describe('The date to get the week and isoWeek of the year. e.g. 2025-03-23').optional(),
  },
  async ({ date }: { date?: string }) => {
    const week = date ? dayjs(date).week() : dayjs().week();
    const isoWeek = date ? dayjs(date).isoWeek() : dayjs().isoWeek();
    return {
      content: [
        {
          type: 'text',
          text: `The week of the year for ${date || 'today'} is ${week}, and the isoWeek of the year is ${isoWeek}.`,
        },
      ],
    };
  }
);

// --- Manual Cloudflare Worker Fetch Handler for MCP Protocol ---
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method === 'GET') {
      return new Response('MCP Server HTTP Time is running.', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { 'Allow': 'POST, OPTIONS, GET' },
      });
    }

    let requestId: string | number | null = null;
    try {
      // Define an interface for the expected request body structure
      interface JsonRpcRequestBody {
        method: string;
        params?: any; // params can be of various types or optional
        id: string | number | null;
        jsonrpc: string; // Typically "2.0"
      }

      const requestBody: JsonRpcRequestBody = await request.json();
      const { method, params, id } = requestBody;
      requestId = id;

      switch (method) {
        case 'initialize': {
          // Build capabilities.tools from registered tools
          const registeredTools = (server as any)._registeredTools;
          const tools: Record<string, any> = {};
          for (const [name, toolDef] of Object.entries(registeredTools)) {
            const def = toolDef as any;
            tools[name] = {
              description: def.description,
              inputSchema: zodToJsonSchema(def.inputSchema).definitions?.root ?? zodToJsonSchema(def.inputSchema),
            };
          }
          return jsonRpcResponse(id, {
            serverInfo: {
              name: 'mcp-server-http-time',
              version: '0.2.0',
            },
            protocolVersion: '2025-03-26',
            capabilities: {
              tools,
            },
          });
        }

        case 'tools/list':
          // List all registered tools
          const registeredTools = (server as any)._registeredTools;
          const toolsList = Object.entries(registeredTools).map(([name, toolDef]: [string, any]) => ({
            name: name, // Use the key from Object.entries as the tool name
            description: toolDef.description,
            inputSchema: zodToJsonSchema(toolDef.inputSchema).definitions?.root ?? zodToJsonSchema(toolDef.inputSchema),
          }));
          return jsonRpcResponse(id, { tools: toolsList });

        case 'tools/call':
          if (!params || typeof params !== 'object' || !params.name) {
            return jsonRpcResponse(id, null, { code: -32602, message: 'Invalid params: Missing tool name' });
          }
          const toolName = params.name;
          const toolArgs = params.arguments || {};
          const tool = (server as any)._registeredTools[toolName];
          if (!tool) {
            return jsonRpcResponse(id, null, { code: -32601, message: `Unknown tool: ${toolName}` });
          }
          try {
            // Validate arguments using the tool's inputSchema
            const parseResult = await tool.inputSchema.safeParseAsync(toolArgs);
            if (!parseResult.success) {
              return jsonRpcResponse(id, null, { code: -32602, message: `Invalid arguments: ${parseResult.error.message}` });
            }
            const result = await tool.callback(parseResult.data, {});
            return jsonRpcResponse(id, result);
          } catch (toolError: unknown) {
            const message = toolError instanceof Error ? toolError.message : String(toolError);
            return jsonRpcResponse(id, null, { code: -32000, message });
          }

        default:
          return jsonRpcResponse(id, null, { code: -32601, message: `Method not found: ${method}` });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid request format';
      const errorCode = error instanceof SyntaxError ? -32700 : -32600;
      return jsonRpcResponse(requestId, null, { code: errorCode, message: errorMessage });
    }
  },
};

// Helper for JSON-RPC responses
function jsonRpcResponse(id: string | number | null, result: any, error: any = null) {
  return new Response(JSON.stringify({
    jsonrpc: '2.0',
    id,
    result: error ? undefined : result,
    error: error ? { code: error.code || -32000, message: error.message } : undefined,
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
