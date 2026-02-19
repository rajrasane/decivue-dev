/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Uses a sliding window approach per key (user ID or IP).
 * 
 * NOTE: This is per-process — it resets on redeploy and doesn't
 * share state across serverless instances. For production at scale,
 * use Redis-backed rate limiting (e.g. Upstash @upstash/ratelimit).
 * For a single-instance deployment (Render, Railway, VPS), this works fine.
 */

const windowMs = 60 * 1000       // 1-minute window
const maxRequests = 10           // max 10 requests per window per user

const requests = new Map<string, number[]>()

// Cleanup stale entries every 5 minutes
setInterval(() => {
    const now = Date.now()
    for (const [key, timestamps] of requests) {
        const valid = timestamps.filter(t => now - t < windowMs)
        if (valid.length === 0) {
            requests.delete(key)
        } else {
            requests.set(key, valid)
        }
    }
}, 5 * 60 * 1000)

export function rateLimit(key: string): { allowed: boolean; remaining: number; retryAfter?: number } {
    const now = Date.now()
    const timestamps = (requests.get(key) || []).filter(t => now - t < windowMs)

    if (timestamps.length >= maxRequests) {
        const oldestInWindow = timestamps[0]
        const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000)
        return { allowed: false, remaining: 0, retryAfter }
    }

    timestamps.push(now)
    requests.set(key, timestamps)

    return { allowed: true, remaining: maxRequests - timestamps.length }
}
