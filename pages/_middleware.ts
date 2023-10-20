import { NextRequest, NextResponse } from 'next/server'

const BLOCKED_COUNTRIES = ['US', 'BY', 'CU', 'IR', 'IQ', 'CI', 'LR', 'KP', 'SD', 'SY', 'ZW', 'CA']
const ALLOWED_IPS = ['54.217.161.151']
const ALLOWED_URLS = RegExp(
  '(/images|/favicon.ico|/font|/api/auction/getLatestAuction|/api/auction/getAuctionById|/api/auction/getLastHedge)',
)

export function middleware(req: NextRequest) {
  const userIp = req?.ip
  const country = req?.geo?.country
  const response = NextResponse.next()
  const path = req.url

  if (country && userIp && BLOCKED_COUNTRIES.includes(country) && !ALLOWED_URLS.test(path) && !ALLOWED_IPS.includes(userIp)) {
    return NextResponse.rewrite('/blocked')
  }
  console.log('country: ' + country)
  console.log('request IP: ' + userIp)

  console.log(req.headers.get('sec-fetch-site') === 'cross-site')
  if (req.headers.get('sec-fetch-site') === 'cross-site') {
    req.nextUrl.searchParams.set('g-safe', 'true')
  }

  return response
}
