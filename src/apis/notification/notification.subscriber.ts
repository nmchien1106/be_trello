import { EventBus } from '../../events/event-bus'
import { DomainEvent } from '../../events/interface'
import { EventType } from '../../enums/event-type.enum'
import NotificationService from './notification.service'
import UserRepository from '../users/user.repository'
import CardRepository from '../card/card.repository'
import BoardRepository from '../board/board.repository'
import { WorkspaceRepository } from '../workspace/workspace.repository'
import { EntityType } from '@/enums/notification.enum'

const workspaceRepo = new WorkspaceRepository()

export class NotificationSubscriber {
    async init() {
        EventBus.subscribe(this.handleEvent.bind(this))
    }

    private async handleEvent(event: DomainEvent) {
        try {
            switch (event.type) {
                case EventType.COMMENT_CREATED:
                    await this.handleCommentCreated(event)
                    break
                case EventType.COMMENT_UPDATED:
                    await this.handleCommentUpdated(event)
                    break
                case EventType.COMMENT_DELETED:
                    await this.handleCommentDeleted(event)
                    break
                case EventType.CARD_MEMBER_ASSIGNED:
                    await this.handleCardMemberAssigned(event)
                    break
                case EventType.CARD_MEMBER_REMOVED:
                    await this.handleCardMemberRemoved(event)
                    break
                case EventType.CARD_MOVED:
                    await this.handleCardMoved(event)
                    break
                case EventType.WORKSPACE_MEMBER_ADDED:
                case EventType.WORKSPACE_MEMBER_JOINED:
                    await this.handleWorkspaceMemberEvent(event)
                    break
                case EventType.WORKSPACE_MEMBER_REMOVED:
                    await this.handleWorkspaceMemberRemoved(event)
                    break
                case EventType.BOARD_MEMBER_ADDED:
                    await this.handleBoardMemberAdded(event)
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
        const targetUserId = payload?.memberId || payload?.userId

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

    private async handleCardMemberRemoved(event: DomainEvent) {
        const { cardId, actorId, boardId, payload } = event
        const targetUserId = payload?.memberId || payload?.userId

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
                message: `${actor.username} đã xóa bạn khỏi một thẻ.`,
                entityType: EntityType.CARD,
                entityId: cardId!,
                actionUrl: boardId && cardId ? `/boards/${boardId}/cards/${cardId}` : undefined,
                payload: {}
            })
        }
    }

    private async handleCardMoved(event: DomainEvent) {
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
                    message: `${actor.username} đã di chuyển thẻ của bạn.`,
                    entityType: EntityType.CARD,
                    entityId: cardId!,
                    actionUrl: `/boards/${boardId}/cards/${cardId}`,
                    payload: payload
                })
            )

        await Promise.all(notificationPromises)
    }

    private async handleWorkspaceMemberEvent(event: DomainEvent) {
        const { workspaceId, actorId, payload } = event
        const actor = await UserRepository.findById(actorId)
        if (!actor || !workspaceId) return

        const workspace = await workspaceRepo.findById(workspaceId)
        if (!workspace) return

        let targetUser: any = null
        if (event.type === EventType.WORKSPACE_MEMBER_ADDED) {
            targetUser = await UserRepository.findByEmailAsync(payload.memberEmail)
        } else if (event.type === EventType.WORKSPACE_MEMBER_JOINED) {
            targetUser = workspace.owner // Notify owner when someone joins
        }

        if (targetUser && targetUser.id !== actorId) {
            await NotificationService.create({
                user: targetUser,
                actor: actor,
                type: event.type,
                message:
                    event.type === EventType.WORKSPACE_MEMBER_ADDED
                        ? `${actor.username} đã thêm bạn vào không gian làm việc ${workspace.title}.`
                        : `${actor.username} đã tham gia không gian làm việc ${workspace.title} của bạn.`,
                entityType: EntityType.WORKSPACE,
                entityId: workspaceId,
                actionUrl: `/workspace/${workspaceId}`,
                payload: {}
            })
        }
    }

    private async handleWorkspaceMemberRemoved(event: DomainEvent) {
        const { workspaceId, actorId, payload } = event
        const targetUserId = payload?.memberId
        if (!workspaceId || !targetUserId || targetUserId === actorId) return

        const [actor, targetUser] = await Promise.all([
            UserRepository.findById(actorId),
            UserRepository.findById(targetUserId)
        ])

        if (!actor || !targetUser) return

        const workspace = await workspaceRepo.findById(workspaceId)
        if (!workspace) return

        await NotificationService.create({
            user: targetUser,
            actor: actor,
            type: event.type,
            message: `${actor.username} đã xóa bạn khỏi không gian làm việc ${workspace.title}.`,
            entityType: EntityType.WORKSPACE,
            entityId: workspaceId,
            actionUrl: `/workspace/${workspaceId}`,
            payload: {}
        })
    }

    private async handleCommentUpdated(event: DomainEvent) {
        const { cardId, actorId, boardId, payload } = event
        if (!cardId) return

        const actionUrl = boardId ? `/boards/${boardId}/cards/${cardId}` : `/cards/${cardId}`

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
                    message: `${actor.username} đã chỉnh sửa bình luận trong thẻ mà bạn tham gia.`,
                    entityType: EntityType.COMMENT,
                    entityId: payload.commentId,
                    actionUrl,
                    payload: { context: payload.content }
                })
            )

        await Promise.all(notificationPromises)
    }

    private async handleCommentDeleted(event: DomainEvent) {
        const { cardId, actorId, boardId, payload } = event
        if (!cardId) return

        const actionUrl = boardId ? `/boards/${boardId}/cards/${cardId}` : `/cards/${cardId}`

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
                    message: `${actor.username} đã xóa một bình luận trong thẻ mà bạn tham gia.`,
                    entityType: EntityType.COMMENT,
                    entityId: payload.commentId,
                    actionUrl,
                    payload: {}
                })
            )

        await Promise.all(notificationPromises)
    }

    private async handleBoardMemberAdded(event: DomainEvent) {
        const { boardId, actorId } = event
        const actor = await UserRepository.findById(actorId)
        if (!actor || !boardId) return

        const board = await BoardRepository.getBoardById(boardId)
        if (!board) return

        // Notify board owner if a new member joined (not the owner themselves)
        const owner = board.owner
        if (owner && owner.id !== actorId) {
            await NotificationService.create({
                user: owner,
                actor: actor,
                type: event.type,
                message: `${actor.username} đã tham gia bảng ${board.title} của bạn.`,
                entityType: EntityType.BOARD,
                entityId: boardId,
                actionUrl: `/boards/${boardId}`,
                payload: {}
            })
        }
    }
}
