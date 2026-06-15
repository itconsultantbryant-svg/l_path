# 🔐 LibertyPath Admin Login Details

## Super Admin Account

### Login Credentials

**Email:** `admin@libertypath.com`  
**Password:** `admin123`  
**Role:** `super_admin`  
**Account Status:** ✅ Active & Approved  
**KYC Status:** ✅ Approved

---

## 🌐 Access Points

### Frontend Application
- **URL:** http://localhost:3000
- **Login Page:** http://localhost:3000/login
- **Admin Dashboard:** http://localhost:3000/admin/dashboard

### Backend API
- **Base URL:** http://localhost:5000
- **API Version:** v1
- **API Documentation:** http://localhost:5000/api-docs
- **Health Check:** http://localhost:5000/health

---

## 📋 Quick Login Guide

### Via Browser (Recommended)

1. **Open Browser:**
   - Navigate to: http://localhost:3000

2. **Click Login:**
   - Click the "Login" button or link
   - Or go directly to: http://localhost:3000/login

3. **Enter Credentials:**
   - **Email:** `admin@libertypath.com`
   - **Password:** `admin123`

4. **Select Login Method:**
   - Choose "Email" option (radio button)
   - Enter the email address

5. **Sign In:**
   - Click "Sign in" button
   - You'll be automatically redirected to the admin dashboard

6. **Access Admin Panel:**
   - Once logged in, click "Admin" in the navigation
   - Or go directly to: http://localhost:3000/admin/dashboard

### Via API (For Testing)

```bash
# Login and get token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@libertypath.com",
    "password": "admin123"
  }'

# Save token and use for authenticated requests
TOKEN="YOUR_TOKEN_HERE"
curl http://localhost:5000/api/v1/admin/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

## 👥 Available Roles

The system has the following roles configured:

1. **user** - Regular user role
   - Can complete tasks
   - Can make deposits
   - Can request withdrawals
   - Can purchase packages
   - Can view referrals
   - Can chat

2. **admin** - Administrator role
   - All user permissions +
   - Can manage users
   - Can approve deposits
   - Can approve withdrawals
   - Can manage packages
   - Can manage tasks
   - Can moderate chat
   - Can view reports

3. **super_admin** - Super administrator role
   - All admin permissions +
   - Can manage admins
   - Can manage system settings
   - Can emergency stop system

**Current Account:** Only `super_admin` account exists by default.

---

## 🔑 Admin Features Access

Once logged in as super admin, you have access to:

### Main Section
- ✅ **Dashboard** - Real-time financial overview with P&L tracking
- ✅ **Users** - Comprehensive user management with detailed profiles

### Financial Section
- ✅ **Deposits** - Review and approve deposit requests (updates revenue)
- ✅ **Withdrawals** - Review and approve withdrawal requests (updates expenditure)

### Products Section
- ✅ **Packages** - Create and manage participation packages
- ✅ **Tasks** - Create and manage daily tasks
- ✅ **Referrals** - Manage referral system settings

### Support Section
- ✅ **Chat** - Moderate chatroom and send broadcasts

### System Section
- ✅ **Settings** - Configure system settings and parameters

---

## ⚠️ Important Notes

### Security Reminders

1. **Change Password:**
   - This is a default development password
   - **MUST** be changed before production deployment

2. **Account Security:**
   - Keep credentials secure
   - Don't share admin credentials
   - Use strong passwords in production

3. **Production Deployment:**
   - Change default password
   - Enable 2FA if available
   - Review all permissions
   - Audit admin access regularly

---

## 🆘 Troubleshooting

### Cannot Login

1. **Check Backend:**
   ```bash
   curl http://localhost:5000/health
   ```
   Should return: `{"success":true,...}`

2. **Check Credentials:**
   - Email: `admin@libertypath.com`
   - Password: `admin123`
   - Make sure no extra spaces

3. **Clear Browser Cache:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or clear browser cache completely

4. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

### Account Not Found

If you get "User not found" error:

1. **Check Database:**
   ```bash
   cd backend
   sqlite3 database.sqlite "SELECT email FROM users WHERE email = 'admin@libertypath.com';"
   ```

2. **Re-run Seeders:**
   ```bash
   cd backend
   npm run seed
   ```

---

## 📞 Support

If you encounter any issues:

1. Check backend logs: `backend/logs/combined.log`
2. Check browser console for errors
3. Verify backend is running: `curl http://localhost:5000/health`
4. Verify frontend is running: `curl http://localhost:3000`

---

**Last Updated:** 2026-01-20  
**Environment:** Development  
**Status:** ✅ Operational

