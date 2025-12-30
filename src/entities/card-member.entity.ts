import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm'

import { DateTimeEntity } from './base/DateTimeEntity'
import { Card } from './card.entity'
import { User } from './user.entity'
import { Role } from './role.entity'

@Entity('card_members')
@Unique(['card', 'user'])
export class CardMembers extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string

    @ManyToOne(() => Card, (card) => card.cardMembers)
    card: Card

    @ManyToOne(() => User, (user) => user.cardMembers)
    user: User
}
