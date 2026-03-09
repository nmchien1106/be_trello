import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { DateTimeEntity } from './base/DateTimeEntity'
import { User } from './user.entity'
import { EntityType, NotificationType } from '../enums/notification.enum'

@Entity('notifications')
export class Notification extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string

    @Column({ type: 'text' })
    message: string

    @Column({
        type: 'enum',
        enum: NotificationType,
        default: NotificationType.CARD_ASSIGNED
    })
    type: NotificationType

    @Column({ type: 'json', nullable: true })
    data: Record<string, any> | null

    @Column({
        type: 'boolean',
        default: false
    })
    isRead: boolean


    @Column({ type: 'varchar', length: 500, nullable: true })
    actionUrl: string | null

    @Column({ type: 'uuid' })
    actorId: string

    @Column({
        type: 'enum',
        enum: EntityType
    })
    entityType: EntityType

    @Column({ type: 'uuid' })
    entityId: string

    @ManyToOne(() => User, (user) => user.notifications)
    user: User

    @ManyToOne(() => User)
    @JoinColumn({ name: 'actorId' })
    actor: User
}
