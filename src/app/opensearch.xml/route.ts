/**
 * OpenSearch Description Document
 * Allows browsers to discover and use the site's search functionality
 * https://github.com/dewitt/opensearch
 */

import { SITE_CONFIG } from '@/lib/seo/utils'

export const dynamic = 'force-static'

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const openSearchXml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>${escapeXml(SITE_CONFIG.name)}</ShortName>
  <Description>${escapeXml(`Search ${SITE_CONFIG.name}`)}</Description>
  <Tags>blog development programming technology</Tags>
  <Contact>${escapeXml(SITE_CONFIG.author)}</Contact>
  <Url type="text/html" template="${SITE_CONFIG.url}/search?q={searchTerms}"/>
  <Url type="application/rss+xml" template="${SITE_CONFIG.url}/feed.xml"/>
  <Url type="application/atom+xml" template="${SITE_CONFIG.url}/atom.xml"/>
  <Image height="64" width="64" type="image/png">${SITE_CONFIG.url}/images/logo.png</Image>
  <Image height="16" width="16" type="image/x-icon">${SITE_CONFIG.url}/favicon.ico</Image>
  <Language>en-US</Language>
  <OutputEncoding>UTF-8</OutputEncoding>
  <InputEncoding>UTF-8</InputEncoding>
  <AdultContent>false</AdultContent>
  <Attribution>
    ${escapeXml(`Search results provided by ${SITE_CONFIG.name}`)}
  </Attribution>
</OpenSearchDescription>`

  return new Response(openSearchXml, {
    headers: {
      'Content-Type': 'application/opensearchdescription+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
