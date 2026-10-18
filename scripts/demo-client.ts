import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", "src/index.ts"],
  });

  const client = new Client({ name: "devmemory-demo-client", version: "0.0.1" });
  await client.connect(transport);

  const tools = await client.listTools();
  console.log(
    "TOOLS:",
    tools.tools.map((t) => t.name).join(", ")
  );

  const projectId = "smoke-test-project";

  await client.callTool({
    name: "record_decision",
    arguments: { project_id: projectId, title: "Use MCP", rationale: "Provider-agnostic access from any AI client" },
  });

  await client.callTool({
    name: "report_bug",
    arguments: { project_id: projectId, bug_id: "BUG-1", title: "Crash on save", description: "NPE in save handler" },
  });

  await client.callTool({
    name: "add_todo",
    arguments: { project_id: projectId, todo_id: "T-1", title: "Write the web dashboard" },
  });

  await client.callTool({
    name: "resolve_bug",
    arguments: { project_id: projectId, bug_id: "BUG-1", resolution: "Added a null check before save()" },
  });

  const memoryResult = await client.callTool({
    name: "get_project_memory",
    arguments: { project_id: projectId },
  });

  console.log("\n--- get_project_memory output ---\n");
  for (const block of memoryResult.content as Array<{ type: string; text?: string }>) {
    if (block.type === "text") console.log(block.text);
  }

  const searchResult = await client.callTool({
    name: "search_memory",
    arguments: { project_id: projectId, query: "null check" },
  });
  console.log("\n--- search_memory('null check') output ---\n");
  for (const block of searchResult.content as Array<{ type: string; text?: string }>) {
    if (block.type === "text") console.log(block.text);
  }

  await client.close();
}

main().catch((err) => {
  console.error("demo failed:", err);
  process.exit(1);
});
