import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Create regular users
  const userPassword = await bcrypt.hash('password123', 12);
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@example.com',
      password: userPassword,
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: userPassword,
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  // Create sample todos
  const todo1 = await prisma.todo.create({
    data: {
      title: 'Setup project documentation',
      description: 'Create comprehensive documentation for the todo management system',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      order: 1,
      createdById: admin.id,
      assignedToId: user1.id,
    },
  });

  const todo2 = await prisma.todo.create({
    data: {
      title: 'Implement user authentication',
      description: 'Add JWT-based authentication system',
      status: 'IN_PROGRESS',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      order: 2,
      createdById: admin.id,
      assignedToId: user2.id,
    },
  });

  const todo3 = await prisma.todo.create({
    data: {
      title: 'Design database schema',
      description: 'Create ERD and implement database tables',
      status: 'COMPLETED',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      order: 3,
      createdById: user1.id,
      assignedToId: user1.id,
    },
  });

  const todo4 = await prisma.todo.create({
    data: {
      title: 'Create API endpoints',
      description: 'Implement RESTful API for todo management',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      order: 4,
      createdById: user2.id,
      assignedToId: admin.id,
    },
  });

  console.log('Database seeded successfully!');
  console.log('Users created:');
  console.log('- Admin: admin@example.com / admin123');
  console.log('- John: john@example.com / password123');
  console.log('- Jane: jane@example.com / password123');
  console.log(`Created ${await prisma.todo.count()} todos`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

