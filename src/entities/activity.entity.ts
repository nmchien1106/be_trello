import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm'
import { DateTimeEntity } from './base/DateTimeEntity'
import { EventType } from '@/enums/event-type.enum'
import { User } from './user.entity'
import { Board } from './board.entity'
import { Card } from './card.entity'
import { Workspace } from './workspace.entity'

@Entity('activities')
export class Activity extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', unique: true })
    eventId: string

    @Column({ type: 'uuid', nullable: true })
    boardId: string | null

    @Column({ type: 'varchar', length: 255, nullable: true })
    boardTitle: string | null

    @Column({ type: 'uuid', nullable: true })
    cardId: string | null

    @Column({ type: 'varchar', length: 255, nullable: true })
    cardTitle: string | null

    @Column({ type: 'uuid' })
    actorId: string

    @Column({ type: 'enum', enum: EventType })
    type: EventType

    @Column({ type: 'text' })
    message: string

    @Column({ type: 'jsonb', nullable: true })
    payload: Record<string, any> | null

    @ManyToOne(() => User)
    @JoinColumn({ name: 'actorId' })
    actor: User

    @ManyToOne(() => Workspace, { nullable: true })
    @JoinColumn({ name: 'workspaceId' })
    workspace: Workspace | null

    @ManyToOne(() => Board, { nullable: true })
    @JoinColumn({ name: 'boardId' })
    board: Board | null

    @ManyToOne(() => Card, { nullable: true })
    @JoinColumn({ name: 'cardId' })
    card: Card | null
}
