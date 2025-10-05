import express from 'express';
import { registerUser, authUser, getUsers, getUserById, testEmail } from '../controllers/userController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').post(registerUser).get(protect, admin, getUsers);
router.post('/login', authUser);
router.post('/test-email', testEmail);


router.get(['/login', '/test-email'], (req, res) => {
  res.status(405); 
  throw new Error(`GET method is not supported for ${req.path}. Please use POST.`);
});

router.route('/:id').get(protect, getUserById);

export default router;
