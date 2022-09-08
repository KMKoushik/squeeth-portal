import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'
import { IS_ANALYTICS_ENABLED } from '../../constants/analytics'
import { trackEvent } from '../../server/utils/analytics'

export async function middleware(req: NextRequest, event: NextFetchEvent) {
  console.log('Base ', req.nextUrl.pathname)
  event.waitUntil(trackEvent('API_REQUEST', 'example', {}))

  NextResponse.next()
}
