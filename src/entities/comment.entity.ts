import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { DateTimeEntity } from './base/DateTimeEntity'
import { Card } from './card.entity'
import { User } from './user.entity'

@Entity('comments')
export class Comment extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string

    @Column({ type: 'text' })
    content: string

    @ManyToOne(() => Card, (card) => card.comments, { onDelete: 'CASCADE' })
    card: Card

    @ManyToOne(() => User, (user) => user.comments, { onDelete: 'SET NULL' })
    user: User
}
