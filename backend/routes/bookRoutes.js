import express from 'express';
import multer from 'multer';
import { addBook, getBooks, getMyBooks, getBookById, getPopularBooks, deleteBook } from '../controllers/bookController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  '/',
  protect,
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'ownerPhotos', maxCount: 5 },
  ]),
  addBook
);

router.get('/', getBooks);
router.get('/mybooks', protect, getMyBooks);
router.get('/popular', getPopularBooks);
router.get('/:id', getBookById);
router.delete('/:id', protect, deleteBook);


export default router;