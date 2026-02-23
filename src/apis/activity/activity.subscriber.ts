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

        await this.repo.create({
            eventId: event.eventId,
            boardId: event.boardId,
            cardId: 'cardId' in event ? event.cardId : null,
            actorId: event.actorId,
            type: event.type,
            message,
            payload: event.payload ?? null
        })
    }
}
