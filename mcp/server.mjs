import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"

// Define the API endpoint to fetch GPU data from.
// Users can override this by setting GPU_COMPARE_API_URL in their environment.
const API_URL = process.env.GPU_COMPARE_API_URL || "http://localhost:3002/api/gpus"

/**
 * Helper to fetch listings from the REST API.
 */
async function fetchGpus(params = {}) {
  const urlParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      urlParams.set(key, String(value))
    }
  }

  const queryStr = urlParams.toString()
  const fullUrl = `${API_URL}${queryStr ? `?${queryStr}` : ""}`

  const response = await fetch(fullUrl, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "mcp-gpu-compare/1.0"
    }
  })

  if (!response.ok) {
    throw new Error(`API returned error ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// ── Instantiate Server ──
const server = new Server(
  {
    name: "gpu-compare",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// ── List Tools Handler ──
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_gpus",
        description: "Returns active GPU listings from cloud providers with filters and sorting.",
        inputSchema: {
          type: "object",
          properties: {
            gpu: {
              type: "string",
              description: "Filter by GPU model name (e.g., 'H100', 'RTX 4090'). Case-insensitive partial match.",
            },
            provider: {
              type: "string",
              description: "Filter by provider name (e.g., 'RunPod', 'Vast.ai'). Exact match.",
            },
            type: {
              type: "string",
              description: "Filter by billing type. Allowed values: 'spot', 'on-demand'.",
            },
            sort: {
              type: "string",
              description: "Sort order. Allowed values: 'price_asc' (cheapest first), 'price_desc' (most expensive first).",
            },
          },
        },
      },
      {
        name: "get_cheapest_gpu",
        description: "Returns the single cheapest available GPU listing matching a model name.",
        inputSchema: {
          type: "object",
          properties: {
            gpu_model: {
              type: "string",
              description: "The GPU model name (e.g., 'RTX 4090', 'H100'). Required.",
            },
            listing_type: {
              type: "string",
              description: "Filter by billing type. Allowed values: 'spot', 'on-demand'.",
            },
          },
          required: ["gpu_model"],
        },
      },
    ],
  }
})

// ── Call Tool Handler ──
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    if (name === "list_gpus") {
      const data = await fetchGpus({
        gpu: args?.gpu,
        provider: args?.provider,
        type: args?.type,
        sort: args?.sort || "price_asc",
      })

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      }
    }

    if (name === "get_cheapest_gpu") {
      const gpuModel = args?.gpu_model
      const listingType = args?.listing_type

      // Fetch listings filtered by GPU model (and type if provided) sorted cheapest first
      const data = await fetchGpus({
        gpu: gpuModel,
        type: listingType,
        sort: "price_asc",
      })

      if (!data || data.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No listings found matching GPU model "${gpuModel}"${listingType ? ` with type "${listingType}"` : ""}.`,
            },
          ],
        }
      }

      // Return the first item (cheapest)
      const cheapest = data[0]

      return {
        content: [
          {
            type: "text",
            text: `Cheapest listing found:\n` +
                  `- GPU: ${cheapest.gpu_model} (${cheapest.vram_gb}GB VRAM)\n` +
                  `- Provider: ${cheapest.provider}\n` +
                  `- Price: $${cheapest.price_per_hour}/hr (${cheapest.listing_type})\n` +
                  `- Region: ${cheapest.region || "Unknown"}\n` +
                  `- Link: ${cheapest.link || "—"}`,
          },
        ],
      }
    }

    throw new Error(`Tool "${name}" not found.`)
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `Error executing tool "${name}": ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    }
  }
})

// ── Run Server over stdio transport ──
async function run() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("GPU Compare MCP server running on stdio transport.")
}

run().catch((err) => {
  console.error("Fatal error starting MCP server:", err)
  process.exit(1)
})
