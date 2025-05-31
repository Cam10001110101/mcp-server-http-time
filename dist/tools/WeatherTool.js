import { MCPTool } from "mcp-framework";
import { z } from "zod";
class WeatherTool extends MCPTool {
    name = "weather";
    description = "Weather tool description";
    schema = {
        message: {
            type: z.string(),
            description: "Message to process",
        },
    };
    async execute(input) {
        return `Processed: ${input.message}`;
    }
}
export default WeatherTool;
