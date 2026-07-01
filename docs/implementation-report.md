# Taskora Implementation Report

## Architecture

Taskora is split into three MERN surfaces:

- `frontend`: student React app for Home, Profile, Subjects, Tasks, Reminders, Notifications, and Settings.
- `admin`: separated React admin panel for dashboards, analytics, students, subjects, tasks, groups, courses, notes, and settings.
- `backend`: Express API with MongoDB/Mongoose models, JWT auth middleware, Socket.io, notification services, and reminder cron jobs.

```text
Student React App -> Express API -> MongoDB
                  -> Socket.io  -> realtime notifications/reminders

Admin React App   -> Admin API  -> MongoDB aggregations and management data
```

## Fixed Areas

- Removed student dashboard navigation and student dashboard routes. `/dashboard` now redirects to `/home`.
- Added a student Home page with profile, tasks, reminders, subjects, quick actions, progress, and notifications.
- Added a student Reminders page for active due-date reminders.
- Redirected login, signup, Google login, and agreement acceptance to Profile setup.
- Aligned academic seed data with the required Intermediate, Degree, and B.Tech groups/branches.
- Marked stale default academic groups inactive so dropdowns load the expected group list.
- Profile update now validates required academic fields.
- Profile update now generates user-owned subjects from the selected academic group.
- Subject API self-heals by generating subjects if the student has a group but no subjects yet.
- Student Subjects page now supports Add, Edit, Delete, Search, and Filter against MongoDB user subjects.
- Fixed navbar search result navigation function that was previously missing.
- Rerouted backend notification links away from removed student schedule/calendar pages.

## Key API Endpoints

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/google`
- `GET /api/v1/auth/profile`
- `GET /api/v1/users/profile`
- `PUT /api/v1/users/profile`
- `GET /api/v1/academic/groups?educationType=B.Tech`
- `GET /api/v1/academic/subjects?group=<groupId>`
- `GET /api/v1/subjects`
- `POST /api/v1/subjects`
- `PUT /api/v1/subjects/:id`
- `DELETE /api/v1/subjects/:id`
- `GET /api/v1/tasks`
- `POST /api/v1/tasks`
- `PUT /api/v1/tasks/:id`
- `PATCH /api/v1/tasks/:id/toggle`
- `DELETE /api/v1/tasks/:id`
- `GET /api/v1/notifications`

## Verification

- `node --check` passed for modified backend controllers/models/services.
- `npm run build` passed for `frontend`.
- `npm run build` passed for `admin`.
- `npm run lint` passed with warnings only. Remaining warnings are in existing legacy/inactive files and unrelated shared components.

## Remaining Issues

- Postman GUI verification was not run from this environment; use `docs/postman_collection.json`.
- Existing legacy student pages still exist in source for now, but they are no longer routed or linked in the student app.
- Vite reports large bundle warnings for frontend and admin; code splitting would be the next production optimization.
