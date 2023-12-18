import requestIp from 'request-ip'

import { Middleware } from '../utils/middleware'
import { isIPBlockedInRedis, isVPN } from '../../utils/vpn'
import { redis } from '../../utils/redisClient'
import { BLOCKED_IP_VALUE } from '../../constants/restrictions'

const ALLOWED_HOSTS = ['squeethportal.xyz', 'auction.opyn.co']
const ALLOWED_HOST_PATTERN = /^squeeth-portal-[a-zA-Z0-9-]+-opynfinance\.vercel\.app$/

export const restrictAccessMiddleware: Middleware = async (request, response, next) => {
  const ip = requestIp.getClientIp(request)

  const allowedIPs = (process.env.WHITELISTED_IPS || '').split(',')
  const isIPWhitelisted = ip && allowedIPs.includes(ip)

  const origin = request.headers['origin']
  console.log({ request: JSON.stringify(request) })

  // check if api request is from the squeethportal site
  // if yes, we allow the request without any restrictions
  const isRequestFromAllowedOrigin = origin && (ALLOWED_HOSTS.includes(origin) || ALLOWED_HOST_PATTERN.test(origin))
  console.log({ isRequestFromAllowedOrigin, origin })
  if (isRequestFromAllowedOrigin) {
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
