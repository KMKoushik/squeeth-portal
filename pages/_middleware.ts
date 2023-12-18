import { NextRequest, NextResponse } from 'next/server'

import { redis } from '../utils/redisClient'
import { isVPN } from '../utils/vpn'
import { BLOCKED_IP_VALUE } from '../constants/restrictions'

const ignoredPaths = ['/api', '/favicon.ico', '/static', '/_next', '/blocked']

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000

interface RedisResponse {
  value: string
  timestamp: number
}

async function isIPBlockedInRedis(ip: string, currentTime: number) {
  let redisData: RedisResponse | null = null
  try {
    redisData = await redis.get<RedisResponse>(ip)
  } catch (error) {
    console.error('Failed to get data from Redis:', error)
  }

  let isIPBlocked = false
  if (redisData) {
    try {
      const { value, timestamp } = redisData

      // check if entry is valid and is less than 30 days old
      if (value === BLOCKED_IP_VALUE && currentTime - timestamp <= THIRTY_DAYS_IN_MS) {
        isIPBlocked = true
      }
    } catch (error) {
      console.error('Failed to parse data from Redis:', error)
    }
  }

  return isIPBlocked
}

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
    const currentTime = Date.now()
    // check if IP is blocked
    const isIPBlocked = await isIPBlockedInRedis(ip, currentTime)

    if (isIPBlocked && url.pathname !== '/blocked') {
      return NextResponse.redirect(`${url.protocol}//${url.host}/blocked`)
    }

    // check if IP is from VPN
    const isIPFromVPN = await isVPN(ip)
    if (isIPFromVPN && url.pathname !== '/blocked') {
      try {
        await redis.set(ip, { value: BLOCKED_IP_VALUE, timestamp: currentTime })
      } catch (error) {
        console.error('Failed to set data in Redis:', error)
      }
      return NextResponse.redirect(`${url.protocol}//${url.host}/blocked`)
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
