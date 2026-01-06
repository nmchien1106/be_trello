import { UserDTOForRelation } from '../users/user.dto'
import { CardDTOForRelation } from '../card/card.dto'

export class CommentDTO {
    id: string
    content: string
    card?: CardDTOForRelation | null
    user: UserDTOForRelation
    createdAt: Date
    updatedAt: Date

    constructor(partial: Partial<CommentDTO>) {
        this.id = partial.id!
        this.content = partial.content!
        if (partial.card) {
            this.card = new CardDTOForRelation(partial.card)
        }
        this.user = new UserDTOForRelation(partial.user!)
        this.createdAt = partial.createdAt!
        this.updatedAt = partial.updatedAt!
    }
}
