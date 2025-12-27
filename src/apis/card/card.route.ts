import { Router } from 'express';
import cardController from './card.controller';
import { verifyAccessToken } from '@/utils/jwt';
import { validateHandle } from '@/middleware/validate-handle';
import { CreateCardSchema } from './card.schema';

const route = Router();
// Create a new card
route.post('/', verifyAccessToken, cardController.createCard);

// Get card by id
route.get('/:id', verifyAccessToken, cardController.getCardById);

// Update a card
route.patch('/:id', verifyAccessToken, cardController.updateCard);

// Delete a card
route.delete('/:id', verifyAccessToken, cardController.deleteCard);
export default route;
