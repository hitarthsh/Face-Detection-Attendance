# Face Detection Attendance Back-end (How It Works)

This backend is a Node.js + Express REST API that provides:
1) JWT authentication (access + refresh)
2) Employee management
3) Face registration and face verification (face recognition)
4) Attendance check-in / check-out using face verification
5) Admin dashboard/user management
6) Health monitoring

All API routes are mounted under `/api`.

---

## 1. Backend Startup Flow (`backend/server.js`)

When you start the server:

1. Connect to MongoDB
   - Calls `connectDB()` from `backend/config/db.js`
   - Uses `env.MONGODB_URI` (resolved from `MONGODB_URI`, `MONGODB_URI_PROD`, etc.)
2. Pre-warm the face detection model
   - Calls `initDetector()` from `backend/utils/faceMatcher.js`
   - Loads the bundled models from `@vladmandic/face-api`
3. Create the Express app
   - Uses `createApp()` from `backend/modules/core/app.js`
4. Start listening
   - `app.listen(env.PORT, env.HOST, ...)`
5. Graceful shutdown
   - On `SIGTERM`/`SIGINT`, closes the HTTP server and disconnects MongoDB.

---

## 2. Express App Pipeline (`backend/modules/core/app.js`)

The Express app registers middleware in this order:

1. Security headers
   - `helmet()` (including cross origin resource policy)
2. CORS
   - Reads `env.CLIENT_URL` (comma-separated)
   - Allows requests with no origin (useful for mobile apps / Postman)
3. Compression
   - `compression()`
4. Body parsing
   - `express.json({ limit: '10mb', strict: false })`
   - `express.urlencoded({ extended: true, limit: '10mb' })`
5. Mongo injection protection
   - `express-mongo-sanitize()`
6. Request logging
   - `morgan(...)`
   - Skips logging for `/api/health`
7. Rate limiting
   - `env.RATE_LIMIT_WINDOW_MS` + `env.RATE_LIMIT_MAX` for all `/api`
   - A stricter limiter for `/api/auth` (10 requests per 15 minutes)
8. Static files
   - Serves uploaded images from `/uploads` directory
9. Routing
   - `app.use('/api', mainRouter)`
10. 404 handler
   - `notFound` middleware
11. Global error handler
   - `errorMiddleware` (must be LAST)

---

## 3. Routing Structure (`backend/modules/core/router.js`)

`backend/modules/core/router.js` mounts module routers like this:

- `/api/auth` -> `modules/auth/auth.routes.js`
- `/api/employees` -> `modules/employees/employee.routes.js`
- `/api/face` -> `modules/face/face.routes.js`
- `/api/attendance` -> `modules/attendance/attendance.routes.js`
- `/api/admin` -> `modules/admin/admin.routes.js`
- `/api/health` -> `modules/health/health.routes.js`

---

## 4. Configuration (`backend/config/env.js` + `backend/.env`)

The backend uses `backend/config/env.js` which loads `.env` and normalizes values.

Important environment variables:

- `PORT`, `HOST`
- `MONGODB_URI` / `MONGODB_URI_PROD` (resolved in `resolveMongoUri()`)
- JWT:
  - `JWT_SECRET`, `JWT_EXPIRES_IN`
  - `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`
- Upload:
  - `UPLOAD_DIR`
  - `MAX_FILE_SIZE` (default 10MB)
- Rate limiting:
  - `RATE_LIMIT_WINDOW_MS`
  - `RATE_LIMIT_MAX`
- Face recognition:
  - `FACE_MATCH_THRESHOLD` (default 0.6)
  - `FACE_CONFIDENCE_MIN` (default 0.9, used in logic/thresholding)
- CORS:
  - `CLIENT_URL`

---

## 5. Authentication and Authorization (JWT)

### JWT access + refresh tokens

- `/api/auth/register`
  - Creates a user with `role` (admin/manager/viewer)
- `/api/auth/login`
  - Validates email/password
  - Returns:
    - `accessToken` (expires by `JWT_EXPIRES_IN`)
    - `refreshToken` (expires by `JWT_REFRESH_EXPIRES_IN`)
