# LibertyPath - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Setup Database

```bash
# Create PostgreSQL database
createdb libertypath

# Or using psql:
psql -U postgres -c "CREATE DATABASE libertypath;"
```

### 3. Configure Environment

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
```

**Frontend (.env):**
```bash
cd frontend
echo "REACT_APP_API_URL=http://localhost:5000/api/v1" > .env
```

### 4. Run Database Migrations

```bash
cd backend
npm run migrate
```

### 5. Seed Initial Data

```bash
cd backend
npm run seed
```

This creates:
- Roles (user, admin, super_admin)
- Super admin user: `admin@libertypath.com` / `admin123`

### 6. Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
Frontend runs on: http://localhost:3000

### 7. Access the Platform

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:5000/api-docs
- **Admin Login**: 
  - Email: `admin@libertypath.com`
  - Password: `admin123`

## ✅ Verify Installation

1. Open http://localhost:3000
2. Register a new user
3. Login as admin to access admin panel
4. Check API docs at http://localhost:5000/api-docs

## 📋 Common Commands

### Backend
- `npm run dev` - Start development server
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed initial data
- `npm start` - Start production server

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production

## 🐛 Troubleshooting

**Database connection error:**
- Ensure PostgreSQL is running
- Check `.env` credentials
- Verify database exists: `psql -l | grep libertypath`

**Port already in use:**
- Backend: Change `PORT` in `.env`
- Frontend: React auto-finds next port (3001, 3002, etc.)

**Migration errors:**
- Drop and recreate database: `dropdb libertypath && createdb libertypath`
- Re-run migrations: `npm run migrate`

## 📚 Next Steps

- Review `SETUP.md` for detailed setup instructions
- Check `README.md` for architecture overview
- Customize settings in admin panel
- Create packages and tasks via admin dashboard

## 🔒 Security Reminders

⚠️ **Before Production:**
- Change all default passwords and secrets
- Update JWT secrets in `.env`
- Use strong database passwords
- Enable SSL for database connections
- Review and test all security settings

