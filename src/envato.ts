const TOKEN = process.env.ENVATO_TOKEN!
const V1 = 'https://api.envato.com/v1'
const V3 = 'https://api.envato.com/v3'

// ── Helpers ────────────────────────────────────────────────────

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Envato API ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

// ── Compact formatters ─────────────────────────────────────────

interface RawSale {
  amount: string
  sold_at: string
  license: string
  support_amount: string
  supported_until: string
  item: RawItem
  buyer: string
  purchase_count: number
}

interface RawItem {
  id: number
  name: string
  number_of_sales: number
  rating: number
  rating_count: number
  price_cents: number
  site: string
  classification: string
  published_at: string
  updated_at: string
  trending: boolean
  tags: string[]
  wordpress_theme_metadata?: { theme_name: string; author_name: string; version: string; description: string }
  wordpress_plugin_metadata?: { plugin_name: string; author?: string; version?: string; description?: string }
  [key: string]: unknown
}

interface RawComment {
  id: number
  item_id: number
  item_name: string
  url: string
  last_comment_at: string
  conversation: Array<{
    id: number
    username: string
    content: string
    created_at: string
    author_comment: boolean
    [key: string]: unknown
  }>
  total_converstations: number
  buyer_and_author: boolean
  [key: string]: unknown
}

function compactSale(sale: RawSale) {
  return {
    buyer: sale.buyer,
    amount: sale.amount,
    sold_at: sale.sold_at,
    license: sale.license,
    support_amount: sale.support_amount,
    supported_until: sale.supported_until,
    purchase_count: sale.purchase_count,
    item: {
      id: sale.item.id,
      name: sale.item.name,
      number_of_sales: sale.item.number_of_sales,
      wordpress_theme_metadata: sale.item.wordpress_theme_metadata,
      wordpress_plugin_metadata: sale.item.wordpress_plugin_metadata,
    },
  }
}

function compactItem(item: RawItem) {
  return {
    id: item.id,
    name: item.name,
    number_of_sales: item.number_of_sales,
    rating: item.rating,
    rating_count: item.rating_count,
    price_cents: item.price_cents,
    site: item.site,
    classification: item.classification,
    published_at: item.published_at,
    updated_at: item.updated_at,
    trending: item.trending,
    tags: item.tags,
    wordpress_theme_metadata: item.wordpress_theme_metadata,
    wordpress_plugin_metadata: item.wordpress_plugin_metadata,
  }
}

function compactComment(match: RawComment) {
  return {
    id: match.id,
    item_id: match.item_id,
    item_name: match.item_name,
    url: match.url,
    last_comment_at: match.last_comment_at,
    total_converstations: match.total_converstations,
    buyer_and_author: match.buyer_and_author,
    conversation: match.conversation.map(c => ({
      id: c.id,
      username: c.username,
      content: c.content,
      created_at: c.created_at,
      author_comment: c.author_comment,
    })),
  }
}

interface StatementLine {
  unique_id: string
  date: string
  order_id: number
  type: string
  detail: string
  item_id: number
  document: string
  price: number
  amount: number
  site?: string
  other_party_country: string
  other_party_region: string
  other_party_city: string
  other_party_zipcode: string
  au_rwt?: number
  au_gst: number
  eu_vat: number
  us_rwt: number
  us_bwt: number
}

interface StatementResponse {
  count: number
  results: StatementLine[]
  pagination?: {
    template: string
    pages: number
    page_size: number
  }
}

// ── API calls ──────────────────────────────────────────────────

export async function verifyPurchase(code: string) {
  const sale = await get<RawSale>(`${V3}/market/author/sale?code=${encodeURIComponent(code)}`)
  return compactSale(sale)
}

export async function getItem(id: number) {
  const item = await get<RawItem>(`${V3}/market/catalog/item?id=${id}`)
  return compactItem(item)
}

export async function searchComments(itemId: number, term?: string, page?: number) {
  const params = new URLSearchParams({ item_id: String(itemId) })
  if (term) { params.set('term', term) }
  if (page) { params.set('page', String(page)) }
  const data = await get<{ total_hits: number; links: unknown; matches: RawComment[] }>(
    `${V1}/discovery/search/search/comment?${params}`
  )
  return {
    total_hits: data.total_hits,
    links: data.links,
    matches: data.matches.map(compactComment),
  }
}

export async function listSales(page = 1) {
  const data = await get<RawSale[]>(`${V3}/market/author/sales?page=${page}`)
  return data.map(compactSale)
}

export async function getEarnings() {
  const data = await get<{ 'earnings-and-sales-by-month': Array<{ month: string; sales: string; earnings: string }> }>(
    `${V1}/market/private/user/earnings-and-sales-by-month.json`
  )
  return data['earnings-and-sales-by-month']
}

export async function getStatement(page?: number, fromDate?: string, toDate?: string, type?: string, site?: string) {
  const params = new URLSearchParams()
  if (page) { params.set('page', String(page)) }
  if (fromDate) { params.set('from_date', fromDate) }
  if (toDate) { params.set('to_date', toDate) }
  if (type) { params.set('type', type) }
  if (site) { params.set('site', site) }
  return get<StatementResponse>(`${V3}/market/user/statement?${params}`)
}

export async function getAccount() {
  const data = await get<{ account: Record<string, unknown> }>(
    `${V1}/market/private/user/account.json`
  )
  return data.account
}
