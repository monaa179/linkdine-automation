# 🚀 LinkedIn Automation Platform

A robust, enterprise-grade web application for automating LinkedIn content creation and multi-account management, powered by Nuxt 4 and Make.com.

## 🛠 Technical Architecture

- **Frontend & Backend**: [Nuxt 4](https://nuxt.com/) (Vue 3 with Composition API + Nitro Server Engine)
- **Database**: MySQL via [Prisma ORM](https://www.prisma.io/)
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` for password hashing
- **Automation Logic**: Integrated webhooks for [Make.com](https://make.com) and internal cron services
- **UI System**: Vanilla CSS with modern Glassmorphism aesthetics and [Lucide](https://lucide.dev/) icons

---

## ✨ Core Features

### 👤 Advanced User Management
- **RBAC (Role-Based Access Control)**: Strictly defined `admin` and `user` roles.
- **Admin Control**: Centralized dashboard for user provisioning (Public registration is disabled).
- **Security**: Encrypted session management and secure API endpoints.

### 💼 Multi-Account Workspace
- **Isolated Accounts**: Each LinkedIn account acts as a separate workspace with distinct settings.
- **Dynamic Config**: Real-time auto-saving for AI prompts, posting frequency, and scheduling.
- **Integrated Gallery**: Centralized media management for each account.

### 🤖 AI-Powered Automation
- **Make.com Integration**: Automated generation of LinkedIn-optimized captions from uploaded images.
- **Intelligent Scheduling**: Custom `scheduler` utility calculates optimal posting slots based on user preferences.
- **Real-Time Edits**: Live feedback loop for editing AI-generated content before publication.

---

## 🔄 Automation Flow (Make.com)

The system operates on a 3-step automation cycle:

1.  **Trigger**: User uploads an image and requests a post. The system sends a payload to Make.com (`MAKE_WEBHOOK_URL`).
2.  **AI Generation**: Make.com processes the image, generates a caption via AI, and sends it back to `/api/make/caption-generated`.
3.  **Scheduling**: The system automatically schedules the post using the account's frequency settings.
4.  **Publishing**: A cron job calls `/api/cron/schedule-posts`, which pushes ready posts to Make.com for final LinkedIn publication.

---

## 📂 Project Structure

```text
├── app/                  # Frontend Layer
│   ├── components/       # UI Components (Sidebar, Navbar, Modals)
│   ├── composables/      # Shared Logic (Auth, Account State)
│   ├── layouts/          # Persistent Layouts (Auth, Dashboard)
│   └── pages/            # Nuxt File-system Routing
├── server/               # Backend Layer (Nitro)
│   ├── api/              # RESTful API Endpoints
│   │   ├── cron/         # Scheduling & Publication Jobs
│   │   ├── make/         # Incoming Webhooks from Make.com
│   │   └── auth/         # Security & Sessions
│   └── utils/            # Prisma Client, Schedulers, Webhook Auth
├── prisma/               # Data Layer (Schema & Migrations)
└── public/               # Static Media Assets
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- MySQL Database

### 2. Dependency Installation
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mysql://user:pass@localhost:3306/db_name"

# Security
JWT_SECRET="your-high-entropy-secret"
WEBHOOK_SECRET="secret-for-make-validation"
CRON_SECRET="secret-for-cron-validation"

# URLs
APP_URL="http://localhost:3000"
MAKE_WEBHOOK_URL="https://hook.make.com/..."
MAKE_PUBLISH_WEBHOOK_URL="https://hook.make.com/..."
```

### 4. Database Initialization
```bash
npx prisma db push
npx prisma generate
```

### 5. Running the Application
```bash
# Development mode
npm run dev

# Production build
npm run build
npm run preview
```

---

## 🔐 Administration & Operations

### Promoting a User to Admin
Since registration is closed, use the Prisma Studio to modify user roles:
```bash
npx prisma studio
```
Navigate to the `users` table and update the `role` field to `admin`.

### Scheduling Logic Details
The `getNextAvailableSlots` utility (located in `server/utils/scheduler.ts`) handles the distribution of posts based on:
- **`postingPeriod`**: day, week, or month.
- **`postingFrequency`**: Number of posts per period.
- **`postingDay`**: Targeted days for weekly/monthly schedules.
- **`postingHour`**: The specific time window for publication.
