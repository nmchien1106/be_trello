import { Router } from 'express';
import listController from './list.controller';
import { verifyAccessToken } from '@/utils/jwt';
import { validateHandle } from '@/middleware/validate-handle';
import { CreateListSchema, UpdateListSchema } from './list.schema';

const route = Router();

route.post('/', verifyAccessToken, validateHandle(CreateListSchema), listController.createList);
route.get('/:id', verifyAccessToken, listController.getListById);
route.patch('/:id', verifyAccessToken, validateHandle(UpdateListSchema), listController.updateList);
route.patch('/:id/archive', verifyAccessToken, listController.archiveList);
route.patch('/:id/unarchive', verifyAccessToken, listController.unarchiveList);
route.delete('/:id', verifyAccessToken, listController.deleteList);

export default route;
