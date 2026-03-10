import { User } from '@/entities/user.entity';
import { EntityType } from '@/enums/notification.enum';
import { EventType } from '@/enums/event-type.enum';

export interface CreateNotificationDto {
    user: User
    message: string
    type: EventType
    actionUrl?: string
    actor: User
    entityType: EntityType
    entityId: string
    payload?: Record<string, any>
    isRead?: boolean
}
