import { Router } from 'express';
import cardController from './card.controller';
import { verifyAccessToken } from '@/utils/jwt';
import { validateHandle } from '@/middleware/validate-handle';
import { CreateCardSchema } from './card.schema';

const route = Router();

route.post('/', verifyAccessToken, validateHandle(CreateCardSchema), cardController.createCard);
route.get('/list/:listId', verifyAccessToken, cardController.getAllCardsInList);
route.patch('/:id', verifyAccessToken, cardController.updateCard);
route.delete('/:id', verifyAccessToken, cardController.deleteCard);
export default route;
