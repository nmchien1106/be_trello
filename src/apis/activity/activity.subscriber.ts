import { IActivityRepository } from './activity.repository'
import { EventBus } from '../../events/event-bus'
import { DomainEvent } from '../../events/interface'
import { ActivityMessageFactory } from './activity-message.factory'

export class ActivitySubscriber {
    constructor(private repo: IActivityRepository) {}

    async init() {
        await EventBus.subscribe(this.handleEvent.bind(this))
    }

    private async handleEvent(event: DomainEvent) {
        console.log('Activity event received:', event)
        const message = ActivityMessageFactory.build(event)

        let boardTitle: string | null = null
        let cardTitle: string | null = null
        if (event.payload) {
            if (typeof event.payload.title === 'string') {
                if (event.type.startsWith('BOARD_')) {
                    boardTitle = event.payload.title
                } else if (event.type.startsWith('CARD_')) {
                    cardTitle = event.payload.title
                }
            }

            if (event.payload.changes && event.payload.changes.title) {
                if (event.type.startsWith('BOARD_')) {
                    boardTitle = event.payload.changes.title
                } else if (event.type.startsWith('CARD_')) {
                    cardTitle = event.payload.changes.title
                }
            }
        }

        await this.repo.create({
            eventId: event.eventId,
            boardId: event.boardId,
            boardTitle,
            cardId: 'cardId' in event ? event.cardId : null,
            cardTitle,
            actorId: event.actorId,
            type: event.type,
            message,
            payload: event.payload ?? null
        })
    }
}
