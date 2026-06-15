# l_path

# LibertyPath Ltd. - Participation & Rewards Platform

A secure, scalable, regulator-aware digital participation & rewards platform built for Liberia.

## Tech Stack

### Backend
- Node.js + Express.js
- PostgreSQL (primary database)
- SQLite (local/dev logging)
- Sequelize ORM
- JWT Authentication
- bcrypt password hashing

### Frontend
- React.js (functional components + hooks)
- JavaScript (ES6+)
- Tailwind CSS
- React Router
- Axios
- Recharts

## Project Structure

```
liberty_path/
├── backend/          # Node.js Express backend
├── frontend/         # React.js frontend
└── README.md
```

## Getting Started

### Quick Start (5 minutes)

See `QUICKSTART.md` for a fast setup guide, or follow the detailed instructions below.

### Backend Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create and configure `.env`:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Create PostgreSQL database:
```bash
createdb libertypath
```

4. Run migrations:
```bash
npm run migrate
```

5. Seed initial data (roles and admin user):
```bash
npm run seed
```

6. Start development server:
```bash
npm run dev
```

The backend will run at `http://localhost:5000`
- API Documentation: `http://localhost:5000/api-docs`
- Default Admin: `admin@libertypath.com` / `admin123`

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create `.env` file:
```bash
echo "REACT_APP_API_URL=http://localhost:5000/api/v1" > .env
```

3. Start development server:
```bash
npm start
```

The frontend will run at `http://localhost:3000`

📖 **For detailed setup instructions, see `SETUP.md`**

## Important Legal Disclaimers

⚠️ **This platform is NOT an investment platform**
- Participation is not an investment
- Rewards are not guaranteed
- All rewards are activity-based and time-bound
- Rewards are capped and subject to terms

## Documentation

- **QUICKSTART.md** - 5-minute quick start guide
- **SETUP.md** - Detailed setup instructions with troubleshooting
- **DEPLOYMENT.md** - Production deployment guide
- **PROJECT_STATUS.md** - Complete feature status and project overview

## Quick Commands

### Backend
```bash
cd backend
npm install              # Install dependencies
npm run migrate          # Run database migrations
npm run seed             # Seed initial data
npm run dev              # Start development server
```

### Frontend
```bash
cd frontend
npm install              # Install dependencies
npm start                # Start development server
npm run build            # Build for production
```

### Docker
```bash
docker-compose up -d     # Start all services
docker-compose exec backend npm run migrate  # Run migrations
docker-compose exec backend npm run seed     # Seed data
```

## Default Admin Credentials

After running seeders:
- **Email**: `admin@libertypath.com`
- **Password**: `admin123`

⚠️ **Change these immediately in production!**

## API Documentation

When the backend is running, access API documentation at:
- **Swagger UI**: http://localhost:5000/api-docs

## Project Status

✅ **PRODUCTION READY** - All features implemented and tested

See `PROJECT_STATUS.md` for complete feature list and status.

## License

Proprietary - LibertyPath Ltd.

