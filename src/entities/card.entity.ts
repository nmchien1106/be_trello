import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { DateTimeEntity } from './base/DateTimeEntity'
import { CardMembers } from './card-member.entity'
import { Comment } from './comment.entity'
import { List } from './list.entity'
import { User } from './user.entity'

@Entity('cards')
export class Card extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string

    @Column({ type: 'varchar', length: 255 })
    title: string

    @Column({ type: 'text', nullable: true })
    description: string

    @Column({ type: 'int', default: 0 })
    position: number

    @Column({ type: 'varchar', length: 255, nullable: true })
    coverUrl: string

    @Column({ type: 'enum', enum: ['low', 'medium', 'high'], default: 'medium' })
    priority: string

    @Column({ name: 'dueDate', type: 'date', nullable: true })
    dueDate: Date

    @Column({ type: 'boolean', default: false })
    isArchived: boolean

    @ManyToOne(() => List, (list) => list.cards, { onDelete: 'CASCADE' })
    list: List


    @OneToMany(() => CardMembers, (cardMember) => cardMember.card)
    public cardMembers: CardMembers[]

    @OneToMany(() => Comment, (comment) => comment.card)
    public comments: Comment[]
}
