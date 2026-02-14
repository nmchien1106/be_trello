import { DomainEvent } from '../../events/interface'
import { EventType } from '../../enums/event-type.enum'

export class ActivityMessageFactory {
    static build(event: DomainEvent): string {
        switch (event.type) {
            case EventType.BOARD_CREATED:
                return `Board created: ${event.payload?.title ?? ''}`

            case EventType.CARD_CREATED:
                return `Card created`

            case EventType.CARD_UPDATED:
                return `Card updated`

            case EventType.CARD_MOVED:
                return `Card moved from list ${event.payload.fromListId} to ${event.payload.toListId}`

            case EventType.CARD_REORDERED:
                return `Card reordered`

            case EventType.CARD_ARCHIVED:
                return `Card archived`

            case EventType.CARD_RESTORED:
                return `Card restored`

            case EventType.CARD_MEMBER_ASSIGNED:
                return `Member assigned to card`

            case EventType.CARD_MEMBER_REMOVED:
                return `Member removed from card`

            case EventType.COMMENT_CREATED:
                return `Comment added`

            case EventType.COMMENT_UPDATED:
                return `Comment updated`

            case EventType.COMMENT_DELETED:
                return `Comment deleted`

            default:
                return `Activity occurred`
        }
    }
}
