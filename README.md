# LinkedIn Automation Platform

A modern, high-performance web application designed to manage and automate LinkedIn content creation and publishing across multiple accounts.

## 🚀 Key Features

### 👤 User & Role Management
- **Role-Based Access Control (RBAC)**: Supports `admin` and `user` roles.
- **Admin Dashboard**: Dedicated interface for administrators to create, update, and delete users.
- **Secure Authentication**: Built-in login system with encrypted passwords and JWT-based session management.
- **Controlled Registration**: Public registration is disabled; only administrators can provision new accounts.

### 💼 Multi-Account Workspace
- **Dedicated Account Spaces**: Each LinkedIn account has its own workspace with a specialized "Feed" and "Gallery".
- **Real-Time Auto-Save**: All modifications to account settings (posting frequency, AI context prompts, etc.) are saved automatically in real-time.
- **Simplified Navigation**: Quick switching between accounts with a persistent sidebar and account-specific headers.

### 📝 AI-Powered Content Feed
- **Intelligent Captions**: View and edit AI-generated captions for your LinkedIn posts.
- **Seamless Editing**: Caption edits are automatically saved as you type.
- **Scheduling & Publishing**: Plan your posts with an integrated calendar and publish them directly to LinkedIn via Make.com integration.

## 🛠 Tech Stack

- **Frontend & Backend**: [Nuxt 4](https://nuxt.com/) (Vue 3, Nitro)
- **Database**: MySQL managed via [Prisma ORM](https://www.prisma.io/)
- **Authentication**: JWT & Bcryptjs
- **Icons**: Lucide Vue Next
- **Styling**: Vanilla CSS with modern Glassmorphism aesthetics

## 📂 Project Structure

```text
├── app/                  # Frontend components, pages, and logic
│   ├── components/       # Reusable UI components (Sidebar, Navbar, Base UI)
│   ├── composables/      # Shared state and logic (auth, current account)
│   ├── layouts/          # Page layouts (auth, dashboard)
│   └── pages/            # Nuxt routes (auth, accounts, dashboard)
├── server/               # Backend API and server-side logic
│   ├── api/              # API endpoints (auth, accounts, posts, users)
│   └── utils/            # Server utilities (auth helpers, prisma client)
├── prisma/               # Database schema and migrations
└── public/               # Static assets
```

## ⚙️ Setup & Installation

1. **Clone the project**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file based on `.env.example`:
   ```env
   DATABASE_URL="mysql://user:pass@localhost:3306/db_name"
   JWT_SECRET="your-secret-key"
   ```
4. **Database Setup**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
5. **Run in Development**:
   ```bash
   npm run dev
   ```

## 🔐 Admin Access
To promote a user to administrator via the database, you can use the Prisma Studio or run a custom script to update the `role` field in the `users` table to `'admin'`.
