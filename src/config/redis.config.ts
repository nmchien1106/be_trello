import { createClient } from 'redis'

const normalizeRedisUrl = (): string => {
    const rawUrl = (process.env.REDIS_URL || '').trim().replace(/^['"]|['"]$/g, '')
    if (rawUrl) {
        if (/^rediss?:\/\//i.test(rawUrl)) {
            return rawUrl
        }
        return `redis://${rawUrl}`
    }

    const host = process.env.REDIS_HOST || '127.0.0.1'
    const port = process.env.REDIS_PORT || '6379'
    return `redis://${host}:${port}`
}

const redisClient = createClient({
    url: normalizeRedisUrl(),
    socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                return new Error('Redis reconnect failed')
            }
            return Math.min(retries * 500, 2000)
        }
    }
})

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err)
})

redisClient.on('connect', () => {
    console.log('Redis Client Connecting...')
})

redisClient.on('ready', () => {
    console.log('Redis Client Ready')
})
;(async () => {
    try {
        console.log('Redis URL:', normalizeRedisUrl().replace(/:\/\/.*@/, '://***@'))
        await redisClient.connect()
    } catch (err) {
        console.error('Initial Redis connection failed:', err)
    }
})()

export default redisClient
