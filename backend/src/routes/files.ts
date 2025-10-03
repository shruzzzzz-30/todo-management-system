import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads/todos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE!) || 10485760 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Allow most common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar|xlsx|xls|ppt|pptx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /image\/|application\/|text\//.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// Upload files to todo
router.post('/upload/:todoId', authenticateToken, upload.array('files', 5), async (req: AuthRequest, res, next) => {
  try {
    const { todoId } = req.params;
    const userId = req.user!.id;

    // Verify user has access to this todo
    const todo = await prisma.todo.findFirst({
      where: {
        id: todoId,
        OR: [
          { assignedToId: userId },
          { createdById: userId }
        ]
      }
    });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found or access denied' });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Create file records in database
    const filePromises = req.files.map(file => 
      prisma.file.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          path: `/uploads/todos/${file.filename}`,
          size: file.size,
          mimeType: file.mimetype,
          todoId
        }
      })
    );

    const files = await Promise.all(filePromises);

    res.status(201).json({
      message: 'Files uploaded successfully',
      files
    });
  } catch (error) {
    next(error);
  }
});

// Get all files for a todo
router.get('/todo/:todoId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { todoId } = req.params;
    const userId = req.user!.id;

    // Verify user has access to this todo
    const todo = await prisma.todo.findFirst({
      where: {
        id: todoId,
        OR: [
          { assignedToId: userId },
          { createdById: userId }
        ]
      }
    });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found or access denied' });
    }

    const files = await prisma.file.findMany({
      where: { todoId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(files);
  } catch (error) {
    next(error);
  }
});

// Get all files for current user
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const files = await prisma.file.findMany({
      where: {
        todo: {
          OR: [
            { assignedToId: userId },
            { createdById: userId }
          ]
        }
      },
      include: {
        todo: {
          select: {
            id: true,
            title: true,
            status: true,
            createdBy: {
              select: { id: true, name: true }
            },
            assignedTo: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(files);
  } catch (error) {
    next(error);
  }
});

// Download file
router.get('/download/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const file = await prisma.file.findFirst({
      where: {
        id,
        todo: {
          OR: [
            { assignedToId: userId },
            { createdById: userId }
          ]
        }
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    const filePath = path.join(process.cwd(), 'uploads/todos', file.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimeType);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// Delete file
router.delete('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const file = await prisma.file.findFirst({
      where: {
        id,
        todo: {
          OR: [
            { assignedToId: userId },
            { createdById: userId }
          ]
        }
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), 'uploads/todos', file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete file record from database
    await prisma.file.delete({
      where: { id }
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get file info
router.get('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const file = await prisma.file.findFirst({
      where: {
        id,
        todo: {
          OR: [
            { assignedToId: userId },
            { createdById: userId }
          ]
        }
      },
      include: {
        todo: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    res.json({ file });
  } catch (error) {
    next(error);
  }
});

export default router;

