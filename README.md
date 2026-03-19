# @artemsemkin/envato-market-mcp

MCP server for the [Envato Market API](https://build.envato.com/api/). Gives AI agents access to purchase verification, item lookup, comment search, sales data, and account info.

## Tools

### Support

- `verify_purchase` — verify a sale by purchase code; returns buyer, item, license, and support dates
- `get_item` — look up an item by ID; returns sales count, rating, version, price, and tags
- `search_comments` — search ThemeForest comments on an item; optionally filter by keyword

### Business

- `list_sales` — list recent author sales (paginated, compact summaries)
- `get_earnings` — monthly earnings and sales breakdown since account creation
- `get_account` — account balance, available earnings, and profile details

## Setup

You need one environment variable:

- **`ENVATO_TOKEN`** — your Envato personal API token from [build.envato.com](https://build.envato.com/create-token/)

<details>
<summary>Claude Desktop</summary>

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "envato-market": {
      "command": "npx",
      "args": ["-y", "@artemsemkin/envato-market-mcp"],
      "env": {
        "ENVATO_TOKEN": "your-token"
      }
    }
  }
}
```
</details>

<details>
<summary>Claude Code</summary>

```bash
claude mcp add envato-market \
  -e ENVATO_TOKEN=your-token \
  -- npx -y @artemsemkin/envato-market-mcp
```
</details>

<details>
<summary>VS Code / Cursor</summary>

Add to `.vscode/mcp.json` (VS Code) or `.cursor/mcp.json` (Cursor) in your project:

```json
{
  "servers": {
    "envato-market": {
      "command": "npx",
      "args": ["-y", "@artemsemkin/envato-market-mcp"],
      "env": {
        "ENVATO_TOKEN": "your-token"
      }
    }
  }
}
```
</details>

## Build from source

```bash
git clone https://github.com/artkrsk/envato-market-mcp.git
cd envato-market-mcp
pnpm install
pnpm build
```
