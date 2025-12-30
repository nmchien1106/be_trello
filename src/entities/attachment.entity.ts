import { DateTimeEntity } from "./base/DateTimeEntity";
import { Card } from "./card.entity";
import { User } from "./user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('attachments')
export class Attachment extends DateTimeEntity{
    @PrimaryGeneratedColumn('uuid')
    public id: string

    @Column({ type: 'varchar', length: 255 })
    fileName: string

    @Column({ type: 'text' })
    fileUrl: string

    @Column({ type: 'varchar', nullable: true })
    publicId: string

    @ManyToOne(() => Card, (card) => card.attachments, {
        onDelete: 'CASCADE'
    })
    card: Card

    @ManyToOne(() => User)
    uploadedBy: User
}