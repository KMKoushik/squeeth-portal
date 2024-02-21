import requestIp from 'request-ip'

import { Middleware } from '../utils/middleware'
import { isIPBlockedInRedis, isVPN } from '../../utils/vpn'
import { redis } from '../../utils/redisClient'
import { BLOCKED_IP_VALUE } from '../../constants/restrictions'

const ALLOWED_REFERERS = ['localhost', 'squeethportal.xyz', 'auction.opyn.co']
const ALLOWED_REFERER_PATTERN = /^squeeth-portal-[a-zA-Z0-9-]+-opynfinance\.vercel\.app$/

export const restrictAccessMiddleware: Middleware = async (request, response, next) => {
  const ip = requestIp.getClientIp(request)

  const allowedIPs = (process.env.WHITELISTED_IPS || '').split(',')
  const isIPWhitelisted = ip && allowedIPs.includes(ip)

  const refererHeader = request.headers['referer']
  const referer = refererHeader ? new URL(refererHeader).hostname : ''

  // check if api request is from the squeethportal site
  // if yes, we allow the request without any restrictions
  // this is done as a preventive measure so as to not hit the request limit of redis
  const isRequestFromAllowedReferer =
    referer && (ALLOWED_REFERERS.includes(referer) || ALLOWED_REFERER_PATTERN.test(referer))
  if (isRequestFromAllowedReferer) {
    await next()
    return
  }

  if (ip && !isIPWhitelisted) {
    const currentTime = Date.now()
    const isIPBlocked = await isIPBlockedInRedis(ip, currentTime)
    if (isIPBlocked) {
      return response.status(403).send({ error: 'Access denied. You are likely using a VPN.' })
    }

    const isIPFromVPN = await isVPN(ip)
    if (isIPFromVPN) {
      try {
        await redis.set(ip, { value: BLOCKED_IP_VALUE, timestamp: currentTime })
      } catch (error) {
        console.error('Failed to set data in Redis:', error)
      }

      return response.status(403).send({ error: 'Access denied. You are likely using a VPN.' })
    }
  }

  await next()
}