- `/api/auth/refresh`
  - Accepts `refreshToken` in JSON body and rotates tokens
- `/api/auth/logout`
  - Requires `Authorization: Bearer <token>`
  - Clears stored refresh token
- `/api/auth/profile`
  - Requires authentication

### Middleware

- `authenticate` (`backend/middlewares/auth.middleware.js`)
  - Reads `Authorization` header
  - Expects `Bearer <token>`
  - Verifies JWT and sets `req.user` to decoded payload (contains `id`, `role`)
- `authorize(...roles)`
  - Checks `req.user.role` is in allowed roles
  - Returns:
    - `401` if missing auth
    - `403` if role is insufficient

---

## 6. File Upload Handling (Multer)

Face registration and attendance check-in/out use image uploads.

Upload logic is in `backend/middlewares/upload.middleware.js`:

1. Image validation (filter)
   - Allowed MIME types:
     - `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
2. Two upload modes:
   - Disk storage (`upload`)
     - Used by `POST /api/face/register`
     - Saves to: `uploads/faces`
   - Memory storage (`uploadMemory`)
     - Used by `POST /api/face/verify` and attendance check-in/out
     - Uses `multer.memoryStorage()` and keeps image buffer in RAM
3. `handleUploadError(uploadFn)`
   - Wraps multer and returns clean JSON errors for file size/type limits

---

## 7. Face Recognition Engine (`backend/utils/faceMatcher.js`)

This module is responsible for turning images into embeddings and matching them.

### Model loading

- `initDetector()`
  - Loads face-api models from the `@vladmandic/face-api` package models folder
  - Uses wasm backend for TensorFlow:
    - `@tensorflow/tfjs-backend-wasm`
    - `tf.setBackend('wasm')`, then `tf.ready()`
  - Models loaded:
    - `faceLandmark68Net`
    - `faceRecognitionNet`
    - `ssdMobilenetv1`

### Embedding generation

- `generateEmbedding(imageSource)`
  - Loads image via `Jimp` (from a Buffer or file path)
  - Resizes large images to max width 640px for performance
  - Runs face-api detection and returns a 128-d descriptor (embedding) as an array
  - If no face is found, returns `null`

### Matching

- `compareFaces(embedding1, embedding2)`
  - Computes Euclidean distance
  - Converts distance to a 0..1 confidence value
  - Match decision uses `env.FACE_MATCH_THRESHOLD` (default 0.6)
- `findBestMatch(incomingEmbedding, storedEmbeddings)`
  - Compares the incoming embedding to all stored embeddings
  - Chooses the best (closest) match among those considered valid

---

## 8. Face Module (Register + Verify)

Routes:
- `POST /api/face/register`
- `POST /api/face/verify`

### Face registration (`face.controller` + `face.service`)

1. Request requirements
   - Auth required
   - Role must be `admin` or `manager`
   - `multipart/form-data` with:
     - `image` (file)
     - `employeeId` (string in body) OR header `x-employee-id`
2. Controller normalization
   - Converts `employeeId` to uppercase
   - Requires `req.file`
3. Service behavior
   - Checks the employee exists (`Employee.findOne({ employeeId })`)
   - Generates embedding using the uploaded image file path from multer disk storage
   - Stores/upserts face data in `FaceData`:
     - `embeddings` (array of embedding arrays for multiple captures)
     - `images` (path + capturedAt)
     - `captureCount`, `lastUpdated`
   - Also updates the `Employee` document:
     - `faceEmbedding = latest embedding`
     - `faceRegistered = true`
     - `profileImage = uploaded filename`

### Face verification

`POST /api/face/verify` uses memory upload:
1. Ensures `req.file` exists and passes `req.file.buffer` to face service
2. Service:
   - Generates an embedding from the incoming image buffer
   - Loads all employees that are `faceRegistered: true` and `isActive: true`
   - Compares the incoming embedding with every stored embedding
3. Response:
   - If matched:
     - returns `employeeId`, `employeeName`, `department`, and `confidence`
   - If not matched:
     - returns `matched: false` (and confidence 0)

---

## 9. Attendance Module (Check-in + Check-out)

Routes:
- `POST /api/attendance/checkin`
- `POST /api/attendance/checkout`
- `GET /api/attendance/today`
- `GET /api/attendance/report`

### Location support

For check-in and check-out, controller reads optional fields:
- `latitude`
- `longitude`

If `latitude` is provided, it parses it with `parseFloat` and pairs it with `longitude`.

### Check-in flow

1. Requires face image buffer (`multipart/form-data` -> `image`)
2. Service verifies face:
   - If not matched -> 401
3. Today key:
   - `today` is computed as `YYYY-MM-DD` (server local time in code)
4. Prevent double check-in:
   - If an attendance record exists for that `employeeId` and today, and it already has check-in time -> 409
5. Late detection:
   - Late if after 9:30 AM
   - Logic:
     - late if `hour > 9` OR `hour === 9 AND minutes > 30`
6. Create/update Attendance:
   - `status` = `late` or `present`
   - `checkIn.time` = now
   - `checkIn.location` = parsed location or empty object
   - `confidenceScore` = face matching confidence

### Check-out flow

1. Verifies face again using the uploaded image
2. Finds today attendance record for that employee
3. Validations:
   - If no record or missing check-in -> 404
   - If already checked out -> 409
4. Computes work duration:
   - `durationMinutes = floor((now - checkIn.time) / 60000)`
5. Stores check-out:
   - `checkOut.time` and `checkOut.location`
   - `workDuration` in minutes
6. Attendance status for short days:
   - If `durationMinutes < 240` -> `status = half_day`

### Attendance queries

- `GET /api/attendance/today`
  - Returns today records, optional `department`
  - Pagination: `page` and `limit`

- `GET /api/attendance/report`
  - Date range using `startDate` and `endDate`
  - Optional filters: `employeeId`, `department`
  - Pagination: `page` and `limit`
  - Also returns aggregated `stats` grouped by `status` with:
    - count per status
    - avg confidence per status

---

## 10. Employees Module (CRUD)

Routes:
- `POST /api/employees` (admin only)
- `GET /api/employees` (authenticated)
- `GET /api/employees/:id` (authenticated)
- `PUT /api/employees/:id` (admin only)
- `DELETE /api/employees/:id` (admin only)

Employee service supports:
- List filters:
  - `search` (Mongo text search)
  - `department`
  - `isActive` (string "true"/"false")
  - pagination `page`, `limit`
- `id` can be either Mongo `_id` or `employeeId`

---

## 11. Admin Module

Routes (all admin role only):
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `PUT /api/admin/users/:id/role`
- `PATCH /api/admin/users/:id/toggle`

Dashboard stats:
- total employees, active employees, faces registered
- today present and today late
- weekly stats (last 7 days) grouped by date/status
- department stats (today), including average confidence

---

## 12. Health Monitoring

- `GET /api/health`
  - Pings MongoDB (`mongoose.connection.db.admin().ping()`)
  - Returns:
    - `status`: healthy or degraded
    - uptime (seconds), response time (ms)
    - memory usage (rss/heap)
    - version + node version
  - Also saves a snapshot to `HealthHistory` (async, not blocking response)

---

## 13. Error Handling (`backend/middlewares/error.middleware.js`)

All errors bubble to a single global handler which:

1. Detects common error types:
   - Mongoose `ValidationError` -> 400
   - Duplicate key (code 11000) -> 409
   - CastError (invalid ObjectId) -> 400
   - JWT errors -> 401
   - Invalid JSON payload -> 400
2. Logs with:
   - status code, message, url, method, ip
   - stack only in development
3. Returns JSON:
   - `success: false`
   - `message`
   - optional `stack` in dev

---

## 14. Where Uploaded Faces Are Stored

- Face register images are stored under:
  - `uploads/faces`
- They are also served via:
  - `GET /uploads/...` (because `app.use('/uploads', express.static(...))`)

Face verification and attendance use in-memory buffers (no image persistence required for those operations).

