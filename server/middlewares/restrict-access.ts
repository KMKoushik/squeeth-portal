import requestIp from 'request-ip'

import { Middleware } from '../utils/middleware'
import { isIPBlockedInRedis, isVPN } from '../../utils/vpn'
import { redis } from '../../utils/redisClient'
import { BLOCKED_IP_VALUE } from '../../constants/restrictions'

export const restrictAccessMiddleware: Middleware = async (request, response, next) => {
  const ip = requestIp.getClientIp(request)

  const allowedIPs = (process.env.WHITELISTED_IPS || '').split(',')
  const isIPWhitelisted = ip && allowedIPs.includes(ip)

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
