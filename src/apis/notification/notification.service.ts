import NotificationRepository from "./notification.repository";
import { CreateNotificationDto } from "./notification.dto";
import { Notification } from "@/entities/notification.entity";
import { User } from "@/entities/user.entity";
import { NotificationType } from "@/enums/notification.enum";
import { notificationSSEService } from "./SSE/notification-sse.service";

interface GetUserNotificationsOptions {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean
}


class NotificationService {
    create = async (notify: CreateNotificationDto) => {
        const saved = await NotificationRepository.create({
            message: notify.message,
            user: notify.user,
            type: notify.type as NotificationType,
            data: notify.data,
            isRead: false,
            actionUrl: notify.actionUrl || undefined,
            entityType: notify.entityType,
            entityId: notify.entityId,
            actor: notify.actor
        });

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

        const limit = options.limit || 10;
        const offset = options.offset || 0;
        const unreadOnly = options.unreadOnly || false;

        const query: any = {
            user: { id: userId }
        }

        if (unreadOnly) {
            query.isRead = false;
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

        return { notifications, total, limit, offset };
    }

    delete = async (id: string): Promise<void> => {
        await NotificationRepository.delete(id);
    }

    markAsRead = async (id: string): Promise<void> => {
        await NotificationRepository.update(id, {
            isRead: true
        })
    }

    markAllAsRead = async (userId: string): Promise<void> => {
        await NotificationRepository.update({
            user: { id: userId }
        }, {
            isRead: true
        })
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

export default new NotificationService();