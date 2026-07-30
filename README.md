# Student Attendance Management System

A professional Full Stack Web Application built with **React.js (Vite)** on the frontend and **Spring Boot (Java)** on the backend, with **MySQL** for data persistence.

---

## Project Introduction

The **Student Attendance Management System** provides an efficient, web-based platform for educational institutions to manage student records, track course enrollments, mark daily attendance (Present, Absent, Late), and generate comprehensive statistical reports and visual analytics.

---

### Default Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `password123` |

this is default set

## There are five department .

| Role          | Username               |   Password  |
|---------------|------------------------|-------------|
| **Teacher 1** | `gowsi123@gmail.com`   | `ECE@123`   |
| **Teacher 2** | `saran123@gmail.com`   | `CSE@123`   |
| **Teacher 3** | `uma123@gmail.com`     | `IT@123`    |
| **Teacher 4** | `arun123@gmail.com`    | `MECH@123`  |
| **Teacher 5** | `jayaran123@gmail.com` | `CIVIL@123` |

if you dont like this staff or you can try to explore and create new dpartment staff, its no problem..To delete existing staff using admin portal and create new....
---

### Key Features
* **Interactive Dashboard**: Real-time stats widgets and visual attendance analytics powered by Chart.js.
* **Student Directory**: Add, update, view, and search students filtered by Department and Semester.
* **Attendance Marker**: Class-wise batch attendance recording interface with instant status toggles.
* **Reports & Analytics**: Track individual student attendance percentages and exportable report views.
* **Role-Based Access**: Multi-user interface supporting Admin and Teacher workflows.
* **Responsive Modern UI**: Modern layout with light/dark glassmorphism, responsive sidebar navigation, and subtle micro-animations.

---

## Technology Stack

### Frontend
* **Core**: React.js (Vite framework)
* **Routing**: React Router DOM (v6+)
* **HTTP Client**: Axios
* **Styling**: Vanilla CSS3 (Custom Design System with Variables & Glassmorphism)
* **Visualizations**: Chart.js & React-Chartjs-2
* **Icons**: Lucide React & Font Awesome CSS

### Backend
* **Language & Framework**: Java 17 / Spring Boot 3
* **Web & REST**: Spring MVC / REST API
* **Data Access**: Spring Data JPA / Hibernate
* **Security**: Spring Security (Role-Based Authentication / JWT)
* **Build Tool**: Maven

### Database
* **Database Engine**: MySQL Server 8.0+
* **Database Name**: `attendance_system`

---

## Project Structure

```text
Attendance-System/
│
├── frontend/                 # React.js + Vite Application
│   ├── src/
│   │   ├── assets/           # Static images, icons, and logo SVGs
│   │   ├── components/       # Shared UI components (Sidebar, Navbar, Cards)
│   │   ├── context/          # React Auth Context & Global State
│   │   ├── layouts/          # Application Layout wrappers (MainLayout)
│   │   ├── pages/            # Page Views (Dashboard, Students, MarkAttendance, etc.)
│   │   ├── routes/           # Protected Router definitions
│   │   ├── services/         # Axios API HTTP service layer
│   │   ├── styles/           # CSS design system & utility classes
│   │   ├── App.jsx           # App root component
│   │   └── main.jsx          # Entry mount point
│   ├── package.json
│   └── vite.config.js
│
├── backend/                  # Java Spring Boot REST API
│   ├── src/main/java/com/attendance/system/
│   │   ├── config/           # CORS & Web MVC configuration
│   │   ├── controller/       # REST API Endpoints
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── entity/           # JPA Database Entities
│   │   ├── exception/        # Exception handlers & custom errors
│   │   ├── repository/       # Spring Data JPA Repository interfaces
│   │   ├── security/         # Authentication & Authorization filters
│   │   ├── service/          # Business logic implementation
│   │   ├── util/             # Utility helpers & response formatters
│   │   └── AttendanceApplication.java  # Main Spring Boot Runner
│   ├── src/main/resources/
│   │   └── application.properties     # DB & App configuration
│   └── pom.xml               # Maven configuration & dependencies
│
├── database/                 # SQL Schema & Pre-populated sample data
│   └── attendance_system.sql
│
├── docs/                     # System architecture & API documentation
│   └── ARCHITECTURE.md
│
└── README.md                 # Documentation
```

---

## Installation & Setup Steps

### 1. Database Setup

1. Open **MySQL Workbench** or MySQL Command Line Client.
2. Log in with your MySQL credentials (Default user: `root`, password: `praveen2006@`).
3. Import and execute the SQL script located in the `database/` folder:
   ```sql
   SOURCE database/attendance_system.sql;
   ```
   *This creates the `attendance_system` database along with pre-configured tables and sample records.*

---

### 2. Backend Setup (Spring Boot)

1. Open **IntelliJ IDEA** (or Eclipse / VS Code with Java Extension Pack).
2. Select **Open** and choose the `backend` folder directory.
3. Verify or configure your MySQL credentials in `backend/src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/attendance_system?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
   spring.datasource.username=root
   spring.datasource.password=praveen2006@
   ```
4. Allow Maven to download all required dependencies.
5. Run the application by executing `AttendanceApplication.java`.
6. The backend server will start on: **`http://localhost:8080`**

---

### 3. Frontend Setup (React.js + Vite)

1. Open **Visual Studio Code**.
2. Select **File -> Open Folder** and choose the `frontend` folder directory.
3. Open the integrated terminal (`Ctrl + ~`).
4. Install all npm dependencies:
   ```bash
   npm install
   ```
5. Start the Vite development server:
   ```bash
   npm run dev
   ```
6. Open your browser and navigate to: **`http://localhost:5173`**

---

## Default URLs & Access Credentials

| Application | URL |
|-------------|-----|
| **Frontend UI** | `http://localhost:5173` |
| **Backend REST API** | `http://localhost:8080` |
---

## Communication Flow

Frontend communicates exclusively with the backend via RESTful APIs using **Axios**.

```text
React.js Frontend (Port 5173)
       ↓  (Axios HTTP Requests)
Spring Boot REST API (Port 8080)
       ↓  (Spring Data JPA / Hibernate)
MySQL Database (`attendance_system`)
```

---

## Development Environment Recommendation

* **Frontend**: Visual Studio Code
* **Backend**: IntelliJ IDEA
* **Database**: MySQL Workbench
* **API Testing**: Postman
* **Browser**: Google Chrome
