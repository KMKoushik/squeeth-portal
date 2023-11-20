import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

import { isVPN } from '../utils/vpn'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function middleware(request: NextRequest) {
  const cloudflareCountry = request.headers.get('cf-ipcountry')
  const country = cloudflareCountry ?? request?.geo?.country

  const url = request.nextUrl

  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || request.ip
  if (ip) {
    const redisData = await redis.get(ip)
    const isIPBlocked = !!redisData

    console.log('ip', ip, isIPBlocked, url.protocol, url.host, '/blocked')

    if (isIPBlocked && url.pathname !== '/blocked') {
      return NextResponse.redirect(`${url.protocol}//${url.host}/blocked`)
    }

    const isFromVpn = await isVPN(ip)
    if (isFromVpn && url.pathname !== '/blocked') {
      await redis.set(ip, 1)
      console.log('vpnip', ip, isFromVpn, '/blocked')
      return NextResponse.redirect(`${url.protocol}//${url.host}/blocked`)
    }
  }

  console.log('country', cloudflareCountry, country)

  console.log(request.headers.get('sec-fetch-site') === 'cross-site')
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    request.nextUrl.searchParams.set('g-safe', 'true')
  }

  return NextResponse.next()
}

/*
  matcher for excluding public assets/api routes/_next
  link: https://github.com/vercel/next.js/discussions/36308#discussioncomment-3758041

  regex: negative lookahead and will match any path that does not contain 'api', 'static', any string with a dot in it ('.\..'), '_next' or 'blocked'
*/
export const config = {
  matcher: '/((?!api|static|.*\\..*|_next|blocked).*)',
}
