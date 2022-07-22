import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'

enum bool {
  true = 'true',
  false = 'false',
}

export function middleware(req: NextRequest, __: NextFetchEvent) {
  console.log('Base ', req.nextUrl.pathname)
  const isApiRequest = req.nextUrl.pathname.startsWith('/api/action') || req.nextUrl.pathname.startsWith('/api/views')
  if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS == bool.true || !isApiRequest) {
    NextResponse.next()
  } else {
    return new Response('Analytics is Disabled!')
  }
}
