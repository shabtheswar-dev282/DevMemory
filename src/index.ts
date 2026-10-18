import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createPool } from "./infra/db.js";
import { PostgresEventRepository } from "./infra/postgresEventRepository.js";
import { MemoryService } from "./domain/memoryService.js";
import { buildMcpServer, logClientOnConnect } from "./mcp/server.js";

async function main() {
  const pool = createPool();
  const repository = new PostgresEventRepository(pool);
  const memory = new MemoryService(repository);
  const server = buildMcpServer(memory);
  logClientOnConnect(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // MCP over stdio reserves stdout for protocol messages — log to stderr only.
  console.error("[devmemory] MCP server running on stdio");
}

main().catch((err) => {
  console.error("[devmemory] fatal error starting server", err);
  process.exit(1);
});
