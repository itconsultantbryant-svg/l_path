# 🔐 LibertyPath Admin Credentials

## ✅ System Status: OPERATIONAL

Both servers are running and the database is fully configured with SQLite.

---

## 👤 Admin Login Details

### Super Admin Account

**Email:** `admin@libertypath.com`  
**Password:** `Admin@LibertyPath1215`

**Role:** `super_admin`  
**KYC Status:** `approved`  
**Account Status:** `Active`

---

## 🌐 Access URLs

### Frontend
- **URL:** http://localhost:3000
- **Status:** ✅ Running

### Backend API
- **URL:** http://localhost:5000
- **Health Check:** http://localhost:5000/health
- **Status:** ✅ Running

### API Documentation
- **Swagger UI:** http://localhost:5000/api-docs
- **Status:** ✅ Available

---

## 🧪 Test Admin Login

You can test the admin login using curl:

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@libertypath.com","password":"admin123"}'
```

Or use the frontend:
1. Navigate to http://localhost:3000
2. Click "Login"
3. Enter:
   - Email: `admin@libertypath.com`
   - Password: `admin123`
4. Click "Sign in"

---

## 📊 Admin Capabilities

As a **super_admin**, you have access to:

- ✅ User Management (view, suspend, activate, KYC approval)
- ✅ Financial Management (approve deposits, approve/reject withdrawals)
- ✅ Package Management (create, edit, disable packages)
- ✅ Task Management (create, edit, disable daily tasks)
- ✅ Referral Management (configure referral rates and caps)
- ✅ Chat Moderation (delete messages, broadcast announcements)
- ✅ System Settings (update platform configuration)
- ✅ View Audit Logs and Admin Actions
- ✅ Dashboard with platform statistics

---

## 🔒 Security Reminder

⚠️ **IMPORTANT:** These are default development credentials. 

**Before deploying to production:**
1. Change the admin password immediately
2. Update JWT secrets in `.env`
3. Use strong, unique passwords
4. Enable two-factor authentication (if implemented)
5. Review and restrict admin access as needed

---

## 📝 Database Information

- **Database Type:** SQLite
- **Database File:** `backend/database.sqlite`
- **Tables Created:** 16 tables
- **Roles Seeded:** user, admin, super_admin
- **System Settings:** 10 default settings configured

---

## ✅ Verification

To verify everything is working:

1. **Backend Health:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Admin Login:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@libertypath.com","password":"admin123"}'
   ```

3. **Frontend:**
   - Open http://localhost:3000 in your browser
   - You should see the LibertyPath homepage

---

## 🎉 Everything is Ready!

The platform is fully operational. You can now:
- Login as admin
- Access the admin dashboard
- Manage users, packages, tasks, and finances
- Test all features

**Happy managing!** 🚀

