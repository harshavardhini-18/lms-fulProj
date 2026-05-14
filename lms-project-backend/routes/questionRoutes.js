import { Router } from 'express';
import { requireAdmin, requireUser } from '../middleware/auth.js';
import {
  bulkCreate,
  create,
  getById,
  list,
  remove,
  update,
} from '../controllers/questionController.js';

const router = Router();

router.use(requireUser);

router.get('/', list);
router.get('/:id', getById);
router.post('/', requireAdmin, create);
router.post('/bulk', requireAdmin, bulkCreate);
router.put('/:id', requireAdmin, update);
router.delete('/:id', requireAdmin, remove);

export default router;
