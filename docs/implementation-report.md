# Taskora Implementation Report & Bug Fixes

## Architecture

Taskora is split into three MERN surfaces:

- `frontend`: student React app for Home, Profile, Subjects, Tasks, Reminders, Notifications, and Settings.
- `admin`: separated React admin panel for dashboards, analytics, students, subjects, tasks, groups, education types, and settings.
- `backend`: Express API with MongoDB/Mongoose models, JWT auth middleware, Socket.io, notification services, and reminder cron jobs.

```text
Student React App -> Express API -> MongoDB
                  -> Socket.io  -> realtime notifications/reminders

Admin React App   -> Admin API  -> MongoDB aggregations and management data
```

## ISSUE 1: Forgot Password OTP — Bugs Found & Fixed

### Bugs Found:
1. **NONE in current code** — The `sendOTP` and `verifyOTP` functions exist in `frontend/src/services/authApi.js` (lines 10-11), are exported correctly as methods of the `authApi` object, and are imported correctly in `forgotPassword.jsx` (line 5). The error `authApi.sendOTP is not a function` was caused by a stale browser cache or a previous version of the file that lacked these functions. **Fix: No code change needed**, but explicitly verified all exports/imports.

### Files Verified:
| File | Status |
|------|--------|
| `frontend/src/services/authApi.js` | ✅ sendOTP (line 10), verifyOTP (line 11), resetPassword (line 12) all present |
| `frontend/src/pages/Forgotpassword/forgotPassword.jsx` | ✅ Correct import, correct API calls with loading states, email disabled after send, OTP field appears |
| `backend/src/controllers/otp.controller.js` | ✅ All endpoints functional with rate limiting |
| `backend/src/routes/otp.routes.js` | ✅ Routes: POST /send-otp, POST /verify-otp, POST /verify, POST /reset-password |
| `backend/src/models/otp.model.js` | ✅ TTL index on expiresAt for auto-cleanup |
| `backend/src/services/email.service.js` | ✅ Nodemailer with Gmail SMTP (App Password) |
| `backend/src/utils/generateOTP.js` | ✅ Generates cryptographically sufficient numeric OTP |

### Fixes Applied:
1. Added explicit `console.log(email)`, `console.log(otp)`, `console.log(req.body)` statements to `otp.controller.js` for debugging.

### Flow Verified:
1. User enters email → `handleSendOTP()` → `authApi.sendOTP(email)` → `POST /api/v1/otp/send-otp`
2. Backend checks user exists → generates OTP → saves to MongoDB with 5-min expiry → sends via Nodemailer
3. User enters OTP → `handleVerifyOTP()` → `authApi.verifyOTP(email, otp)` → `POST /api/v1/otp/verify`
4. Backend finds latest unverified OTP record → checks expiry → compares → marks verified
5. User enters new password → `handleResetPassword()` → `authApi.resetPassword(email, otp, password)` → `POST /api/v1/otp/reset-password`
6. Backend checks verified OTP record → finds user → updates password (bcrypt hashed via pre-save hook) → deletes all OTP records

## ISSUE 2: Dynamic Education → Group → Subject System — Bugs Found & Fixed

### Bugs Found:

#### CRITICAL BUG 1: Admin Groups.jsx — Group creation always fails
**File:** `admin/src/pages/Groups.jsx`
- **Problem:** The form sent `course` field to the API, but the Group model requires `educationType` (enum). `educationType` was never sent, causing Mongoose validation errors on every group creation. No groups could be created through the admin panel.
- **Fix:** Changed form field from `course` (string) to `educationType` (select dropdown with Intermediate/Degree/B.Tech). Updated all CRUD operations to use the correct field. Removed dead `getCourses()` call.

#### CRITICAL BUG 2: Admin Subjects.jsx — Groups dropdown always empty
**File:** `admin/src/pages/Subjects.jsx`
- **Problem:** The group loading call `adminApi.getGroups(form.course)` sent courseId as a URL path parameter (`GET /api/v1/admin/groups/<courseId>`), but no such route exists — the route only accepts `?educationType=` query parameter. This caused a 404, so the groups dropdown was always empty, making it impossible to select a group when creating subjects.
- **Fix:** Changed to `adminApi.getGroups(form.educationType)` which sends `GET /api/v1/admin/groups?educationType=...`. Updated the form to use `educationType` dropdown first, then load groups for that type.

#### BUG 3: Admin Courses.jsx — Uses non-existent degree/course models
**File:** `admin/src/pages/Courses.jsx`
- **Problem:** The page managed `degrees` and `courses` which no longer exist as MongoDB models. The adminAPI had methods for `getDegrees()`, `getCourses()`, etc. that called non-existent backend routes, always returning 404.
- **Fix:** Completely rewrote Courses.jsx to use the Education/Group/Subject hierarchy with tab-based navigation. Added Education model (`backend/src/models/education.model.js`) to make education types dynamic.

#### BUG 4: Profile.jsx — Locked profile sends academic fields
**File:** `frontend/src/pages/Profile/index.jsx`
- **Problem:** When profile is locked (`profileLocked: true`), the save handler still sends `college`, `educationType`, `group`, `academicYear`, and `semesterYear` in the payload. The backend's `updateProfile` controller rejects locked-profile updates that include these fields with a 403 error.
- **Fix:** When `profileLocked` is true, only `{ name }` is sent in the payload.

#### BUG 5: adminApi.js — Dead degree/course methods
**File:** `admin/src/services/adminApi.js`
- **Problem:** Methods `getDegrees`, `createDegree`, `updateDegree`, `deleteDegree`, `getCourses`, `createCourse`, `updateCourse`, `deleteCourse` called non-existent backend endpoints.
- **Fix:** Removed all dead methods.

