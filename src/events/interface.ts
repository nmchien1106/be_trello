import { EventType } from '../enums/event-type.enum'

export interface DomainEvent {
    eventId: string
    type: EventType
    boardId: string
    cardId?: string
    actorId: string
    payload?: any
}
