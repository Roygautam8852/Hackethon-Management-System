# Hacklytics — Hackathon Management Platform (MERN Stack)

Hacklytics is a production-level, SaaS-grade Hackathon Management Platform built on the MERN stack (MongoDB, Express.js, React 18, Node.js). It replaces fragmented tools (Google Forms, WhatsApp, Email, Excel, Drive) with a centralized, real-time platform for organizing, managing, participating in, judging, and communicating during hackathons.

---

## 🌟 Key Features & Role-Based Workflows

### 🔐 1. Authentication & Role Approval Guards
- **JWT & HTTP-Only Cookies**: Secure authentication flow with role payload.
- **Strict Role Enforcement**: 4 distinct roles (`admin`, `organizer`, `participant`, `judge`).
- **Organizer & Judge Approval Guard**: Organizers and Judges require Admin verification before gaining full privileges. Unapproved organizers see a dedicated *"Account Pending Approval"* screen on their dashboard.

### 💬 2. WhatsApp-Style Direct Chat System (`/chat`)
- **Role-Based Chat Rules**:
  - **Participants**: Message 1-on-1 exclusively with Organizers of hackathons they registered for.
  - **Organizers**: Message 1-on-1 with assigned Judges, Team Leaders of registered teams (displaying Leader Name & Team Name), and System Admins.
  - **Judges**: Message 1-on-1 with Organizers (displaying exact Hackathon Titles) and System Admins.
  - **Admins**: Message 1-on-1 with Organizers and Judges.
- **Recent Chat Sorting**: Conversations automatically sort by the most recent message timestamp (most active chat jumps to top).
- **Unread Message Badges**: Vibrant red pill badges (`1`, `2`, `9+`) on contact cards with automatic mark-as-read when opening a chat thread.
- **Last Message Snippet & Time**: Live preview of the last message and timestamp on each contact card.
- **Mobile SaaS Responsive UX**: Edge-to-edge mobile container (`-mx-4 -my-4`), slide-over conversation pane, and a tactile circular back navigation button (`← Back`).

### 🛡️ 3. Administrator Panel (`/admin`)
- **Platform Analytics**: Total users, hackathons, teams, and submissions visualized with Recharts analytics.
- **User & Approval Management**: Approve or reject organizer registrations, block/unblock accounts, filter users by role.
- **Hackathon Oversight**: Full oversight to view and manage any hackathon on the platform.

### 🎪 4. Organizer Suite (`/organizer`)
- **Hackathon Studio**: 3-step wizard to create/edit hackathons with banner image uploads, rules builder, and customizable judging criteria.
- **Registration Control**: Toggle registration open/closed, approve or reject team applications with reason feedback and automated email alerts.
- **Judge Assignment**: Assign certified judges to hackathons by user reference.
- **Results & Winners**: Publish final rankings and announce winner positions.

### 🚀 5. Participant Workspace (`/participant`)
- **Hackathon Discovery**: Public directory with search, mode filters (Online/Offline/Hybrid), and status tags.
- **Team Management**: Create teams, invite members by user ID, respond to invitations, transfer team leadership, or leave teams.
- **Project Submission**: Multi-field submission including project name, problem statement, solution description, tech stack tags, GitHub repository, live demo link, video link, and Cloudinary media uploads.

### ⚖️ 6. Judge Suite (`/judge`)
- **Assigned Submissions**: Overview of pending vs. completed project reviews.
- **Scoring Interface**: Real-time per-criterion scoring sliders with progress bars and written feedback notes.

### 🏆 7. Live Leaderboard (`/leaderboard`)
- **Aggregated Rankings**: MongoDB aggregation pipeline computing average score per submission across all evaluating judges, with medal badges and rank positions.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router DOM v6, Tailwind CSS v4, Framer Motion, Axios, React Hook Form, Zod, Recharts, React Icons, React Hot Toast |
| **Backend** | Node.js, Express.js, Mongoose ODM |
| **Database** | MongoDB with Schema Indexing & Aggregation Pipelines |
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
│   │   ├── pages/              # Public, Admin, Organizer, Participant, Judge, Chat pages
│   │   ├── services/           # Axios instance & API service methods (messageAPI, userAPI, etc.)
│   │   ├── App.jsx             # React Router routing setup
│   │   ├── index.css           # SaaS Dark Design System & Tailwind v4
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── server/                     # Express REST API
│   ├── config/                 # Database (Mongoose) & Cloudinary setup
│   ├── controllers/            # Auth, User, Hackathon, Team, Registration, Submission, Review, Message, Leaderboard
│   ├── middleware/             # Auth, Role, ErrorHandler, Upload (Multer)
│   ├── models/                 # Mongoose schemas (User, Hackathon, Team, Registration, Submission, Review, Message)
│   ├── routes/                 # Express router declarations (messageRoutes, userRoutes, etc.)
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

## 🧪 Verification & Production Build
To test and build the production bundle:

```bash
cd client
npm run build
```
