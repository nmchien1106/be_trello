import { DomainEvent } from './interface'

type EventHandler = (event: DomainEvent) => Promise<void> | void

class SimpleEventBus {
    private handlers: EventHandler[] = []

    subscribe(handler: EventHandler) {
        this.handlers.push(handler)
    }

    publish(event: DomainEvent) {
        this.handlers.forEach((h) => void h(event))
    }
}

export const EventBus = new SimpleEventBus()
