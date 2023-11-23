import { NextRequest, NextResponse } from 'next/server'

import { redis } from '../utils/redisClient'
import { isVPN } from '../utils/vpn'

const ignoredPaths = ['/api', '/favicon.ico', '/static', '/_next', '/blocked']

export async function middleware(request: NextRequest) {
  const url = request.nextUrl

  // should not block api calls, static files, nextjs files, favicon, blocked page and files with extension (images, fonts, etc)
  const isIgnoredPath = ignoredPaths.some(path => url.pathname.startsWith(path)) || url.pathname.includes('.')
  if (isIgnoredPath) {
    return NextResponse.next()
  }

  const cloudflareCountry = request.headers.get('cf-ipcountry')
  const country = cloudflareCountry ?? request?.geo?.country

  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || request.ip
  const allowedIPs = (process.env.WHITELISTED_IPS || '').split(',')
  const isIPWhitelisted = ip && allowedIPs.includes(ip)

  if (ip && !isIPWhitelisted) {
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

  console.log(request.headers.get('sec-fetch-site') === 'cross-site')
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    request.nextUrl.searchParams.set('g-safe', 'true')
  }

  console.log('country', cloudflareCountry, country)
  if (url.searchParams.has('ct') && url.searchParams.get('ct') === String(country)) {
    return NextResponse.next()
  }

  url.searchParams.set('ct', country!)
  return NextResponse.redirect(url)
}
