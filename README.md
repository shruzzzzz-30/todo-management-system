# Todo Management System

A comprehensive web-based Todo Management System built with TypeScript, featuring user authentication, role-based access control, CRUD operations, file attachments, and admin functionality.

## 🚀 Features

### User Management
- **User Registration & Login**: JWT-based authentication with secure password hashing
- **User Profiles**: Profile management with profile picture upload
- **Role-Based Access**: User and Admin roles with different permissions
- **Session Management**: Secure logout and token refresh

### Todo Management
- **Full CRUD Operations**: Create, read, update, and delete todos
- **Rich Todo Attributes**: Title, description, assignee, due date, status, and file attachments
- **Assignment System**: Assign todos to yourself or other users
- **Status Tracking**: Pending, In Progress, and Completed statuses
- **Drag & Drop**: Reorder todos with drag-and-drop functionality (planned)

### File Management
- **File Attachments**: Attach files to todos during creation
- **File Browser**: View all uploaded files with links to related todos
- **Secure Storage**: Files stored securely with proper access control

### Admin Features
- **User Management**: View all users and enable/disable accounts
- **System Monitoring**: Monitor user activity and todo statistics
- **Comprehensive Dashboard**: Overview of system-wide metrics

### Views & Filters
- **Personal Views**: "Todos for me" and "Todos created by me"
- **Status Filters**: Filter todos by status (Pending, In Progress, Completed)
- **Search Functionality**: Search todos by title and description

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: Local file system (configurable for cloud storage)
- **Validation**: express-validator for input validation
- **Logging**: Winston for structured logging

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui component library
- **State Management**: React Context API
- **Forms**: React Hook Form with validation
- **HTTP Client**: Axios for API communication
- **Notifications**: Sonner for toast notifications

### Development Tools
- **Package Manager**: npm
- **Database Migrations**: Prisma migrations
- **Development Server**: nodemon for backend, Next.js dev server for frontend
- **Build Tools**: TypeScript compiler, Next.js build system

## 📁 Project Structure

```
todo-management-system/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   ├── index.ts         # Main server file
│   │   └── seed.ts          # Database seeding script
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── uploads/             # File upload directory
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # Frontend Next.js application
│   ├── src/
│   │   ├── app/             # Next.js app router pages
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   ├── package.json
│   └── next.config.js
├── docs/                    # Documentation
└── README.md
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd todo-management-system
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/todo_management"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key"
   PORT=3001
   NODE_ENV=development
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

5. **Start the backend server**
   ```bash
   npm run dev
   ```

6. **Set up the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   ```

7. **Configure frontend environment**
   Create a `.env.local` file in the frontend directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

8. **Start the frontend development server**
   ```bash
   npm run dev
   ```

9. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

### Demo Credentials
After running the seed script, you can use these demo accounts:

- **Admin User**: admin@example.com / admin123
- **Regular User 1**: john@example.com / password123
- **Regular User 2**: jane@example.com / password123

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

### User Management Endpoints
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/status` - Update user status (Admin only)
- `POST /api/users/:id/profile-picture` - Upload profile picture

### Todo Management Endpoints
- `GET /api/todos` - Get todos with filters
- `GET /api/todos/:id` - Get todo by ID
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo
- `PATCH /api/todos/reorder` - Reorder todos
- `GET /api/todos/users/assignable` - Get assignable users

### File Management Endpoints
- `POST /api/files/upload/:todoId` - Upload files to todo
- `GET /api/files` - Get all files
- `GET /api/files/todo/:todoId` - Get files for specific todo
- `GET /api/files/download/:id` - Download file
- `DELETE /api/files/:id` - Delete file

## 🏗 Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `name` (String)
- `email` (String, Unique)
- `password` (String, Hashed)
- `role` (Enum: USER, ADMIN)
- `status` (Enum: ACTIVE, DISABLED)
- `profilePicture` (String, Optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Todos Table
- `id` (UUID, Primary Key)
- `title` (String)
- `description` (String, Optional)
- `status` (Enum: PENDING, IN_PROGRESS, COMPLETED)
- `dueDate` (DateTime, Optional)
- `order` (Integer)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- `createdById` (UUID, Foreign Key)
- `assignedToId` (UUID, Foreign Key)

### Files Table
- `id` (UUID, Primary Key)
- `filename` (String)
- `originalName` (String)
- `path` (String)
- `size` (Integer)
- `mimeType` (String)
- `createdAt` (DateTime)
- `todoId` (UUID, Foreign Key)

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:seed      # Seed database with sample data
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🚀 Deployment

### Backend Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Build the application: `npm run build`
4. Start the server: `npm start`

### Frontend Deployment
1. Configure API URL in environment variables
2. Build the application: `npm run build`
3. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [Express.js](https://expressjs.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database ORM by [Prisma](https://prisma.io/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)


### Database Schema Updates
Added new Settings table:
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key)
- `theme` (String)
- `emailNotifications` (Boolean)
- `pushNotifications` (Boolean)
- `todoReminders` (Boolean)
- `weeklyDigest` (Boolean)
- `profileVisibility` (String)
- `showEmailAddress` (Boolean)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Verify database credentials

2. **Port Already in Use**
   - Change PORT in backend .env file
   - Update NEXT_PUBLIC_API_URL in frontend .env.local

3. **File Upload Issues**
   - Check MAX_FILE_SIZE in backend .env
   - Ensure uploads directory has write permissions

4. **Authentication Issues**
   - Verify JWT_SECRET is set in backend .env
   - Clear browser localStorage and cookies
   - Check token expiration settings

## 📊 ER Diagram

Here’s the Entity Relationship Diagram for the Todo Management System:

![ER Diagram](https://github.com/shruzzzzz-30/todo-management-system/blob/main/docs/ERD.png?raw=true)

## 📊 System architecture 

Here’s the System Architecture for the Todo Management System:

![System Architecture](docs/System_architecture.png)
