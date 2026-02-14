import { EventType } from '@/enums/event-type.enum'

export interface ActivityDto {
    id: string
    eventId: string
    boardId: string
    cardId: string | null
    actorId: string
    type: EventType
    message: string
    payload?: any
    createdAt: string
    updatedAt: string
}

export interface PaginationParams {
    page?: number
    size?: number
}
