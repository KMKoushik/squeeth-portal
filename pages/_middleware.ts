import { NextRequest, NextResponse } from 'next/server'

const BLOCKED_COUNTRIES = ['US', 'BY', 'CU', 'IR', 'IQ', 'CI', 'LR', 'KP', 'SD', 'SY', 'ZW']
const ALLOWED_URLS = RegExp('(/images|/favicon.ico|/font)')

export function middleware(req: NextRequest) {
  const country = req?.geo?.country || 'US'
  const response = NextResponse.next()
  console.log(req.url)
  const path = req.url

  if (country && BLOCKED_COUNTRIES.includes(country) && !ALLOWED_URLS.test(path)) {
    return NextResponse.rewrite('/blocked')
  }

  return response
}
