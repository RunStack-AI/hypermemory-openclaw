/**
 * HyperMemory OpenClaw Skill Handler
 * 
 * Provides persistent hypergraph memory for OpenClaw agents.
 * Communicates with HyperMemory gateway via MCP-over-HTTP protocol.
 */

const MCP_ENDPOINT = "/v1/mcp/sse";

/**
 * Make an MCP request to the HyperMemory gateway
 */
async function mcpRequest(ctx, method, params = {}) {
  const baseUrl = ctx.secrets.HYPERMEMORY_URL;
  const apiKey = ctx.secrets.HYPERMEMORY_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("HYPERMEMORY_URL and HYPERMEMORY_API_KEY must be configured");
  }

  const url = `${baseUrl.replace(/\/$/, "")}${MCP_ENDPOINT}`;
  
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: Date.now(),
    method,
    params
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "Accept": "application/json"
    },
    body
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HyperMemory API error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  
  if (result.error) {
    throw new Error(`MCP error: ${result.error.message || JSON.stringify(result.error)}`);
  }

  return result.result;
}

/**
 * Get overview of the memory graph
 */
export async function hypermemory_overview(params, ctx) {
  const result = await mcpRequest(ctx, "tools/call", {
    name: "memory_get_overview",
    arguments: {}
  });
  
  return {
    summary: result.summary || "",
    statistics: {
      nodes: result.statistics?.node_count || 0,
      edges: result.statistics?.edge_count || 0,
      relationships: result.statistics?.unique_relationships || 0
    },
    top_nodes: result.top_nodes || []
  };
}

/**
 * Store a new memory node
 */
export async function hypermemory_store(params, ctx) {
  const { key, description, data, relationships } = params;

  if (!key || !description) {
    throw new Error("key and description are required");
  }

  const args = {
    key,
    description,
    ...(data && { data }),
    ...(relationships && { relationships })
  };

  const result = await mcpRequest(ctx, "tools/call", {
    name: "memory_store",
    arguments: args
  });

  return {
    success: result.success,
    node: result.node,
    edges_created: result.edges_created || 0,
    message: result.message
  };
}

/**
 * Search memory for relevant information
 */
export async function hypermemory_recall(params, ctx) {
  const { query, max_results = 10, max_depth = 2 } = params;

  if (!query) {
    throw new Error("query is required");
  }

  const result = await mcpRequest(ctx, "tools/call", {
    name: "memory_recall",
    arguments: {
      query,
      max_results,
      max_depth
    }
  });

  return {
    nodes: result.nodes || [],
    edges: result.edges || [],
    match_count: result.nodes?.length || 0,
    message: result.message
  };
}

/**
 * Update an existing memory node
 */
export async function hypermemory_update(params, ctx) {
  const { key, description, data } = params;

  if (!key) {
    throw new Error("key is required");
  }

  const args = {
    key,
    ...(description && { description }),
    ...(data && { data })
  };

  const result = await mcpRequest(ctx, "tools/call", {
    name: "memory_update",
    arguments: args
  });

  return {
    success: result.success,
    node: result.node,
    message: result.message
  };
}

/**
 * Remove a memory from the graph
 */
export async function hypermemory_forget(params, ctx) {
  const { key, cascade = true } = params;

  if (!key) {
    throw new Error("key is required");
  }

  const result = await mcpRequest(ctx, "tools/call", {
    name: "memory_forget",
    arguments: { key, cascade }
  });

  return {
    success: result.success,
    removed_node: result.removed_node,
    removed_edges: result.removed_edges?.length || 0,
    message: result.message
  };
}

/**
 * Find nodes related to a specific memory
 */
export async function hypermemory_find_related(params, ctx) {
  const { key, max_depth = 2, max_nodes = 20 } = params;

  if (!key) {
    throw new Error("key is required");
  }

  const result = await mcpRequest(ctx, "tools/call", {
    name: "memory_find_related",
    arguments: { key, max_depth, max_nodes }
  });

  return {
    related_nodes: result.related_nodes || [],
    connecting_edges: result.connecting_edges || [],
    total_found: result.related_nodes?.length || 0
  };
}

/**
 * Add relationships between existing nodes
 */
export async function hypermemory_add_relationships(params, ctx) {
  const { relationships } = params;

  if (!relationships || !Array.isArray(relationships) || relationships.length === 0) {
    throw new Error("relationships array is required");
  }

  const result = await mcpRequest(ctx, "tools/call", {
    name: "memory_add_relationships",
    arguments: { relationships }
  });

  return {
    success: result.success,
    edges_created: result.edges_created?.length || 0,
    message: result.message
  };
}

/**
 * Main entry point - routes to the appropriate handler
 */
export async function run(params, ctx) {
  const { action, ...args } = params;
  
  const handlers = {
    overview: hypermemory_overview,
    store: hypermemory_store,
    recall: hypermemory_recall,
    update: hypermemory_update,
    forget: hypermemory_forget,
    find_related: hypermemory_find_related,
    add_relationships: hypermemory_add_relationships
  };

  const handler = handlers[action];
  if (!handler) {
    throw new Error(`Unknown action: ${action}. Valid actions: ${Object.keys(handlers).join(", ")}`);
  }

  return await handler(args, ctx);
}

export default {
  run,
  hypermemory_overview,
  hypermemory_store,
  hypermemory_recall,
  hypermemory_update,
  hypermemory_forget,
  hypermemory_find_related,
  hypermemory_add_relationships
};
