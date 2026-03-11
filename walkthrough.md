# Face Detection Attendance System — Walkthrough

## What Was Built

A **production-ready**, full-stack Face Recognition Attendance System with a React Native mobile app (`frontend/`) and a Node.js backend (`backend/`).

---

## Backend (`backend/`)

**Modular architecture** — every feature is its own self-contained module:

| File | Purpose |
|------|---------|
| [config/env.js](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/backend/config/env.js) | Centralized env config with defaults |
| [config/db.js](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/backend/config/db.js) | MongoDB connection with auto-reconnect |
| [utils/logger.js](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/backend/utils/logger.js) | Winston logger (console + rotating files) |
| [utils/faceMatcher.js](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/backend/utils/faceMatcher.js) | TensorFlow.js face embedding generation & cosine similarity matching |
| [middlewares/auth.middleware.js](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/backend/middlewares/auth.middleware.js) | JWT verify + RBAC authorize factory |
| [middlewares/error.middleware.js](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/backend/middlewares/error.middleware.js) | Global error handler (Mongoose, JWT, generic) |
| [middlewares/upload.middleware.js](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/backend/middlewares/upload.middleware.js) | Multer disk + memory storage |
| `modules/auth/*` | Register, login, refresh token rotation, logout |
| `modules/employees/*` | Full CRUD with pagination, text search |
| `modules/face/*` | Multi-capture registration + cosine-similarity verification |
| `modules/attendance/*` | Face-verified check-in/out, late detection, work duration |
| `modules/admin/*` | Dashboard stats, weekly trends, user management |
| `modules/health/*` | Server health endpoint with DB ping |
| [modules/core/app.js](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/backend/modules/core/app.js) | Express factory — Helmet, CORS, rate limiting, compression |
| [modules/core/router.js](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/backend/modules/core/router.js) | Central route aggregator |
| [server.js](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/backend/server.js) | Entry point with graceful shutdown + model prewarming |

---

## Mobile App (`frontend/`)

| File | Purpose |
|------|---------|
| [services/api.ts](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/frontend/src/services/api.ts) | Axios + auto JWT refresh + retry |
| [services/auth.service.ts](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/frontend/src/services/auth.service.ts) | Login/logout with AsyncStorage |
| [services/attendance.service.ts](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/frontend/src/services/attendance.service.ts) | Check-in/out API calls |
| [hooks/useCamera.ts](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/frontend/src/hooks/useCamera.ts) | Vision Camera setup, permissions, capture |
| [utils/faceUtils.ts](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/frontend/src/utils/faceUtils.ts) | Face API calls, confidence formatting |
| [navigation/AppNavigator.tsx](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/frontend/src/navigation/AppNavigator.tsx) | Stack + Bottom Tab navigator |
| [components/FaceBox.tsx](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/frontend/src/components/FaceBox.tsx) | Face bounding box with confidence color |
| [components/EmployeeCard.tsx](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/frontend/src/components/EmployeeCard.tsx) | Employee card with face status badge |
| [screens/LoginScreen.tsx](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/frontend/src/screens/LoginScreen.tsx) | JWT login with dark premium UI |
| [screens/DashboardScreen.tsx](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/frontend/src/screens/DashboardScreen.tsx) | Stats card grid + quick action buttons |
| [screens/EmployeeListScreen.tsx](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/frontend/src/screens/EmployeeListScreen.tsx) | Infinite scroll + search |
| [screens/AddEmployeeScreen.tsx](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/frontend/src/screens/AddEmployeeScreen.tsx) | New employee form with face redirect |
| [screens/FaceRegisterScreen.tsx](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/frontend/src/screens/FaceRegisterScreen.tsx) | Multi-capture face registration (3 angles) |
| [screens/AttendanceCameraScreen.tsx](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/frontend/src/screens/AttendanceCameraScreen.tsx) | Live face check-in/out with confidence overlay |
| [screens/AttendanceHistoryScreen.tsx](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/frontend/src/screens/AttendanceHistoryScreen.tsx) | Today/history toggle with status badges |

---

## Face Recognition Algorithm

```
1. MediaPipe FaceMesh → 478 landmark keypoints
2. Normalize keypoints to bounding box (0.0–1.0 range)
3. Flatten into 956-dimensional embedding vector
4. Store in MongoDB (Employee + FaceData collections)
5. On verify: cosine similarity against all registered embeddings
6. Match threshold: configurable (default 0.6 = 60% similarity)
7. Best match wins → mark attendance
```

---

## Security

- bcrypt (12 rounds) password hashing
- Access token (7d) + Refresh token (30d) with rotation
- Role-based access (admin / manager / viewer)
- 10 auth requests / 15min rate limit
- Helmet security headers
- MongoDB sanitization

---

## Bug Fixes Applied

| Issue | Fix |
|-------|-----|
| `frontend/package.json` `name` field used `FaceAttendanceMobile` (uppercase) | Renamed to `face-attendance-mobile` to comply with npm naming rules |

---

## Key Files to Start With

1. [backend/.env.example](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/backend/.env.example) → copy to `.env` and fill in values
2. [backend/package.json](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/backend/package.json) → `npm install && npm run dev`
3. [frontend/package.json](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/frontend/package.json) → `npm install && npm start`
4. [README.md](file:///C:/Users/shahh/OneDrive/Desktop/faceapp/README.md) → full installation guide
