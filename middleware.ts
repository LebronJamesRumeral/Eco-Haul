import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function middleware(request: NextRequest) {
  // Only rate limit API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Get client identifier (IP or user agent as fallback)
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous'
  const identifier = `${ip}-${request.nextUrl.pathname}`
  
  const now = Date.now()
  const windowMs = 60000 // 1 minute window
  const maxRequests = 100 // 100 requests per minute per endpoint
  
  const userLimit = rateLimitMap.get(identifier)
  
  // Reset window if expired or create new entry
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return NextResponse.next()
  }
  
  // Check if limit exceeded
  if (userLimit.count >= maxRequests) {
    return NextResponse.json(
      { 
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((userLimit.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': Math.max(0, maxRequests - userLimit.count).toString(),
          'X-RateLimit-Reset': new Date(userLimit.resetTime).toISOString(),
        }
      }
    )
  }
  
  // Increment request count
  userLimit.count++
  
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - userLimit.count).toString())
  response.headers.set('X-RateLimit-Reset', new Date(userLimit.resetTime).toISOString())
  
  return response
}

export const config = {
  matcher: '/api/:path*',
}
