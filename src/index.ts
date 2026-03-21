#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import {
  verifyPurchase,
  getItem,
  searchComments,
  listSales,
  getEarnings,
  getAccount,
  getStatement,
} from './envato.js'

// ── Validate env ───────────────────────────────────────────────

if (!process.env.ENVATO_TOKEN) {
  console.error('Missing required env var: ENVATO_TOKEN')
  process.exit(1)
}

// ── Server ─────────────────────────────────────────────────────

const server = new McpServer(
  { name: 'envato-market', version: '1.0.0' },
  { capabilities: { logging: {} } },
)

// ── Helpers ────────────────────────────────────────────────────

async function run<T>(fn: () => Promise<T>, format: (v: T) => string = v => JSON.stringify(v, null, 2)) {
  try {
    const result = await fn()
    return { content: [{ type: 'text' as const, text: format(result) }] }
  } catch (err) {
    return { isError: true as const, content: [{ type: 'text' as const, text: String(err) }] }
  }
}

// ── Support tools ──────────────────────────────────────────────

server.registerTool(
  'verify_purchase',
  {
    description: 'Verify a sale by Envato purchase code. Returns buyer, item, license, and support dates.',
    inputSchema: {
      code: z.string().describe('Envato purchase code (UUID format)'),
    },
  },
  async ({ code }) => run(() => verifyPurchase(code)),
)

server.registerTool(
  'get_item',
  {
    description: 'Look up an Envato Market item by ID. Returns sales count, rating, version, price, and tags.',
    inputSchema: {
      id: z.number().describe('Envato item ID'),
    },
  },
  async ({ id }) => run(() => getItem(id)),
)

server.registerTool(
  'search_comments',
  {
    description: 'Search ThemeForest comments on an item. Returns conversation threads.',
    inputSchema: {
      item_id: z.number().describe('Envato item ID'),
      term: z.string().optional().describe('Search phrase to filter comments'),
      page: z.number().optional().describe('Page number (default 1)'),
    },
  },
  async ({ item_id, term, page }) => run(() => searchComments(item_id, term, page)),
)

// ── Business tools ─────────────────────────────────────────────

server.registerTool(
  'list_sales',
  {
    description: 'List recent author sales (paginated). Returns compact sale summaries.',
    inputSchema: {
      page: z.number().optional().default(1).describe('Page number'),
    },
  },
  async ({ page }) => run(() => listSales(page)),
)

server.registerTool(
  'get_statement',
  {
    description: 'List transactions from your Envato statement. Supports filtering by date range, transaction type, and site.',
    inputSchema: {
      page: z.number().optional().describe('Page number'),
      from_date: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      to_date: z.string().optional().describe('End date (YYYY-MM-DD)'),
      type: z.string().optional().describe('Transaction type (e.g. "Sale", "Author Fee")'),
      site: z.string().optional().describe('Envato Market site (e.g. "themeforest.net")'),
    },
  },
  async ({ page, from_date, to_date, type, site }) =>
    run(() => getStatement(page, from_date, to_date, type, site)),
)

server.registerTool(
  'get_earnings',
  { description: 'Monthly earnings and sales breakdown since account creation.' },
  async () => run(() => getEarnings()),
)

server.registerTool(
  'get_account',
  { description: 'Account balance, available earnings, and profile details.' },
  async () => run(() => getAccount()),
)

// ── Start ──────────────────────────────────────────────────────

const transport = new StdioServerTransport()
await server.connect(transport)
