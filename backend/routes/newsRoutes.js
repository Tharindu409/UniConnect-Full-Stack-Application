import express from 'express';
import {
  createNews,
  getAllNews,
  getSingleNews,
  updateNews,
  deleteNews,
} from '../controllers/newsController.js';

const router = express.Router();

router.post('/', createNews);
router.get('/', getAllNews);
router.get('/:id', getSingleNews);
router.put('/:id', updateNews);
router.delete('/:id', deleteNews);

export default router; 