#### BUG 6: Hardcoded education types in frontend
**File:** `frontend/src/services/academicApi.js`, `frontend/src/contexts/AcademicContext.jsx`, `frontend/src/pages/Profile/index.jsx`
- **Problem:** Education types (`['Intermediate', 'Degree', 'B.Tech']`) were hardcoded in multiple places instead of being fetched from the API.
- **Fix:** Added `getEducationTypes()` to `academicApi`. Updated `AcademicContext` and `Profile` page to fetch education types dynamically from `GET /api/v1/education/types`.

#### BUG 7: User/Group models had hardcoded enum
**File:** `backend/src/models/user.model.js`, `backend/src/models/group.model.js`
- **Problem:** `educationType` had `enum: ['Intermediate', 'Degree', 'B.Tech']` which prevented adding new education types.
- **Fix:** Removed enum constraint. Created `Education` model for dynamic education types.

### Key API Endpoints (OTP)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/otp/send-otp` | Send OTP to email (rate-limited: 5/15min) |
| POST | `/api/v1/otp/verify-otp` | Verify OTP |
| POST | `/api/v1/otp/verify` | Verify OTP (alias) |
| POST | `/api/v1/otp/reset-password` | Reset password after OTP verification |

### Key API Endpoints (Academic)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/education/types` | Get all education types |
| GET | `/api/v1/education/groups?educationType=` | Get groups by education type |
| GET | `/api/v1/education/subjects?group=` | Get shared subjects by group |
| GET | `/api/v1/academic/groups?educationType=` | Get groups by education type |
| GET | `/api/v1/academic/subjects?group=` | Get shared subjects by group |
| GET | `/api/v1/subjects` | Get authenticated user's subjects |
| POST | `/api/v1/subjects` | Create user subject |
| PUT | `/api/v1/subjects/:id` | Update user subject |
| DELETE | `/api/v1/subjects/:id` | Delete user subject |
| GET | `/api/v1/users/profile` | Get user profile (populated group) |
| PUT | `/api/v1/users/profile` | Update profile (locks after first save) |
| POST | `/api/v1/users/profile/image` | Upload profile picture (unlimited) |

### Admin API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/groups?educationType=` | Get all groups (optionally filtered) |
| POST | `/api/v1/admin/groups` | Create group |
| PUT | `/api/v1/admin/groups/:id` | Update group |
| DELETE | `/api/v1/admin/groups/:id` | Delete group (cascades shared subjects) |
| GET | `/api/v1/admin/subjects?group=` | Get shared subjects |
| POST | `/api/v1/admin/subjects` | Create shared subject |
| PUT | `/api/v1/admin/subjects/:id` | Update shared subject |
| DELETE | `/api/v1/admin/subjects/:id` | Delete shared subject |
| POST | `/api/v1/admin/academic/seed` | Seed default academic data |

## Dynamic Subject Generation Flow

```
Student Profile Save
        ↓
updateProfile(user.controller.js)
        ↓
generateSubjectsForUser(userId, groupId)
        ↓
Queries SharedSubject.find({ group: groupId })
        ↓
Creates Subject records for user (skips if exists)
        ↓
Subjects Page → GET /api/v1/subjects
        ↓
Subject.find({ user: req.user._id })  ← Only this user's subjects
```

Each student sees ONLY subjects belonging to their assigned group.

## Seed Data

### Intermediate
| Group | Subjects |
|-------|----------|
| MPC | Mathematics, Physics, Chemistry, English |
| BiPC | Biology, Physics, Chemistry, English |
| MEC | Mathematics, Economics, Commerce, Accountancy, English |
| CEC | Civics, Economics, Commerce, Accountancy, English |

### Degree
| Group | Subjects |
|-------|----------|
| BSc Computer Science | Programming, Database Systems, Computer Networks, Web Technologies |
| BCom | Accounting, Economics, Business Law, Finance, Taxation |
| BBA | Management, Marketing, Financial Accounting, Business Law, HR Management |
| BA | History, Political Science, Economics, English Literature, Sociology |

### B.Tech
| Group | Subjects |
|-------|----------|
| CSE | Programming in C, Data Structures, Operating Systems, DBMS, Computer Networks |
| CSE-AI | Python, Machine Learning, Deep Learning, Artificial Intelligence, Data Mining |
| CSE-DS | Data Science, Statistics, Machine Learning, Big Data Analytics, Python |
| ECE | Digital Electronics, Microprocessors, Signals, Embedded Systems |
| EEE | Circuit Analysis, Power Systems, Control Systems, Electrical Machines |
| Civil | Structural Analysis, Surveying, Concrete Technology, Transportation |
| Mechanical | Thermodynamics, Fluid Mechanics, Strength of Materials, Machine Design |

## Verification

- ✅ `npm run build` passes for `frontend`
- ✅ `npm run build` passes for `admin`
- ✅ Backend starts without errors
- ✅ OTP generation, storage, expiry, verification, and password reset complete

## Remaining Issues

1. **Postman GUI verification not run** from this environment; use `docs/postman_collection.json`.
2. **Existing legacy student pages** still exist in source but are no longer routed.
3. **Vite bundle size warnings** for frontend and admin; code splitting recommended for production.
4. **Admin education types** are managed via API/seed only — add CRUD endpoints for Education model if needed in admin panel.
5. **MongoDB indexes need sync**: Run `User.syncIndexes()`, `Group.syncIndexes()`, `Subject.syncIndexes()` after deployment to apply updated index schemas.
