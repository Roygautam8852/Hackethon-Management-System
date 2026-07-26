# Hacklytics — Hackathon Management Platform (MERN Stack)

Hacklytics is a production-level, SaaS-grade Hackathon Management Platform built on the MERN stack (MongoDB, Express.js, React 18, Node.js). It replaces fragmented tools (Google Forms, WhatsApp, Email, Excel, Drive) with a centralized platform for organizing, managing, participating in, and judging hackathons.

---

## 🌟 Key Features & Role-Based Workflows

### 🔐 1. Authentication & Authorization
- **JWT & HTTP-Only Cookies**: Secure authentication flow.
- **Role Enforcement**: 4 distinct roles (`admin`, `organizer`, `participant`, `judge`).
- **Route Protection**: Backend `authMiddleware` + `roleMiddleware` guards; frontend `ProtectedRoute`.

### 🛡️ 2. Administrator Panel (`/admin`)
- **Platform Analytics**: Total users, hackathons, teams, and submissions visualized with Recharts.
- **User Management**: Search, filter by role, block/unblock accounts, delete users.
- **Hackathon Management**: Full oversight to view and remove any hackathon on the platform.

### 🎪 3. Organizer Suite (`/organizer`)
- **Hackathon Studio**: 3-step wizard to create/edit hackathons with banner image uploads, rules builder, and customizable judging criteria (with maximum points).
- **Registration Control**: Toggle registration open/closed, approve or reject team applications with reason strings and automated email alerts.
- **Judge Assignment**: Assign certified judges to hackathons by user reference.
- **Results & Winners**: Publish final rankings and announce winner positions.

### 🚀 4. Participant Workspace (`/participant`)
- **Hackathon Discovery**: Public directory with search, mode filters (Online/Offline/Hybrid), and status tags.
- **Team Management**: Create teams, invite members by user ID, respond to invitations, transfer team leadership, or leave teams.
- **Project Submission**: Multi-field submission including project name, problem statement, solution description, tech stack tags, GitHub repository, live demo link, video link, and Cloudinary media uploads.

### ⚖️ 5. Judge Suite (`/judge`)
- **Assigned Submissions**: Overview of pending vs. completed project reviews.
- **Scoring Interface**: Real-time per-criterion scoring sliders with progress bars and written feedback notes.

### 🏆 6. Live Leaderboard (`/leaderboard`)
- **Aggregated Rankings**: MongoDB aggregation pipeline computing average score per submission across all evaluating judges, with medal badges and rank positions.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router DOM v6, Tailwind CSS v4, Framer Motion, Axios, React Hook Form, Zod, Recharts, React Icons, React Hot Toast |
| **Backend** | Node.js, Express.js, Mongoose ODM |
| **Database** | MongoDB with Schema Indexing & Aggregations |
| **Media & File Storage** | Multer + Cloudinary (Banners, Avatars, Screenshots, PDFs) |
| **Email Notifications** | Nodemailer |

---

## 📁 Directory Structure

```
Hacklytics/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Common UI, Layout (Navbar, Sidebar, DashboardLayout)
│   │   ├── context/            # AuthContext
│   │   ├── pages/              # Public, Admin, Organizer, Participant, Judge pages
│   │   ├── services/           # Axios instance & API service methods
│   │   ├── App.jsx             # React Router routing setup
│   │   ├── index.css           # SaaS Dark Design System & Tailwind v4
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── server/                     # Express REST API
│   ├── config/                 # Database (Mongoose) & Cloudinary setup
│   ├── controllers/            # Auth, User, Hackathon, Team, Registration, Submission, Review, Leaderboard
│   ├── middleware/             # Auth, Role, ErrorHandler, Upload (Multer)
│   ├── models/                 # Mongoose schemas (User, Hackathon, Team, Registration, Submission, Review)
│   ├── routes/                 # Express router declarations
│   ├── utils/                  # ApiError, ApiResponse, generateToken, sendEmail
│   ├── app.js
│   ├── server.js
│   └── .env.example
│
└── package.json                # Monorepo scripts
```

---

## ⚙️ Quick Start Guide

### 1. Environment Setup
Create a `.env` file in the `server` directory based on `server/.env.example`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/hacklytics?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 2. Installation
From the root directory:

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Running Locally
Run backend and frontend concurrently:

```bash
# Start backend server (Port 5000)
npm run dev

# Start frontend dev server in client directory (Port 5173)
npm run dev:client
```

---

## 🧪 Verification & Build
To build the frontend production bundle:

```bash
cd client
npm run build
```
