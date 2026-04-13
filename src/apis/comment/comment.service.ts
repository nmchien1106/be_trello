import CommentRepository from './comment.repository'
import { CommentDTO } from './comment.dto'
import { EventBus } from '@/events/event-bus'
import { DomainEvent } from '@/events/interface'
import { EventType } from '@/enums/event-type.enum'
import crypto from 'crypto'

class CommentService {
    createComment = async (commentData: any) => {
        const comment = await CommentRepository.createComment(commentData)

        // Load đầy đủ relations: card -> list -> board
        const full = await CommentRepository.findById(comment.id)

        if (full && full.card?.list?.board) {
            const evt: DomainEvent = {
                eventId: crypto.randomUUID(),
                type: EventType.COMMENT_CREATED,
                boardId: full.card.list.board.id,
                cardId: full.card.id,
                actorId: full.user.id,
                payload: {
                    commentId: full.id,
                    content: full.content,
                    cardName: full.card.title,
                    listName: full.card.list.title
                }
            }

            EventBus.publish(evt)
        }

        return new CommentDTO(full || comment)
    }

    getCommentsOnCard = async (cardId: string) => {
        const comments = await CommentRepository.findCommentsOnCard(cardId)
        return comments.map((comment) => new CommentDTO(comment))
    }

    getCommentById = async (commentId: string) => {
        const comment = await CommentRepository.findById(commentId)
        if (!comment) {
            throw new Error('Comment not found')
        }
        return new CommentDTO(comment)
    }


    updateComment = async (commentId: string, commentData: any) => {
        const updatedComment = await CommentRepository.updateComment(commentId, commentData)

        if (updatedComment && updatedComment.card?.list?.board) {
            const evt: DomainEvent = {
                eventId: crypto.randomUUID(),
                type: EventType.COMMENT_UPDATED,
                boardId: updatedComment.card.list.board.id,
                cardId: updatedComment.card.id,
                actorId: updatedComment.user.id,
                payload: {
                    commentId: updatedComment.id,
                    content: updatedComment.content,
                    cardName: updatedComment.card.title,
                    listName: updatedComment.card.list.title
                }
            }

            EventBus.publish(evt)
        }

        return new CommentDTO(updatedComment)
    }

    deleteComment = async (commentId: string) => {
        const existing = await CommentRepository.findById(commentId)

        if (existing && existing.card?.list?.board) {
            const evt: DomainEvent = {
                eventId: crypto.randomUUID(),
                type: EventType.COMMENT_DELETED,
                boardId: existing.card.list.board.id,
                cardId: existing.card.id,
                actorId: existing.user.id,
                payload: {
                    commentId: existing.id,
                    content: existing.content,
                    cardName: existing.card.title,
                    listName: existing.card.list.title
                }
            }

            EventBus.publish(evt)
        }

        await CommentRepository.deleteComment(commentId)
        return
    }
}

export default new CommentService()
