import { EventType } from '../enums/event-type.enum'

export interface DomainEvent {
    eventId: string
    type: EventType
    boardId?: string
    cardId?: string
    listId?: string
    actorId: string
    workspaceId?: string
    payload?: any
}
