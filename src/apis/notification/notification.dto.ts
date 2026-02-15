import { User } from '@/entities/user.entity';
import { EntityType, NotificationType } from '@/enums/notification.enum';

export interface CreateNotificationDto {
    user: User
    message: string
    type: NotificationType
    actionUrl?: string
    actor: User
    entityType: EntityType
    entityId: string
    data?: Record<string, any>
    isRead?: boolean
}
