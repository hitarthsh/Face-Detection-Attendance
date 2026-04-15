# 🎯 Face Detection Attendance System

A **production-ready**, full-stack Attendance System using **face recognition** with React Native + Node.js + MongoDB.

---

## 📋 Table of Contents
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [API Reference](#api-reference)
- [Face Recognition Flow](#face-recognition-flow)
- [Deployment](#deployment)

---

## 🏗 Architecture

```
faceapp/
├── backend/                   # Node.js Backend
│   ├── config/                # DB & env config
│   ├── middlewares/           # Auth, error, upload, validate middlewares
│   ├── utils/                 # faceMatcher.js, logger.js
│   ├── modules/
│   │   ├── auth/              # JWT auth
│   │   ├── employees/         # Employee CRUD
│   │   ├── face/              # Face register & verify
│   │   ├── attendance/        # Check-in / Check-out
│   │   ├── admin/             # Dashboard & user mgmt
│   │   ├── health/            # Health check
│   │   └── core/              # app.js, router.js
│   └── server.js
└── frontend/                  # React Native App
    └── src/
        ├── screens/           # 7 screens
        ├── components/        # FaceBox, EmployeeCard
        ├── services/          # api.ts, auth, attendance
        ├── hooks/             # useCamera.ts
        ├── utils/             # faceUtils.ts
        └── navigation/        # AppNavigator.tsx
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.74.5 + TypeScript |
| Camera | react-native-vision-camera v4 |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) |
| Face AI | TensorFlow.js + MediaPipe FaceMesh |
| Security | Helmet, bcrypt, rate limiting |
| Logging | Winston |

---

## ⚙️ Installation

### Prerequisites
- Node.js >= 18.0.0
- MongoDB >= 6.0
- React Native development environment
- Android Studio / Xcode

### 1. Clone & Setup

```bash
git clone <your-repo>
cd faceapp
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values (see Environment Configuration)

# Start development server
npm run dev
```

### 3. Mobile App Setup

```bash
cd frontend

# Install dependencies
npm install

# iOS (Mac only)
cd ios && pod install && cd ..

# Android - add to android/app/src/main/AndroidManifest.xml:
# <uses-permission android:name="android.permission.CAMERA" />

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### 4. Create First Admin User

```bash
# After server starts, POST to:
# http://localhost:5000/api/auth/register

curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@company.com","password":"hitarth@11","role":"admin"}'
```

Default login (if you run `npm run backend:admin`):

- ID/Email: `admin@company.com`
- Password: `hitarth@11`

---

## 🔧 Environment Configuration

Edit `backend/.env`:

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/face_attendance
# For production MongoDB Atlas:
MONGODB_URI_PROD=mongodb+srv://user:pass@cluster.mongodb.net/face_attendance

# JWT (generate secure random strings)
JWT_SECRET=your_minimum_32_character_secret_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_REFRESH_EXPIRES_IN=30d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX=100             # requests per window

# Face Recognition
FACE_MATCH_THRESHOLD=0.6       # 0.0 to 1.0 (lower = stricter)
FACE_CONFIDENCE_MIN=0.9

# CORS (comma-separated for multiple origins)
CLIENT_URL=http://localhost:3000,*
```

> **Frontend API URL**: In `frontend/src/services/api.ts`, update `BASE_URL` for production.

---

## 📡 API Reference

### Authentication
```
POST   /api/auth/login          Login → returns JWT tokens
POST   /api/auth/register       Register admin user
POST   /api/auth/refresh        Refresh access token
POST   /api/auth/logout         Logout (requires auth)
GET    /api/auth/profile        Get current user
```

### Employees *(requires auth)*
```
POST   /api/employees           Create employee (admin/manager)
GET    /api/employees           List with pagination & search
GET    /api/employees/:id       Get by ID or employeeId
PUT    /api/employees/:id       Update (admin/manager)
DELETE /api/employees/:id       Delete (admin only)
```

### Face Recognition *(requires auth)*
```
POST   /api/face/register       Register face → multipart/form-data (image + employeeId)
POST   /api/face/verify         Verify face → multipart/form-data (image)
```

### Attendance *(requires auth)*
```
POST   /api/attendance/checkin  Check in via face → multipart/form-data (image)
POST   /api/attendance/checkout Check out via face → multipart/form-data (image)
GET    /api/attendance/today    Today's records (paginated)
GET    /api/attendance/report   Historical report with filters
```

### Admin *(requires admin role)*
```
GET    /api/admin/dashboard     Stats (today, weekly, departments)
GET    /api/admin/users         All system users
PUT    /api/admin/users/:id/role     Change user role
PATCH  /api/admin/users/:id/toggle  Activate/deactivate user
```

### Health
```
GET    /api/health              Server health, DB status, memory
```

---

## 👁 Face Recognition Flow

```
1. REGISTER (one-time per employee, 3 captures)
   Employee photo → TensorFlow MediaPipe FaceMesh
   → 478 landmark keypoints → normalized embedding vector
   → Stored in MongoDB (Employee.faceEmbedding + FaceData.embeddings)

2. VERIFY (each check-in/out)
   Live photo → Generate embedding
   → Cosine similarity vs all registered embeddings
   → If similarity >= threshold → Match found
   → Mark attendance with confidence score

3. MATCH THRESHOLD
   Default: 0.6 cosine similarity
   Confidence 90%+ = green
   Confidence 75-90% = yellow
   Below 75% = red / rejected
```

---

## 🚀 Deployment

### Backend — Render (recommended)

This repo includes [`render.yaml`](render.yaml) at the root: connect the repository in [Render](https://render.com/), choose **Blueprint**, and set the prompted secrets **`MONGODB_URI_PROD`** (MongoDB Atlas URI), or adjust env vars after create. The Web Service uses **`rootDir: backend`**, **`npm start`**, and health check **`/api/health`**. Default hostname matches `PRODUCTION_API_BASE_URL` in [`frontend/src/config/apiBaseUrl.ts`](frontend/src/config/apiBaseUrl.ts) (`face-attendance-api.onrender.com`); rename the service in Render and update that constant if needed.

After the service is live:

```bash
npm run check:render-health
# Or override: set RENDER_HEALTH_URL and run the same script (see scripts/check-render-health.mjs).
```

### Backend — Railway / Render (manual) / VPS

```bash
# 1. Set environment variables on your platform
# 2. Build start command: node server.js
# 3. Port: 5000 (or set PORT env var)

# Environment variables required:
NODE_ENV=production
MONGODB_URI_PROD=mongodb+srv://...
JWT_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-secret>
CLIENT_URL=https://your-frontend.com
```

### MongoDB — MongoDB Atlas

```
1. Create free cluster at cloud.mongodb.com
2. Create database user with read/write access
3. Whitelist IPs (0.0.0.0/0 for development)
4. Copy connection string to MONGODB_URI_PROD
```

### Mobile — Android APK

```bash
cd frontend/android

# Generate keystore
keytool -genkeypair -v -storetype PKCS12 \
  -keystore face-attendance.keystore \
  -alias face-attendance \
  -keyalg RSA -keysize 2048 \
  -validity 10000

# Build release APK
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

### Frontend — iOS App Store

```bash
# Open Xcode
open ios/face-attendance-mobile.xcworkspace

# Set team signing and bundle ID
# Product → Archive → Distribute App
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcrypt (12 rounds) |
| Authentication | JWT access + refresh tokens |
| Authorization | Role-based (admin/manager/viewer) |
| Rate limiting | 100 req/15min, 10 auth req/15min |
| Headers | Helmet.js security headers |
| Input sanitization | express-mongo-sanitize |
| File validation | Mimetype + size limits |

---

## 🎁 Bonus Features Included

- ✅ GPS location captured with attendance
- ✅ Late detection (after 9:30 AM = late status)
- ✅ Work duration tracking
- ✅ Weekly trend charts data
- ✅ Department-wise analytics
- ✅ Token auto-refresh (transparent to user)
- ✅ Multi-capture face registration (3 angles)
- ✅ Server health monitoring with history

---

## 🐛 Bug Fixes

| File | Issue | Fix |
|------|-------|-----|
| `frontend/package.json` | `name` was `FaceAttendanceMobile` (invalid uppercase) | Renamed to `face-attendance-mobile` |

---

*Built with ❤️ — Face Detection Attendance System v1.0*
