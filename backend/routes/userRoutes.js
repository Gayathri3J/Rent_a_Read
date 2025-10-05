import express from 'express';
import { registerUser, authUser, getUsers, getUserById, forgotPassword, resetPassword, testEmail } from '../controllers/userController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').post(registerUser).get(protect, admin, getUsers);
router.post('/login', authUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/test-email', testEmail);


router.get(['/login', '/forgot-password', '/reset-password', '/test-email'], (req, res) => {
  res.status(405); 
  throw new Error(`GET method is not supported for ${req.path}. Please use POST.`);
});

router.route('/:id').get(getUserById);

export default router;
