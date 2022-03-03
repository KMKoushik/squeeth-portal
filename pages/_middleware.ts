import { NextRequest, NextResponse } from 'next/server'

const BLOCKED_COUNTRIES = ['US', 'BY', 'CU', 'IR', 'IQ', 'CI', 'LR', 'KP', 'SD', 'SY', 'ZW']
const ALLOWED_URLS = ['images', 'fonts', 'favicon.ico']

export function middleware(req: NextRequest) {
  const country = req?.geo?.country
  const response = NextResponse.next()
  console.log(req.url)
  const path = req.url.split('/')[1]
  console.log(path, ALLOWED_URLS.includes(path))

  if (!ALLOWED_URLS.includes(path) && country && BLOCKED_COUNTRIES.includes(country)) {
    return NextResponse.rewrite('/blocked')
  }

  return response
}
