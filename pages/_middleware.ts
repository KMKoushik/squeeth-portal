import { NextRequest, NextResponse } from 'next/server'

import { redis } from '../utils/redisClient'
import { isVPN, isIPBlockedInRedis } from '../utils/vpn'
import { BLOCKED_IP_VALUE } from '../constants/restrictions'

const IGNORED_PATHS = ['/api', '/favicon.ico', '/static', '/_next', '/blocked']

export async function middleware(request: NextRequest) {
  const url = request.nextUrl

  // console.log({ pathname: url.pathname })

  // should not block api calls, static files, nextjs files, favicon, blocked page and files with extension (images, fonts, etc)
  const isIgnoredPath = IGNORED_PATHS.some(path => url.pathname.startsWith(path)) || url.pathname.includes('.')
  if (isIgnoredPath) {
    console.log('Ignoring path:', url.pathname)
    return NextResponse.next()
  }
  console.log('middleware logic:', url.pathname)

  const cloudflareCountry = request.headers.get('cf-ipcountry')
  const country = cloudflareCountry ?? request?.geo?.country

  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || request.ip
  const allowedIPs = (process.env.WHITELISTED_IPS || '').split(',')
  const isIPWhitelisted = ip && allowedIPs.includes(ip)

  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('host')
  const blockedUrl = new URL('/blocked', `${protocol}://${host}`)

  if (ip && !isIPWhitelisted) {
    const currentTime = Date.now()
    // check if IP is blocked
    const isIPBlocked = await isIPBlockedInRedis(ip, currentTime)
    if (isIPBlocked && url.pathname !== '/blocked') {
      return NextResponse.redirect(blockedUrl.toString())
    }

    // check if IP is from VPN
    const isIPFromVPN = await isVPN(ip)
    if (isIPFromVPN && url.pathname !== '/blocked') {
      try {
        await redis.set(ip, { value: BLOCKED_IP_VALUE, timestamp: currentTime })
      } catch (error) {
        console.error('Failed to set data in Redis:', error)
      }

      return NextResponse.redirect(blockedUrl.toString())
    }
  }

  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    request.nextUrl.searchParams.set('g-safe', 'true')
  }

  if (url.searchParams.has('ct') && url.searchParams.get('ct') === String(country)) {
    return NextResponse.next()
  }

  url.searchParams.set('ct', country!)
  return NextResponse.redirect(url)
}
