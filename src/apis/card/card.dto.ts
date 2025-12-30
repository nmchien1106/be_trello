export class CreateCardDto {
    title!: string;
    listId!: string;
    description?: string | null;
    coverUrl?: string | null;
    dueDate?: string | null;
    priority?: 'low' | 'medium' | 'high';
  }

  export class CardDTOForRelation {
    id!: string;
    title : string;

    constructor(id: string, title: string) {
      this.id = id;
      this.title = title;
    }
  }
