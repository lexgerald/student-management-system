# Student Management System API

A REST API for managing students, teachers, courses, grades and attendance,
with role-based access for admins, teachers and students.

## Features
- JWT authentication with bcrypt password hashing
- Three roles: admin, teacher, student
- Admin: manage students, teachers, courses, enrollments
- Teacher: view own courses and students, record grades, mark attendance
- Student: view own courses, grades (with letter grade and average), attendance (with percentage)
- Input validation (Joi), Helmet, rate limiting, CORS, central error handling
- Automated tests (Jest and Supertest)

## Tech stack
Node.js, Express, MongoDB (Mongoose), JWT, Joi, Jest, Swagger UI

## Getting started
```bash
git clone <your-repo-url>
cd student-management-system
npm install
cp .env.example .env     # then fill in your values
node src/seedAdmin.js    # creates the first admin
npm run dev
```

## Scripts
| Command | Purpose |
|---|---|
| `npm run dev` | Start with auto-reload |
| `npm start` | Start for production |
| `npm test` | Run the automated tests |

## Admin Login
Email: 'admin@sms.com
Password: Admin@123

## Project structure
```
src/
  config/        database connection
  controllers/   request handling and business rules
  docs/          OpenAPI specification
  middleware/    auth, validation, rate limiting, errors
  models/        Mongoose schemas
  routes/        endpoint definitions
  utils/         helpers
  validators/    Joi schemas
tests/           automated tests
```

## Roles and access
| Resource | Admin | Teacher | Student |
|---|---|---|---|
| Students | full CRUD | view | none |
| Teachers | full CRUD | none | none |
| Courses | full CRUD | view, own courses | none |
| Enrollments | manage | none | view own |
| Grades | all | own courses only | view own |
| Attendance | all | own courses only | view own |

## API overview
See the live Swagger docs for every endpoint, request body and example.

## Security notes
- Public registration always creates student accounts; roles cannot be self-assigned
- Passwords hashed with bcrypt, never returned by the API
- Unknown request fields are stripped and types are validated (blocks NoSQL injection)
- Rate limiting on all routes, stricter on login

## Limitations and future work
- Rate limit counters are in memory (would need Redis with multiple servers)
- No password reset or email verification
- No refresh tokens

## Author
Gerald Williams