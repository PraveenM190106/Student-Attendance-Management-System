# Attendance Management System - System Architecture & API Specification

This document details the architectural layout, data workflow, component structures, and REST API specification for the **Student Attendance Management System**.

---

## High-Level System Architecture

```text
+-------------------------------------------------------------------------+
|                               FRONTEND                                  |
|     React.js (Vite) + Component State + Axios HTTP Client               |
|                                                                         |
|  [ Modern Dashboard ] [ Attendance Marker ] [ Student/Course Manager ] |
+-------------------------------------------------------------------------+
                                    |
                                    | REST API Calls (HTTP / JSON)
                                    v
+-------------------------------------------------------------------------+
|                                BACKEND                                  |
|   Spring Boot Web Framework (Port 8080)                                 |
|                                                                         |
|  - Controller Layer: REST Endpoints (@RestController)                  |
|  - Service Layer: Business Logic & Validation                          |
|  - Security Layer: Spring Security (Role-based Guards)                  |
|  - Repository Layer: Spring Data JPA Interfaces                        |
+-------------------------------------------------------------------------+
                                    |
                                    | JDBC / ORM Queries
                                    v
+-------------------------------------------------------------------------+
|                               DATABASE                                  |
|   MySQL Relational Database (`attendance_system`)                       |
|   Tables: users, students, courses, attendance                          |
+-------------------------------------------------------------------------+
```

---

## REST API Specification

### 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/auth/login` | Authenticate user & get session info | `{ "username": "...", "password": "..." }` | User DTO + Status |
| `POST` | `/api/auth/logout` | Clear server session / token | Empty | `{ "message": "Logged out successfully" }` |
| `GET`  | `/api/auth/me` | Fetch current active user profile | Auth Header | Current User Object |

### 2. Dashboard Endpoints (`/api/dashboard`)

| Method | Endpoint | Description | Query Parameters | Response |
|--------|----------|-------------|------------------|----------|
| `GET`  | `/api/dashboard/stats` | High-level metrics (Total Students, Courses, Attendance Rate) | None | DashboardStatsDTO |
| `GET`  | `/api/dashboard/chart-data` | Attendance trends by department & month | `?timeframe=monthly` | ChartDataDTO |

### 3. Student Management Endpoints (`/api/students`)

| Method | Endpoint | Description | Request Body / Params | Response |
|--------|----------|-------------|----------------------|----------|
| `GET`  | `/api/students` | Get list of all students | `?department=...&semester=...` | List<StudentDTO> |
| `GET`  | `/api/students/{id}` | Get student by ID | Path variable `id` | StudentDTO |
| `POST` | `/api/students` | Add a new student | StudentDTO JSON | Created StudentDTO |
| `PUT`  | `/api/students/{id}` | Update existing student details | StudentDTO JSON | Updated StudentDTO |
| `DELETE`| `/api/students/{id}` | Remove student record | Path variable `id` | Success Message |

### 4. Attendance Endpoints (`/api/attendance`)

| Method | Endpoint | Description | Request Body / Params | Response |
|--------|----------|-------------|----------------------|----------|
| `POST` | `/api/attendance/mark` | Save bulk/single attendance records | `AttendanceMarkRequest` JSON | Saved Records List |
| `GET`  | `/api/attendance/course/{courseId}` | Get attendance for a course by date | `?date=YYYY-MM-DD` | List<AttendanceDTO> |
| `GET`  | `/api/attendance/student/{studentId}` | Get student attendance history | `?startDate=&endDate=` | StudentAttendanceReportDTO |

---

## Database ER Diagram (Logical Structure)

```text
[ USERS ]
- id (PK)
- username
- password
- email
- role (ADMIN, TEACHER)

[ STUDENTS ] (1) <------- (N) [ ATTENDANCE ] (N) -------> (1) [ COURSES ]
- id (PK)                    - id (PK)                        - id (PK)
- roll_number                - student_id (FK)                - course_code
- name                       - course_id (FK)                 - course_name
- department                 - attendance_date                - department
- semester                   - status (PRESENT/ABSENT/LATE)   - semester
                             - remarks                        - teacher_name
```
