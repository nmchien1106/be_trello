import { createClient } from 'redis'

const redisClient = createClient({
    url: 'redis://127.0.0.1:6379',
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
        await redisClient.connect()
    } catch (err) {
        console.error('Initial Redis connection failed:', err)
    }
})()

export default redisClient
