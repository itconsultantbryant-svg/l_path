# LibertyPath Ltd. - Setup Guide

This guide will help you set up and run the LibertyPath participation & rewards platform.

## Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

## Step 1: Database Setup

1. Create a PostgreSQL database:
```bash
createdb libertypath
# Or using psql:
psql -U postgres
CREATE DATABASE libertypath;
```

2. Update database credentials in `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=libertypath
DB_USER=postgres
DB_PASSWORD=your_password
```

## Step 2: Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database Configuration
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=libertypath
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRE=30d

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Service Fee Configuration
SERVICE_FEE_PERCENTAGE=13
MIN_WITHDRAWAL_AMOUNT=500
MAX_WITHDRAWAL_PER_WEEK=15000

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

5. Run database migrations:
```bash
npm run migrate
```

6. Seed initial data (roles and super admin):
```bash
npm run seed
```

7. Start the backend server:
```bash
npm run dev
```

The backend will be running at `http://localhost:5000`

**Default Admin Credentials:**
- Email: `admin@libertypath.com`
- Password: `admin123`

**API Documentation:** Available at `http://localhost:5000/api-docs`

## Step 3: Frontend Setup

1. Navigate to frontend directory (in a new terminal):
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
echo "REACT_APP_API_URL=http://localhost:5000/api/v1" > .env
```

4. Start the frontend development server:
```bash
npm start
```

The frontend will be running at `http://localhost:3000`

## Step 4: Verify Installation

1. Open your browser and navigate to `http://localhost:3000`
2. You should see the LibertyPath home page
3. Try registering a new user or logging in with the admin credentials

## Development Workflow

### Backend
- **Run migrations**: `npm run migrate`
- **Rollback migrations**: `npm run migrate:undo`
- **Run seeders**: `npm run seed`
- **Start dev server**: `npm run dev`
- **Start production server**: `npm start`

### Frontend
- **Start dev server**: `npm start`
- **Build for production**: `npm run build`

## Database Management

### Create a new migration:
```bash
npx sequelize-cli migration:generate --name migration-name
```

### Create a new seeder:
```bash
npx sequelize-cli seed:generate --name seeder-name
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify database credentials in `.env`
- Check if the database exists: `psql -l | grep libertypath`

### Port Already in Use
- Backend: Change `PORT` in `backend/.env`
- Frontend: React will automatically use the next available port (3001, 3002, etc.)

### Migration Errors
- If migrations fail, you may need to manually drop and recreate the database
- Always backup your database before running migrations in production

### Seed Errors
- Ensure migrations have run successfully before seeding
- Check that roles exist before creating the super admin user

## Production Deployment

1. **Environment Variables**: Update all `.env` files with production values
2. **Database**: Use a managed PostgreSQL service (AWS RDS, Heroku Postgres, etc.)
3. **Security**: 
   - Change all default secrets and passwords
   - Use strong JWT secrets
   - Enable SSL for database connections
4. **Build Frontend**: Run `npm run build` in the frontend directory
5. **Server**: Use a process manager like PM2 for Node.js applications

## Important Notes

⚠️ **Legal Compliance:**
- The platform is designed to avoid classification as an investment scheme
- All rewards are activity-based, time-bound, and capped
- Never use terms like "investment", "ROI", or "guaranteed income"
- Ensure all disclaimers are visible to users

🔒 **Security:**
- Never commit `.env` files to version control
- Use strong passwords and secrets in production
- Regularly update dependencies for security patches
- Enable rate limiting and input validation

## Support

For issues or questions, please refer to the main README.md or contact the development team.

