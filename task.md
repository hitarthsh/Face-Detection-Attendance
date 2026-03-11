# Face Detection Attendance System

## Backend (Node.js + Express + MongoDB)
- [x] Project scaffold & package.json
- [x] Config: db.js, env.js
- [x] Middlewares: auth, error, upload
- [x] Utils: faceMatcher.js, logger.js
- [x] Module: auth (routes, controller, service, schema)
- [x] Module: admin (routes, controller, service)
- [x] Module: employees (routes, controller, service, schema)
- [x] Module: attendance (routes, controller, service, schema)
- [x] Module: face (routes, controller, service, schema)
- [x] Module: health (routes, service, schema)
- [x] Core: router.js, app.js
- [x] server.js entry point
- [x] .env.example

## Mobile App (React Native 0.74.5 + TypeScript)
- [x] package.json & tsconfig
- [x] Navigation: AppNavigator.tsx
- [x] Services: api.ts, auth.service.ts, attendance.service.ts
- [x] Hooks: useCamera.ts
- [x] Utils: faceUtils.ts
- [x] Components: FaceBox.tsx, EmployeeCard.tsx
- [x] Screens: Login, Dashboard, EmployeeList, AddEmployee, FaceRegister, AttendanceCamera, AttendanceHistory

## Bug Fixes
- [x] `frontend/package.json` — renamed `name` from `FaceAttendanceMobile` to `face-attendance-mobile` (npm naming rules require lowercase)

## Documentation
- [x] README.md with installation guide
- [x] Environment configuration guide
- [x] Deployment guide
- [x] Walkthrough artifact
