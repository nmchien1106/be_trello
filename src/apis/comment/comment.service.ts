import CommentRepository from './comment.repository'
import { CommentDTO } from './comment.dto'
import { EventBus } from '@/events/event-bus'
import { DomainEvent } from '@/events/interface'
import { EventType } from '@/enums/event-type.enum'
import crypto from 'crypto'

class CommentService {
    createComment = async (commentData: any) => {
        const comment = await CommentRepository.createComment(commentData)
        // reload with relations
        const full = await CommentRepository.findById(comment.id)
        if (full) {
            const evt: DomainEvent = {
                eventId: crypto.randomUUID(),
                type: EventType.COMMENT_CREATED,
                boardId: full.card.list.board.id,
                cardId: full.card.id,
                actorId: full.user.id,
                payload: { commentId: full.id, content: full.content }
            }
            EventBus.publish(evt)
        }
        return new CommentDTO(comment)
    }

    getCommentsOnCard = async (cardId: string) => {
        const comments = await CommentRepository.findCommentsOnCard(cardId)
        console.log(comments)
        return comments.map((comment) => new CommentDTO(comment))
    }

    deleteComment = async (commentId: string) => {
        const existing = await CommentRepository.findById(commentId)
        await CommentRepository.deleteComment(commentId)
        if (existing) {
            const evt: DomainEvent = {
                eventId: crypto.randomUUID(),
                type: EventType.COMMENT_DELETED,
                boardId: (existing.card as any)?.list ? ((existing.card as any).list.board?.id ?? null) : null,
                cardId: existing.card.id,
                actorId: existing.user.id,
                payload: { commentId: existing.id }
            }
            EventBus.publish(evt)
        }
        return
    }

    updateComment = async (commentId: string, commentData: any) => {
        const updatedComment = await CommentRepository.updateComment(commentId, commentData)
        if (updatedComment) {
            const evt: DomainEvent = {
                eventId: crypto.randomUUID(),
                type: EventType.COMMENT_UPDATED,
                boardId: (updatedComment.card as any)?.list
                    ? ((updatedComment.card as any).list.board?.id ?? null)
                    : null,
                cardId: updatedComment.card.id,
                actorId: updatedComment.user.id,
                payload: { commentId: updatedComment.id, content: updatedComment.content }
            }
            EventBus.publish(evt)
        }
        return new CommentDTO(updatedComment)
    }

    getCommentById = async (commentId: string) => {
        const comment = await CommentRepository.findById(commentId)
        if (!comment) {
            throw new Error('Comment not found')
        }
        console.log(new CommentDTO(comment))
        return new CommentDTO(comment)
    }
}

export default new CommentService()
