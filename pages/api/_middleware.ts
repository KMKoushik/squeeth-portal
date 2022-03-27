import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'

enum bool {
  true = 'true',
  false = 'false',
}

export function middleware(_: NextRequest, __: NextFetchEvent) {
  if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS == bool.true) {
    NextResponse.next()
  } else {
    return new Response('Analytics is Disabled!')
  }
}
