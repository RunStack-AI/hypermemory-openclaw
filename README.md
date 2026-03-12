# HyperMemory for OpenClaw

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenClaw Compatible](https://img.shields.io/badge/OpenClaw-0.30+-blue.svg)](https://openclaw.ai)

Persistent hypergraph memory skill for [OpenClaw](https://openclaw.ai). Give your AI agent long-term memory that persists across conversations, with rich relationship modeling between facts.

## What is HyperMemory?

HyperMemory is a cloud-hosted knowledge graph service that stores information as interconnected nodes and relationships. Unlike simple key-value stores:

- **Hypergraph Structure** - Model complex multi-way relationships (not just pairs)
- **Semantic Search** - Find relevant memories using natural language queries
- **Persistent Storage** - Data stored in PostgreSQL, never lost
- **Instant Recall** - Sub-second retrieval across your entire knowledge graph

## Quick Start

### 1. Install the Skill

**Option A: ClawHub (Recommended)**
```bash
clawhub install hypermemory
```

**Option B: Manual Installation**
```bash
# Clone this repository
git clone https://github.com/RunStack-AI/hypermemory-openclaw.git

# Copy to your OpenClaw skills directory
cp -r hypermemory-openclaw ~/.openclaw/workspace/skills/hypermemory

# Refresh skills
openclaw skills refresh
```

### 2. Get Your API Key

1. Sign up at [hypermemory.io](https://hypermemory.io)
2. Go to your dashboard and create a new API key
3. Copy the key (starts with `hm_`)

### 3. Configure Credentials

**Via OpenClaw Secrets (Recommended)**
```bash
openclaw secrets set HYPERMEMORY_URL "https://api.hypermemory.io"
openclaw secrets set HYPERMEMORY_API_KEY "hm_your_api_key_here"
```

**Via Environment Variables**
```bash
export HYPERMEMORY_URL="https://api.hypermemory.io"
export HYPERMEMORY_API_KEY="hm_your_api_key_here"
```

**Via ClawCloud Console**

Navigate to Settings → Environment and add:
- `HYPERMEMORY_URL`: `https://api.hypermemory.io`
- `HYPERMEMORY_API_KEY`: Your API key

### 4. Test It

```bash
openclaw agent --message "use hypermemory_overview to show my memory"
```

## How It Works

The skill provides 7 tools that your OpenClaw agent can use:

| Tool | Purpose |
|------|---------|
| `hypermemory_overview` | Get summary and statistics of your memory graph |
| `hypermemory_store` | Store a new memory with optional relationships |
| `hypermemory_recall` | Search memories using natural language |
| `hypermemory_update` | Update an existing memory |
| `hypermemory_forget` | Remove a memory |
| `hypermemory_find_related` | Find memories connected to a specific node |
| `hypermemory_add_relationships` | Create relationships between existing memories |

### Automatic Behavior

When properly configured, your agent will automatically:

1. **At conversation start**: Call `hypermemory_overview` and `hypermemory_recall` to load relevant context
2. **During conversation**: Store new facts, preferences, and decisions as they come up
3. **Silently**: Memory operations happen in the background without cluttering the conversation

## Usage Examples

### Storing User Information

When the user says "My name is Alex and I work at Acme Corp":

```javascript
hypermemory_store({
  key: "user_profile",
  description: "User is Alex, works at Acme Corp",
  data: { name: "Alex", company: "Acme Corp" }
})
```

### Storing Project Details with Relationships

```javascript
hypermemory_store({
  key: "project_webapp",
  description: "E-commerce webapp using Next.js and Stripe",
  data: {
    name: "ShopFast",
    stack: ["Next.js", "Tailwind", "Stripe", "PostgreSQL"],
    status: "development"
  },
  relationships: [
    { nodes: ["project_webapp", "user_profile"], relationship: "owned_by" }
  ]
})
```

### Recalling Context

```javascript
hypermemory_recall({
  query: "user preferences for programming",
  max_results: 10
})
```

### Finding Related Information

```javascript
hypermemory_find_related({
  key: "project_webapp",
  max_depth: 2
})
```

## Key Naming Conventions

Use descriptive, hierarchical keys for organization:

| Prefix | Use For | Examples |
|--------|---------|----------|
| `user_` | Personal info | `user_name`, `user_company`, `user_timezone` |
| `preference_` | User preferences | `preference_editor`, `preference_language` |
| `project_{name}_` | Project details | `project_webapp_stack`, `project_webapp_deadline` |
| `decision_` | Decisions made | `decision_database`, `decision_hosting` |
| `fact_` | General facts | `fact_team_size`, `fact_budget` |
| `person_` | People info | `person_sarah_role`, `person_mike_contact` |

## File Structure

```
hypermemory-openclaw/
├── SKILL.md              # Agent instructions and tool documentation
├── manifest.json         # Tool schema definitions (JSON-RPC)
├── index.mjs             # JavaScript handlers for HTTP calls
├── openclaw.plugin.json  # OpenClaw plugin configuration
├── package.json          # NPM package definition
└── spec/                 # Jest test suite
    └── hypermemory.spec.mjs
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   OpenClaw      │     │   HyperMemory   │     │   PostgreSQL    │
│   Agent         │────▶│   Gateway       │────▶│   Database      │
│                 │ HTTP│   (Fly.io)      │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │     Redis       │
                        │   (Real-time)   │
                        └─────────────────┘
```

The skill makes HTTP POST requests to the HyperMemory gateway, which:
1. Authenticates your API key
2. Routes to your tenant's isolated data
3. Stores/retrieves from PostgreSQL
4. Returns results in MCP format

## Running Tests

```bash
cd ~/.openclaw/workspace/skills/hypermemory
npm install
npm test
```

## Troubleshooting

### "HYPERMEMORY_URL and HYPERMEMORY_API_KEY must be configured"

Your credentials aren't set. Run:
```bash
openclaw secrets set HYPERMEMORY_URL "https://api.hypermemory.io"
openclaw secrets set HYPERMEMORY_API_KEY "hm_your_key"
```

### "HyperMemory API error 401: Unauthorized"

Your API key is invalid or expired. Check your key at [hypermemory.io/dashboard](https://hypermemory.io/dashboard).

### "HyperMemory API error 429: Too Many Requests"

You've hit your rate limit. Wait a moment or upgrade your plan.

### Skill not appearing in OpenClaw

Run `openclaw skills refresh` or restart the gateway:
```bash
openclaw gateway restart
```

### Memory not persisting

Ensure your API key has write permissions. Check your key scopes in the dashboard.

## Pricing

HyperMemory uses a simple query-based pricing model:

| Plan | Monthly Price | Queries/Month | Overage |
|------|---------------|---------------|---------|
| Free | $0 | 10,000 | Hard limit |
| Developer | $29 | 50,000 | $0.50/1K |
| Pro | $99 | 500,000 | $0.50/1K |
| Enterprise | Contact Us | Unlimited | Custom |

A "query" is any interaction with HyperMemory - stores, recalls, updates, and deletes all count.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- **Documentation**: [docs.hypermemory.io](https://docs.hypermemory.io)
- **Issues**: [GitHub Issues](https://github.com/RunStack-AI/hypermemory-openclaw/issues)
- **Email**: support@hypermemory.io

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [HyperMemory MCP](https://github.com/RunStack-AI/hypermemory-mcp) - MCP integration for Claude, OpenAI, n8n, CrewAI, and more
- [OpenClaw](https://openclaw.ai) - The AI assistant platform
- [ClawHub](https://clawhub.com) - OpenClaw skill marketplace

---

Made with ❤️ by [RunStack AI](https://runstack.ai)
