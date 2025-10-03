import express, { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../index';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { validateUserUpdate, handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// -------------------- Multer Config -------------------- //
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE!) || 10485760 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// -------------------- ROUTES -------------------- //

// Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { createdTodos: true, assignedTodos: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    if (req.user!.role !== 'ADMIN' && req.user!.id !== id)
      return res.status(403).json({ error: 'Access denied' });

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, status: true, profilePicture: true, createdAt: true, updatedAt: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/:id', authenticateToken, validateUserUpdate, handleValidationErrors, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    if (req.user!.role !== 'ADMIN' && req.user!.id !== id)
      return res.status(403).json({ error: 'Access denied' });

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, status: true, profilePicture: true, updatedAt: true }
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// -------------------- Password Update Route -------------------- //
router.put('/:id/password', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (req.user!.role !== 'ADMIN' && req.user!.id !== id)
      return res.status(403).json({ error: 'Access denied' });
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Current and new password are required' });

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: { id: true, name: true, email: true, role: true, status: true, profilePicture: true, updatedAt: true }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
});

// Upload profile picture
router.post('/:id/profile-picture', authenticateToken, upload.single('profilePicture'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    if (req.user!.role !== 'ADMIN' && req.user!.id !== id)
      return res.status(403).json({ error: 'Access denied' });

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const profilePicturePath = `/uploads/profiles/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id },
      data: { profilePicture: profilePicturePath },
      select: { id: true, name: true, email: true, role: true, status: true, profilePicture: true, updatedAt: true }
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Enable/Disable user (Admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['ACTIVE', 'DISABLED'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, email: true, role: true, status: true, updatedAt: true }
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    if (req.user!.id === id) return res.status(400).json({ error: 'Cannot delete your own account' });

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
