import express, { Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateTodoCreation, validateTodoUpdate, handleValidationErrors } from '../middleware/validation';
import { upload } from '../middleware/upload';

const router = express.Router();

// Get todos for current user (assigned to them or created by them)
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { type, status, search } = req.query;
    const userId = req.user!.id;

    let whereClause: any = {};

    if (type === 'assigned') {
      whereClause.assignedToId = userId;
    } else if (type === 'created') {
      whereClause.createdById = userId;
    } else {
      whereClause.OR = [
        { assignedToId: userId },
        { createdById: userId }
      ];
    }

    if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status as string)) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const todos = await prisma.todo.findMany({
      where: whereClause,
      include: {
        createdBy: { select: { id: true, name: true, email: true, profilePicture: true } },
        assignedTo: { select: { id: true, name: true, email: true, profilePicture: true } },
        files: { select: { id: true, filename: true, originalName: true, path: true, size: true, mimeType: true } },
        _count: { select: { files: true } }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(todos);
  } catch (error) {
    next(error);
  }
});

// Get todo by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const todo = await prisma.todo.findFirst({
      where: { id, OR: [{ assignedToId: userId }, { createdById: userId }] },
      include: {
        createdBy: { select: { id: true, name: true, email: true, profilePicture: true } },
        assignedTo: { select: { id: true, name: true, email: true, profilePicture: true } },
        files: { select: { id: true, filename: true, originalName: true, path: true, size: true, mimeType: true, createdAt: true } }
      }
    });

    if (!todo) return res.status(404).json({ error: 'Todo not found or access denied' });
    res.json({ todo });
  } catch (error) {
    next(error);
  }
});

// Create new todo with file upload
router.post(
  '/',
  authenticateToken,
  upload.array('files', 5), // max 5 files
  validateTodoCreation,
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { title, description, assignedToId, dueDate } = req.body;
      const createdById = req.user!.id;

      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { id: true, status: true }
      });

      if (!assignedUser || assignedUser.status === 'DISABLED') {
        return res.status(400).json({ error: 'Assigned user not found or disabled' });
      }

      // Create todo
      const todo = await prisma.todo.create({
        data: { title, description, createdById, assignedToId, dueDate: dueDate ? new Date(dueDate) : null }
      });

      // Save uploaded files in DB
      const filesData = (req.files as Express.Multer.File[]).map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/${file.filename}`,
        size: file.size,
        mimeType: file.mimetype,
        todoId: todo.id
      }));

      if (filesData.length > 0) await prisma.file.createMany({ data: filesData });

      const todoWithFiles = await prisma.todo.findUnique({
        where: { id: todo.id },
        include: { files: true, createdBy: true, assignedTo: true }
      });

      res.status(201).json({ message: 'Todo created successfully', todo: todoWithFiles });
    } catch (error) {
      next(error);
    }
  }
);

// Update todo
// Update todo
router.put('/:id', authenticateToken, validateTodoUpdate, handleValidationErrors, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, status, dueDate, order, assignedToId } = req.body; // include assignedToId
    const userId = req.user!.id;

    const existingTodo = await prisma.todo.findFirst({
      where: { id, OR: [{ assignedToId: userId }, { createdById: userId }] }
    });

    if (!existingTodo) return res.status(404).json({ error: 'Todo not found or access denied' });

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (order !== undefined) updateData.order = order;

    // ✅ Update assigned user if provided
    if (assignedToId !== undefined) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { id: true, status: true }
      });
      if (!assignedUser || assignedUser.status === 'DISABLED') {
        return res.status(400).json({ error: 'Assigned user not found or disabled' });
      }
      updateData.assignedToId = assignedToId;
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true, profilePicture: true } },
        assignedTo: { select: { id: true, name: true, email: true, profilePicture: true } },
        files: { select: { id: true, filename: true, originalName: true, path: true, size: true, mimeType: true } }
      }
    });

    res.json({ message: 'Todo updated successfully', todo });
  } catch (error) {
    next(error);
  }
});


// Reorder multiple todos
router.patch('/reorder', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { todoUpdates } = req.body;
    const userId = req.user!.id;

    if (!Array.isArray(todoUpdates)) return res.status(400).json({ error: 'todoUpdates must be an array' });

    const todoIds = todoUpdates.map(update => update.id);
    const userTodos = await prisma.todo.findMany({
      where: { id: { in: todoIds }, OR: [{ assignedToId: userId }, { createdById: userId }] },
      select: { id: true }
    });

    if (userTodos.length !== todoIds.length) return res.status(403).json({ error: 'Access denied to some todos' });

    const updatePromises = todoUpdates.map(update => prisma.todo.update({ where: { id: update.id }, data: { order: update.order } }));
    await prisma.$transaction(updatePromises);

    res.json({ message: 'Todo order updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete todo
router.delete('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const todo = await prisma.todo.findFirst({ where: { id, createdById: userId } });
    if (!todo) return res.status(404).json({ error: 'Todo not found or access denied' });

    await prisma.todo.delete({ where: { id } });
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get users for assignment dropdown
router.get('/users/assignable', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, email: true, profilePicture: true },
      orderBy: { name: 'asc' }
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

export default router;
