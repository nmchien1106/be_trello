export class CreateCardDto {
    title!: string;
    listId!: string;
    description?: string | null;
    coverUrl?: string | null;
    dueDate?: string | null;
    priority?: 'low' | 'medium' | 'high';
  }
  