# Frontend Setup & Installation Guide

## 📋 Prerequisites

Before starting, make sure you have:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional but recommended)
- **Backend running** on port 8082

**Verify installation:**
```bash
node --version
npm --version
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Navigate to Frontend Folder
```bash
cd "d:\2ND Year\Sem-2\FSAD\studentworkspace\frontend"
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all packages from `package.json`:
- React 18.2.0
- React Router v6
- Axios
- React Scripts

### Step 3: Start Development Server
```bash
npm start
```

**What happens:**
- ✅ Browser opens automatically at `http://localhost:3000`
- ✅ Hot reload enabled (changes auto-refresh)
- ✅ Backend connected to `http://localhost:8082`

---

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html              ← Main HTML file
│
├── src/
│   ├── components/             ← Reusable React components
│   │   └── PrivateRoute.jsx    ← Protected route wrapper
│   │
│   ├── pages/                  ← Full page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── Dashboard.jsx
│   │
│   ├── context/                ← React Context (State)
│   │   └── AuthContext.jsx     ← Authentication state
│   │
│   ├── services/               ← API calls
│   │   └── authService.js      ← All API endpoints
│   │
│   ├── styles/                 ← CSS files
│   │   ├── index.css           ← Global styles
│   │   ├── auth.css            ← Auth page styles
│   │   └── dashboard.css       ← Dashboard styles
│   │
│   ├── utils/                  ← Helper functions
│   │   ├── constants.js        ← API URLs & errors
│   │   ├── validation.js       ← Form validation
│   │   └── helpers.js          ← Utility functions
│   │
│   ├── App.jsx                 ← Main App component
│   └── index.jsx               ← React entry point
│
├── .env                        ← Environment variables (DEV)
├── .env.example                ← Template (in git)
├── .gitignore                  ← Git ignore rules
└── package.json                ← Dependencies
```

---

## ⚙️ Configuration

### Environment Variables (.env)

Located: `frontend/.env`

**Local Development:**
```
REACT_APP_API_BASE_URL=http://localhost:8082
REACT_APP_API_TIMEOUT=30000
```

**Production (Vercel):**
```
REACT_APP_API_BASE_URL=https://studentworkspace-api.onrender.com
REACT_APP_API_TIMEOUT=30000
```

⚠️ **Important:** 
- Never commit `.env` file (it's in .gitignore)
- Always use `REACT_APP_` prefix for variables
- Restart dev server after changing .env

---

## 🔌 Backend Connection

### Ensure Backend is Running

```bash
# In backend folder
cd "d:\2ND Year\Sem-2\FSAD\studentworkspace"
.\mvnw.cmd spring-boot:run
```

**Backend should show:**
```
Tomcat initialized with port: 8082
```

### Test Connection

Open browser console (F12) and test:
```javascript
fetch('http://localhost:8082/api/projects/all')
  .then(r => r.json())
  .then(d => console.log(d))
```

Should return `[]` (empty array) or data.

---

## 🧪 Testing the Frontend

### 1. Register New User
- Go to `http://localhost:3000/register`
- Fill form with:
  - First Name: John
  - Last Name: Doe
  - Email: john@example.com
  - Password: Pass@123 (min 6 chars)
- Click "Register"
- Should redirect to Dashboard

### 2. Login
- Go to `http://localhost:3000/login`
- Use registered email & password
- Should redirect to Dashboard

### 3. Dashboard
- Should see "Welcome, John!" message
- Should see 4 quick action cards
- Navigate to Projects/Tasks/Notes/Files (pages in development)

### 4. Test Local Storage
- Open DevTools (F12) → Application → Local Storage
- Should see `token` and `user` keys stored

---

## 🛠️ Common Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests (if any)
npm test

# Install new package
npm install package-name

# Update dependencies
npm update

# Check installed versions
npm list
```

---

## 🐛 Troubleshooting

### Problem: "Port 3000 already in use"
```bash
# Windows - Find process on port 3000
netstat -ano | findstr "3000"

# Kill process
taskkill /PID <PID_NUMBER> /F

# Or use different port
set PORT=3001 && npm start
```

### Problem: "Backend not responding"
- ✅ Check backend running on port 8082
- ✅ Check .env has correct API_BASE_URL
- ✅ Check CORS enabled in backend
- ✅ Restart both frontend & backend

### Problem: "Module not found"
```bash
# Clear node_modules and reinstall
rmdir /s /q node_modules
npm install
npm start
```

### Problem: "Cannot find token in localStorage"
- Frontend can't persist login state
- Check localStorage enabled in browser settings
- Try clearing localStorage: DevTools → Application → Storage → Clear

### Problem: Build size too large
```bash
npm run build
# Check size in build/ folder
```

---

## 📦 Build for Production

```bash
# Create optimized build
npm run build

# Output in build/ folder
# Ready to deploy
```

**What build includes:**
- ✅ Minified code
- ✅ Code splitting
- ✅ Asset optimization
- ✅ Production-ready files

---

## 🚢 Deployment Options

### Option 1: Vercel (Recommended for Frontend)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Option 2: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=build
```

### Option 3: AWS S3 + CloudFront
```bash
npm run build
# Upload build/ folder to S3
# Use CloudFront for CDN
```

### Option 4: Traditional Server
```bash
npm run build
# Upload build/ folder to server
# Configure web server (nginx, Apache)
# Point to index.html for SPA routing
```

---

## 📖 Learning Resources

### React Basics
- [React Official Docs](https://react.dev/)
- [React Router Guide](https://reactrouter.com/)
- [Axios Documentation](https://axios-http.com/)

### State Management
- [React Context Documentation](https://react.dev/reference/react/useContext)
- [Hooks Guide](https://react.dev/reference/react)

### CSS & Styling
- [MDN CSS Guide](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)

---

## 🎯 Next Steps

1. **Register & Login**
   - Test user registration
   - Test login functionality

2. **Create Projects Page**
   - Use projectService.js
   - Display list of projects
   - Add create, edit, delete

3. **Create Tasks Page**
   - Similar to Projects
   - Show tasks per project

4. **Create Notes Page**
   - Add CRUD operations
   - Display with timestamps

5. **Create Files Page**
   - File upload form
   - Display uploaded files

---

## 📝 Notes

- Frontend runs on port **3000** (do not change)
- Backend runs on port **8082**
- CORS configured to allow both
- JWT tokens stored in localStorage
- All API calls through `src/services/authService.js`

---

## ❓ Questions?

Refer to:
- [FRONTEND_SETUP_GUIDE.md](../FRONTEND_SETUP_GUIDE.md) - Best practices & common issues
- [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) - Backend API reference
- Backend logs for errors

---

**Happy Coding! 🚀**
