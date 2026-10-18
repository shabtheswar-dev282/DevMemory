import { describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { MemoryService } from "../src/domain/memoryService.js";
import { InMemoryEventRepository } from "../src/infra/inMemoryEventRepository.js";
import { buildMcpServer, logClientOnConnect } from "../src/mcp/server.js";

// A real MCP handshake over the SDK's in-memory transport: the client
// announces its clientInfo, and the server must report exactly that.

describe("logClientOnConnect", () => {
  it("logs the name and version the client sends in the MCP handshake", async () => {
    const server = buildMcpServer(new MemoryService(new InMemoryEventRepository()));
    const messages: string[] = [];
    logClientOnConnect(server, (message) => messages.push(message));

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "9.9.9" });
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    await vi.waitFor(() => expect(messages).toHaveLength(1));
    expect(messages[0]).toBe('[devmemory] client connected: {"name":"test-client","version":"9.9.9"}');

    await client.close();
  });
});
