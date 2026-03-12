---
name: hypermemory
version: 1.0.0
description: Persistent hypergraph memory for OpenClaw. Store facts, preferences, decisions, and relationships in a connected knowledge graph that persists across conversations.
homepage: https://github.com/RunStack-AI/hypergraph_memory
metadata:
  openclaw:
    emoji: 🧠
    kind: plugin
trigger:
  - remember
  - recall
  - memory
  - what do you know about
  - store this
  - user preference
  - project details
tools:
  - http
config:
  HYPERMEMORY_URL:
    type: string
    description: HyperMemory gateway URL (e.g., https://api.hypermemory.io)
    required: true
  HYPERMEMORY_API_KEY:
    type: string
    description: Your HyperMemory API key
    required: true
    secret: true
---

# HyperMemory for OpenClaw

Persistent hypergraph memory that stores knowledge as interconnected nodes and relationships. Unlike simple key-value stores, HyperMemory models complex relationships between facts, enabling richer context retrieval.

## Required Behavior

### Every Conversation Start
1. Call `hypermemory_overview` to see what memories exist
2. Call `hypermemory_recall` with queries relevant to the conversation
3. Use recalled context to personalize responses

### During Conversation
Store information automatically. Never ask "should I remember this?"

**Always store:**
- User name, location, job, company
- Preferences (communication style, technical preferences, interests)
- Project details, goals, architecture decisions
- Relationships between people, projects, and concepts
- Any facts the user shares about themselves

## Tools Reference

### hypermemory_overview
Get a high-level summary of the memory graph.

```javascript
hypermemory_overview()
// Returns: { summary, statistics: { nodes, edges, relationships }, top_nodes }
```

### hypermemory_store
Store a new memory with optional relationships.

```javascript
hypermemory_store({
  key: "user_name",
  description: "User's name is Alex",
  data: { value: "Alex" },
  relationships: [
    { nodes: ["user_name", "user_profile"], relationship: "part_of" }
  ]
})
```

**Parameters:**
- `key` (required): Unique identifier for the memory
- `description` (required): Human-readable description
- `data` (optional): Structured metadata object
- `relationships` (optional): Array of relationship definitions

### hypermemory_recall
Search memories using semantic/keyword matching.

```javascript
hypermemory_recall({
  query: "user preferences for programming languages",
  max_results: 10,
  max_depth: 2
})
// Returns: { nodes, edges, match_info }
```

**Parameters:**
- `query` (required): Search query
- `max_results` (optional): Maximum nodes to return (default: 10)
- `max_depth` (optional): Relationship traversal depth (default: 2)

### hypermemory_update
Update an existing memory node.

```javascript
hypermemory_update({
  key: "user_job",
  description: "User works as Senior Engineer at Acme Corp",
  data: { title: "Senior Engineer", company: "Acme Corp" }
})
```

**Parameters:**
- `key` (required): Key of node to update
- `description` (optional): New description
- `data` (optional): Updated data object

### hypermemory_forget
Remove a memory from the graph.

```javascript
hypermemory_forget({
  key: "outdated_preference",
  cascade: true
})
```

**Parameters:**
- `key` (required): Key of node to delete
- `cascade` (optional): If true, removes connected edges (default: true)

### hypermemory_find_related
Find nodes related to a specific memory.

```javascript
hypermemory_find_related({
  key: "project_webapp",
  max_depth: 2,
  max_nodes: 20
})
// Returns: { related_nodes, connecting_edges }
```

### hypermemory_add_relationships
Add relationships between existing nodes.

```javascript
hypermemory_add_relationships({
  relationships: [
    {
      nodes: ["user_alex", "project_webapp", "tech_postgresql"],
      relationship: "works_on_with",
      data: { role: "lead" }
    }
  ]
})
```

## Key Naming Convention

Use descriptive, hierarchical keys:

```
user_name
user_job
user_location
preference_language
preference_communication_style
preference_editor
project_{name}_goals
project_{name}_stack
project_{name}_team
decision_{topic}
fact_{subject}
relationship_{person1}_{person2}
```

## Memory Categories

| Category | Key Prefix | Examples |
|----------|------------|----------|
| User Info | `user_` | user_name, user_company, user_timezone |
| Preferences | `preference_` | preference_typescript, preference_dark_mode |
| Projects | `project_{name}_` | project_webapp_stack, project_webapp_deadline |
| Decisions | `decision_` | decision_database_choice, decision_hosting |
| Facts | `fact_` | fact_team_size, fact_budget |
| People | `person_` | person_sarah_role, person_mike_contact |

## Examples

**User introduces themselves:**
```javascript
hypermemory_store({
  key: "user_name",
  description: "User's name is Alex Chen",
  data: { first: "Alex", last: "Chen" }
})
```

**User shares a preference:**
```javascript
hypermemory_store({
  key: "preference_programming_language",
  description: "User strongly prefers TypeScript over JavaScript",
  data: { prefers: "TypeScript", avoids: "JavaScript", reason: "type safety" }
})
```

**User describes a project:**
```javascript
hypermemory_store({
  key: "project_saas_platform",
  description: "SaaS platform project with React frontend and FastAPI backend",
  data: {
    name: "DataSync Pro",
    frontend: "React",
    backend: "FastAPI",
    database: "PostgreSQL",
    status: "development"
  },
  relationships: [
    { nodes: ["project_saas_platform", "user_name"], relationship: "owned_by" },
    { nodes: ["project_saas_platform", "preference_typescript"], relationship: "uses" }
  ]
})
```

**User makes a decision:**
```javascript
hypermemory_store({
  key: "decision_auth_provider",
  description: "Decided to use Auth0 for authentication",
  data: {
    choice: "Auth0",
    alternatives_considered: ["Firebase Auth", "Cognito"],
    reasoning: "Better SSO support and compliance features"
  },
  relationships: [
    { nodes: ["decision_auth_provider", "project_saas_platform"], relationship: "applies_to" }
  ]
})
```

**Recalling context for a conversation about the project:**
```javascript
// Start of conversation
const overview = await hypermemory_overview()
const context = await hypermemory_recall({ query: "saas platform project" })
// Now use context.nodes to personalize the response
```

## Rules

1. **Proactive** - Store information as soon as you learn it
2. **Invisible** - Don't announce memory operations to the user
3. **Contextual** - Always recall relevant memories before responding
4. **Connected** - Create relationships between related facts
5. **Updated** - Use `hypermemory_update` for existing keys, not duplicates
6. **Descriptive** - Always include clear, searchable descriptions

## Security Notes

- API keys are stored securely via OpenClaw secrets
- All data is transmitted over HTTPS
- Memory data is isolated per tenant (API key)
- Never log or expose the API key in responses
