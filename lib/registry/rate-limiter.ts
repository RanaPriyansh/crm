/**
 * Rate Limiter with Circuit Breaker
 * For OpenCorporates and other rate-limited APIs
 */

export interface RateLimiterConfig {
    maxTokens: number          // Max requests per window
    refillRate: number         // Tokens per minute
    pauseOnLimitMs: number     // How long to pause on 429
}

const DEFAULT_CONFIG: RateLimiterConfig = {
    maxTokens: 50,
    refillRate: 50,
    pauseOnLimitMs: 60000,
}

export class RateLimiter {
    private tokens: number
    private lastRefill: number
    private paused: boolean = false
    private pauseUntil: number = 0
    private config: RateLimiterConfig

    constructor(config: Partial<RateLimiterConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config }
        this.tokens = this.config.maxTokens
        this.lastRefill = Date.now()
    }

    private refillTokens(): void {
        const now = Date.now()
        const elapsed = now - this.lastRefill
        const tokensToAdd = Math.floor((elapsed / 60000) * this.config.refillRate)

        if (tokensToAdd > 0) {
            this.tokens = Math.min(this.config.maxTokens, this.tokens + tokensToAdd)
            this.lastRefill = now
        }
    }

    private async waitForResume(): Promise<void> {
        const waitTime = this.pauseUntil - Date.now()
        if (waitTime > 0) {
            await new Promise(resolve => setTimeout(resolve, waitTime))
        }
        this.paused = false
    }

    private async waitForRefill(): Promise<void> {
        // Wait for at least one token
        const msPerToken = 60000 / this.config.refillRate
        await new Promise(resolve => setTimeout(resolve, msPerToken))
        this.refillTokens()
    }

    async canProceed(): Promise<boolean> {
        if (this.paused && Date.now() < this.pauseUntil) {
            return false
        }
        this.paused = false
        this.refillTokens()
        return this.tokens > 0
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        // Wait if paused (circuit breaker tripped)
        if (this.paused) {
            await this.waitForResume()
        }

        // Wait for token availability
        this.refillTokens()
        while (this.tokens <= 0) {
            await this.waitForRefill()
        }

        this.tokens--

        try {
            return await fn()
        } catch (error: unknown) {
            // Check for rate limit response
            if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
                this.paused = true
                this.pauseUntil = Date.now() + this.config.pauseOnLimitMs
                throw new Error(`Rate limited - circuit breaker tripped, pausing for ${this.config.pauseOnLimitMs}ms`)
            }
            throw error
        }
    }

    getStatus(): { tokens: number; paused: boolean; pauseRemaining: number } {
        this.refillTokens()
        return {
            tokens: this.tokens,
            paused: this.paused,
            pauseRemaining: this.paused ? Math.max(0, this.pauseUntil - Date.now()) : 0,
        }
    }
}

// Singleton for OpenCorporates
let openCorporatesLimiter: RateLimiter | null = null

export function getOpenCorporatesLimiter(): RateLimiter {
    if (!openCorporatesLimiter) {
        openCorporatesLimiter = new RateLimiter({
            maxTokens: 50,
            refillRate: 50,
            pauseOnLimitMs: 60000,
        })
    }
    return openCorporatesLimiter
}
