import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { DateTimeEntity } from './base/DateTimeEntity'
import { User } from './user.entity'
import { EntityType } from '../enums/notification.enum'
import { EventType } from '@/enums/event-type.enum'

@Index(['user', 'isRead'])
@Entity('notifications')
export class Notification extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string

    @Column({ type: 'text' })
    message: string

    @Column({ type: 'varchar', length: 100, nullable: true })
    type: EventType

    @Column({ type: 'jsonb', nullable: true })
    payload: Record<string, any> | null

    @Column({ type: 'boolean', default: false })
    isRead: boolean

    @Column({ type: 'varchar', length: 500, nullable: true })
    actionUrl: string | null

    @Column({ type: 'enum', enum: EntityType })
    entityType: EntityType

    @Column({ type: 'uuid' })
    entityId: string

    @ManyToOne(() => User, (user) => user.notifications)
    user: User

    @ManyToOne(() => User)
    @JoinColumn({ name: 'actorId' })
    actor: User
}
