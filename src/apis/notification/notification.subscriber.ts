import { EventBus } from '../../events/event-bus'
import { DomainEvent } from '../../events/interface'
import { EventType } from '../../enums/event-type.enum'
import NotificationService from './notification.service'
import UserRepository from '../users/user.repository'
import CardRepository from '../card/card.repository'
import { EntityType } from '@/enums/notification.enum'

export class NotificationSubscriber {
    async init() {
        EventBus.subscribe(this.handleEvent.bind(this))
    }

    private async handleEvent(event: DomainEvent) {
        console.log('Notification event received:', event.type)

        try {
            switch (event.type) {
                case EventType.COMMENT_CREATED:
                    await this.handleCommentCreated(event)
                    break
                case EventType.CARD_MEMBER_ASSIGNED:
                    console.log('Card member assigned event received:', event)
                    await this.handleCardMemberAssigned(event)
                    break
                case EventType.CARD_MOVED:
                    await this.handleCardMoved(event)
                    break
            }
        } catch (error) {
            console.error(`Error handling notification for event ${event.type}:`, error)
        }
    }

    private async handleCommentCreated(event: DomainEvent) {
        const { cardId, actorId, boardId, payload } = event
        if (!cardId) return

        const members = await CardRepository.getMembersOfCard(cardId)
        const actor = await UserRepository.findById(actorId)
        if (!actor) return

        const notificationPromises = members
            .filter((m) => m.user.id !== actorId)
            .map((m) =>
                NotificationService.create({
                    user: m.user,
                    actor: actor,
                    type: event.type,
                    message: `${actor.username} đã bình luận trong thẻ mà bạn tham gia.`,
                    entityType: EntityType.COMMENT,
                    entityId: payload.commentId,
                    actionUrl: `/boards/${boardId}/cards/${cardId}`,
                    payload: { context: payload.content }
                })
            )

        await Promise.all(notificationPromises)
    }

    private async handleCardMemberAssigned(event: DomainEvent) {
        const { cardId, actorId, boardId, payload } = event
        const targetUserId = payload.userId

        if (!targetUserId || targetUserId === actorId) return

        const [actor, targetUser] = await Promise.all([
            UserRepository.findById(actorId),
            UserRepository.findById(targetUserId)
        ])

        if (actor && targetUser) {
            await NotificationService.create({
                user: targetUser,
                actor: actor,
                type: event.type,
                message: `${actor.username} đã gán bạn vào một thẻ mới.`,
                entityType: EntityType.CARD,
                entityId: cardId!,
                actionUrl: `/boards/${boardId}/cards/${cardId}`,
                payload: {}
            })
        }
    }

    private async handleCardMoved(event: DomainEvent) {
        const { cardId, actorId, boardId, payload } = event
        // Chỉ thông báo nếu chuyển sang Board khác hoặc có thay đổi quan trọng
        // Ví dụ: Thông báo cho các thành viên trong card
        if (!cardId) return

        const members = await CardRepository.getMembersOfCard(cardId)
        const actor = await UserRepository.findById(actorId)
        if (!actor) return

        const notificationPromises = members
            .filter((m) => m.user.id !== actorId)
            .map((m) =>
                NotificationService.create({
                    user: m.user,
                    actor: actor,
                    type: event.type,
                    message: `${actor.username} đã di chuyển thẻ của bạn.`,
                    entityType: EntityType.CARD,
                    entityId: cardId!,
                    actionUrl: `/boards/${boardId}/cards/${cardId}`,
                    payload: payload
                })
            )

        await Promise.all(notificationPromises)
    }
}
