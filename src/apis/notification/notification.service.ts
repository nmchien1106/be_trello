import NotificationRepository from './notification.repository'
import { CreateNotificationDto } from './notification.dto'
import { Notification } from '@/entities/notification.entity'
import { User } from '@/entities/user.entity'
import { EventType } from '@/enums/event-type.enum'
import { notificationSSEService } from './SSE/notification-sse.service'
import redisClient from '@/config/redis.config'
import crypto from 'crypto'

interface GetUserNotificationsOptions {
    limit?: number
    offset?: number
    unreadOnly?: boolean
}

class NotificationService {
    create = async (notify: CreateNotificationDto) => {
        // Drop duplicate notifications in a short time window to avoid SSE spam.
        // This is intentionally fail-open: if Redis is down, notifications still work.
        const dedupeTtlSeconds = Number(process.env.NOTIFICATION_DEDUPE_TTL_SECONDS) || 10
        try {
            if (dedupeTtlSeconds > 0) {
                const payloadStr = notify.payload ? stableStringify(notify.payload) : ''
                const base = [
                    notify.user?.id ?? '',
                    String(notify.type ?? ''),
                    String(notify.entityType ?? ''),
                    String(notify.entityId ?? ''),
                    notify.actor?.id ?? '',
                    notify.message ?? '',
                    notify.actionUrl ?? '',
                    payloadStr
                ].join('|')

                const hash = crypto.createHash('sha256').update(base).digest('hex')
                const key = `notif:dedupe:v1:${notify.user.id}:${hash}`

                const setResult = await redisClient.set(key, '1', {
                    NX: true,
                    EX: dedupeTtlSeconds
                })

                if (setResult !== 'OK') {
                    return null
                }
            }
        } catch {
            // ignore redis errors
        }

        const saved = await NotificationRepository.create({
            message: notify.message,
            user: notify.user,
            type: notify.type as EventType,
            payload: notify.payload,
            isRead: false,
            actionUrl: notify.actionUrl || undefined,
            entityType: notify.entityType,
            entityId: notify.entityId,
            actor: notify.actor
        })

        const relations = await NotificationRepository.findOne({
            where: {
                id: saved.id
            },
            relations: ['user', 'actor']
        })

        notificationSSEService.sendToUser(notify.user.id, relations!)

        return relations!
    }

    getUserNotifications = async (userId: string, options: GetUserNotificationsOptions) => {
        const limit = options.limit || 10
        const offset = options.offset || 0
        const unreadOnly = options.unreadOnly || false

        const query: any = {
            user: { id: userId }
        }

        if (unreadOnly) {
            query.isRead = false
        }

        const [notifications, total] = await NotificationRepository.repo.findAndCount({
            where: query,
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
            relations: ['user', 'actor'],
            select: {
                user: {
                    id: true,
                    avatarUrl: true,
                    username: true
                },
                actor: {
                    id: true,
                    avatarUrl: true,
                    username: true
                }
            }
        })

        return { notifications, total, limit, offset }
    }

    delete = async (id: string): Promise<void> => {
        await NotificationRepository.delete(id)
    }

    markAsRead = async (id: string): Promise<void> => {
        await NotificationRepository.update(id, {
            isRead: true
        })
    }

    markAllAsRead = async (userId: string): Promise<void> => {
        await NotificationRepository.update(
            {
                user: { id: userId }
            },
            {
                isRead: true
            }
        )
    }

    getUnreadCount = async (userId: string): Promise<number> => {
        return await NotificationRepository.count({
            where: {
                user: { id: userId },
                isRead: false
            }
        })
    }
}

export default new NotificationService()

function stableStringify(value: unknown): string {
    const seen = new WeakSet<object>()
    return JSON.stringify(value, (_key, val: any) => {
        if (val && typeof val === 'object') {
            if (seen.has(val)) return undefined
            seen.add(val)

            if (Array.isArray(val)) return val

            const sorted: Record<string, unknown> = {}
            for (const key of Object.keys(val).sort()) {
                sorted[key] = val[key]
            }
            return sorted
        }
        return val
    })
}
