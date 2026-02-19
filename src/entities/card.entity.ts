import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { DateTimeEntity } from './base/DateTimeEntity'
import { CardMembers } from './card-member.entity'
import { Comment } from './comment.entity'
import { List } from './list.entity'
import { Checklist } from './checklist.entity'
import { Attachment } from './attachment.entity'

@Entity('cards')
export class Card extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string

    @Column({ type: 'varchar', length: 255 })
    title: string

    @Column({ type: 'text', nullable: true })
    description: string

    @Column({ type: 'float', default: 0 })
    position: number

    @Column("simple-array", { nullable: true })
    labels: string[] // Lưu mảng màu: ["#ff0000", "#00ff00"]

    @Column({ name: 'dueDate', type: 'timestamp', nullable: true }) 
    dueDate: Date

    @Column({ type: 'varchar', length: 255, nullable: true })
    backgroundUrl: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    backgroundPublicId: string

    @Column({ type: 'enum', enum: ['low', 'medium', 'high'], default: 'medium' })
    priority: string

    @Column({ type: 'boolean', default: false })
    isArchived: boolean

    @ManyToOne(() => List, (list) => list.cards, { onDelete: 'CASCADE' })
    list: List

    @OneToMany(() => CardMembers, (cardMember) => cardMember.card)
    public cardMembers: CardMembers[]

    @OneToMany(() => Comment, (comment) => comment.card)
    public comments: Comment[]

    @OneToMany(() => Checklist, (checklist) => checklist.card)
    public checklists: Checklist[]

    @OneToMany(() => Attachment, (attachment) => attachment.card)
    attachments: Attachment[]
}