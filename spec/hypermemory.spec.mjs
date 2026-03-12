/**
 * HyperMemory OpenClaw Skill Tests
 */
import nock from "nock";
import {
  hypermemory_overview,
  hypermemory_store,
  hypermemory_recall,
  hypermemory_update,
  hypermemory_forget,
  hypermemory_find_related,
  hypermemory_add_relationships
} from "../index.mjs";

const TEST_URL = "https://api.hypermemory.io";
const TEST_KEY = "hm_test_key_123";

const mockCtx = {
  secrets: {
    HYPERMEMORY_URL: TEST_URL,
    HYPERMEMORY_API_KEY: TEST_KEY
  }
};

describe("HyperMemory OpenClaw Skill", () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe("hypermemory_overview", () => {
    it("returns memory graph summary", async () => {
      nock(TEST_URL)
        .post("/v1/mcp/sse")
        .reply(200, {
          jsonrpc: "2.0",
          id: 1,
          result: {
            summary: "Personal knowledge graph",
            statistics: {
              node_count: 42,
              edge_count: 15,
              unique_relationships: 5
            },
            top_nodes: [
              { key: "user_name", description: "User's name" }
            ]
          }
        });

      const result = await hypermemory_overview({}, mockCtx);
      
      expect(result.statistics.nodes).toBe(42);
      expect(result.statistics.edges).toBe(15);
      expect(result.top_nodes).toHaveLength(1);
    });
  });

  describe("hypermemory_store", () => {
    it("stores a new memory node", async () => {
      nock(TEST_URL)
        .post("/v1/mcp/sse", (body) => {
          return body.params.name === "memory_store" &&
                 body.params.arguments.key === "user_name";
        })
        .reply(200, {
          jsonrpc: "2.0",
          id: 1,
          result: {
            success: true,
            node: { key: "user_name", description: "User's name is Alex" },
            edges_created: 0,
            message: "Memory stored"
          }
        });

      const result = await hypermemory_store({
        key: "user_name",
        description: "User's name is Alex",
        data: { value: "Alex" }
      }, mockCtx);
      
      expect(result.success).toBe(true);
      expect(result.node.key).toBe("user_name");
    });

    it("throws error when key is missing", async () => {
      await expect(
        hypermemory_store({ description: "test" }, mockCtx)
      ).rejects.toThrow("key and description are required");
    });

    it("throws error when description is missing", async () => {
      await expect(
        hypermemory_store({ key: "test" }, mockCtx)
      ).rejects.toThrow("key and description are required");
    });
  });

  describe("hypermemory_recall", () => {
    it("searches memory with query", async () => {
      nock(TEST_URL)
        .post("/v1/mcp/sse", (body) => {
          return body.params.name === "memory_recall" &&
                 body.params.arguments.query === "user preferences";
        })
        .reply(200, {
          jsonrpc: "2.0",
          id: 1,
          result: {
            nodes: [
              { key: "preference_editor", description: "User prefers VS Code" }
            ],
            edges: [],
            message: "Found 1 matching nodes"
          }
        });

      const result = await hypermemory_recall({
        query: "user preferences",
        max_results: 5
      }, mockCtx);
      
      expect(result.nodes).toHaveLength(1);
      expect(result.match_count).toBe(1);
    });

    it("throws error when query is missing", async () => {
      await expect(
        hypermemory_recall({}, mockCtx)
      ).rejects.toThrow("query is required");
    });
  });

  describe("hypermemory_update", () => {
    it("updates an existing memory node", async () => {
      nock(TEST_URL)
        .post("/v1/mcp/sse", (body) => {
          return body.params.name === "memory_update" &&
                 body.params.arguments.key === "user_job";
        })
        .reply(200, {
          jsonrpc: "2.0",
          id: 1,
          result: {
            success: true,
            node: { key: "user_job", description: "Senior Engineer at Acme" },
            message: "Memory updated"
          }
        });

      const result = await hypermemory_update({
        key: "user_job",
        description: "Senior Engineer at Acme"
      }, mockCtx);
      
      expect(result.success).toBe(true);
    });
  });

  describe("hypermemory_forget", () => {
    it("removes a memory node", async () => {
      nock(TEST_URL)
        .post("/v1/mcp/sse", (body) => {
          return body.params.name === "memory_forget" &&
                 body.params.arguments.key === "old_fact";
        })
        .reply(200, {
          jsonrpc: "2.0",
          id: 1,
          result: {
            success: true,
            removed_node: { key: "old_fact" },
            removed_edges: [],
            message: "Memory forgotten"
          }
        });

      const result = await hypermemory_forget({
        key: "old_fact"
      }, mockCtx);
      
      expect(result.success).toBe(true);
    });
  });

  describe("hypermemory_find_related", () => {
    it("finds related nodes", async () => {
      nock(TEST_URL)
        .post("/v1/mcp/sse", (body) => {
          return body.params.name === "memory_find_related";
        })
        .reply(200, {
          jsonrpc: "2.0",
          id: 1,
          result: {
            related_nodes: [
              { key: "project_webapp_stack" },
              { key: "preference_typescript" }
            ],
            connecting_edges: [
              { nodes: ["project_webapp", "project_webapp_stack"] }
            ]
          }
        });

      const result = await hypermemory_find_related({
        key: "project_webapp"
      }, mockCtx);
      
      expect(result.related_nodes).toHaveLength(2);
      expect(result.total_found).toBe(2);
    });
  });

  describe("hypermemory_add_relationships", () => {
    it("creates relationships between nodes", async () => {
      nock(TEST_URL)
        .post("/v1/mcp/sse", (body) => {
          return body.params.name === "memory_add_relationships";
        })
        .reply(200, {
          jsonrpc: "2.0",
          id: 1,
          result: {
            success: true,
            edges_created: [{ nodes: ["a", "b"], relationship: "relates_to" }],
            message: "Relationships added"
          }
        });

      const result = await hypermemory_add_relationships({
        relationships: [
          { nodes: ["a", "b"], relationship: "relates_to" }
        ]
      }, mockCtx);
      
      expect(result.success).toBe(true);
      expect(result.edges_created).toBe(1);
    });

    it("throws error when relationships array is empty", async () => {
      await expect(
        hypermemory_add_relationships({ relationships: [] }, mockCtx)
      ).rejects.toThrow("relationships array is required");
    });
  });

  describe("error handling", () => {
    it("throws error when credentials are missing", async () => {
      const noCredsCtx = { secrets: {} };
      
      await expect(
        hypermemory_overview({}, noCredsCtx)
      ).rejects.toThrow("HYPERMEMORY_URL and HYPERMEMORY_API_KEY must be configured");
    });

    it("handles API errors gracefully", async () => {
      nock(TEST_URL)
        .post("/v1/mcp/sse")
        .reply(401, "Unauthorized");

      await expect(
        hypermemory_overview({}, mockCtx)
      ).rejects.toThrow("HyperMemory API error 401");
    });

    it("handles MCP errors gracefully", async () => {
      nock(TEST_URL)
        .post("/v1/mcp/sse")
        .reply(200, {
          jsonrpc: "2.0",
          id: 1,
          error: {
            code: -32600,
            message: "Invalid request"
          }
        });

      await expect(
        hypermemory_overview({}, mockCtx)
      ).rejects.toThrow("MCP error: Invalid request");
    });
  });
});
