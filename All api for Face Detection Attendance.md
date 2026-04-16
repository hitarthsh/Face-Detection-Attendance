# All API for Face Detection Attendance

Base URL (dev): `http://localhost:10000`

All API endpoints are mounted under `/api`.

## Authentication

- Send the access token in the header:
  - `Authorization: Bearer <accessToken>`
- Role-based access (where applicable):
  - `admin`: full access to employees CRUD and admin endpoints
  - `manager`: can register faces (but not employees CRUD)
  - `viewer`: authenticated users who generally cannot access admin/employee management routes

## Common Request Rules

- `Content-Type: application/json` for JSON requests.
- `multipart/form-data` for face and attendance requests.
- Upload constraints (Multer):
  - Allowed image types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
  - Max file size: `MAX_FILE_SIZE` (from `backend/.env`, currently `10485760` bytes ~= 10MB)
  - Face register uses disk storage; face verify + attendance use in-memory storage.

## API Endpoints

### Root

1. `GET /`
   - Auth: none
   - Returns: server info (name/version) and `docs: /api/health`

### Health

1. `GET /api/health`
   - Auth: none
   - Returns: server/db status, memory usage, uptime

### Authentication

1. `POST /api/auth/register`
   - Auth: none
   - Body (JSON):
     - `name` (string, required)
     - `email` (string, required; valid email)
     - `password` (string, required; min length 8)
     - `role` (string, optional; expected values: `admin`, `manager`, `viewer`)
2. `POST /api/auth/login`
   - Auth: none
   - Body (JSON):
     - `email` (string, required)
     - `password` (string, required)
3. `POST /api/auth/refresh`
   - Auth: none
   - Body (JSON):
     - `refreshToken` (string, required)
4. `POST /api/auth/logout`
   - Auth: required (`Authorization: Bearer ...`)
   - Body: none
5. `GET /api/auth/profile`
   - Auth: required (`Authorization: Bearer ...`)

### Employees (authenticated; `admin` for create/update/delete)

1. `POST /api/employees`
   - Auth: required; role: `admin`
   - Body (JSON):
     - `employeeId` (string, required)
     - `name` (string, required)
     - `department` (string, required)
     - `email` (string, required; valid email)
   - Notes: schema supports optional fields like `phone`, `position`, `isActive`, and face-related fields.
2. `GET /api/employees`
   - Auth: required
   - Query params:
     - `page` (number, optional; default `1`)
     - `limit` (number, optional; default `20`)
     - `search` (string, optional; text search)
     - `department` (string, optional)
     - `isActive` (string, optional; expected `true`/`false`)
3. `GET /api/employees/:id`
   - Auth: required
   - Path param:
     - `id` can be either Mongo `_id` or `employeeId`
4. `PUT /api/employees/:id`
   - Auth: required; role: `admin`
   - Body (JSON): update fields for the employee schema (e.g., `employeeId`, `name`, `department`, `email`, etc.)
5. `DELETE /api/employees/:id`
   - Auth: required; role: `admin`

### Face Recognition (authenticated; `admin|manager` for register)

1. `POST /api/face/register`
   - Auth: required; role: `admin` or `manager`
   - Content-Type: `multipart/form-data`
   - Form fields:
     - `image` (file, required)
     - `employeeId` (string, required; also accepted via header `x-employee-id`)
   - Notes: controller uppercases `employeeId`.
2. `POST /api/face/verify`
   - Auth: required
   - Content-Type: `multipart/form-data`
   - Form fields:
     - `image` (file, required)

### Attendance (authenticated)

1. `POST /api/attendance/checkin`
   - Auth: required
   - Content-Type: `multipart/form-data`
   - Form fields:
     - `image` (file, required)
     - `latitude` (string/number, optional; parsed as float)
     - `longitude` (string/number, optional; parsed as float)
2. `POST /api/attendance/checkout`
   - Auth: required
   - Content-Type: `multipart/form-data`
   - Form fields:
     - `image` (file, required)
     - `latitude` (string/number, optional)
     - `longitude` (string/number, optional)
3. `GET /api/attendance/today`
   - Auth: required
   - Query params:
     - `page` (optional; default `1`)
     - `limit` (optional; default `50`)
     - `department` (optional)
4. `GET /api/attendance/report`
   - Auth: required
   - Query params:
     - `startDate` (string, optional; expected `YYYY-MM-DD`)
     - `endDate` (string, optional; expected `YYYY-MM-DD`)
     - `employeeId` (optional)
     - `department` (optional)
     - `page` (optional; default `1`)
     - `limit` (optional; default `50`)

### Admin (authenticated; `admin` role only)

1. `GET /api/admin/dashboard`
   - Auth: required; role: `admin`
2. `GET /api/admin/users`
   - Auth: required; role: `admin`
3. `PUT /api/admin/users/:id/role`
   - Auth: required; role: `admin`
   - Path param: `id` (Mongo user id)
   - Body (JSON):
     - `role` (string; expected values: `admin`, `manager`, `viewer`)
4. `PATCH /api/admin/users/:id/toggle`
   - Auth: required; role: `admin`
   - No body required

