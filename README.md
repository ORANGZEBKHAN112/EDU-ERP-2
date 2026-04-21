# EduFlow ERP

Enterprise-grade multi-tenant school ERP with automated fee management, campus-level finance controls, and real-time payment tracking.

## 🚀 Getting Started Locally

To run this project on your local machine, follow these steps:

### 1. Synchronization with GitHub (Crucial for Push/Pull)

In AI Studio Build, the internal repository is read-only for external standard Git clients. To push and pull from your local machine:

1.  Open this project in **AI Studio Build**.
2.  Go to the **Settings** menu (gear icon).
3.  Click **Export to GitHub**.
4.  Follow the prompts to link your GitHub account.
5.  Once exported, you can `git clone` your **new GitHub repository** to your PC.
6.  You can then create branches, commit, and `push/pull` directly to/from your GitHub repository. AI Studio will automatically sync your changes back here.

### 2. Prerequisites

*   **Node.js**: v18 or higher.
*   **Database**: Microsoft SQL Server (MSSQL).
*   **npm**: Installed with Node.js.

### 3. Installation

```bash
# Clone your EXPORTED GitHub repository
git clone https://github.com/your-username/eduflow-erp.git
cd eduflow-erp

# Install dependencies
npm install
```

### 4. Database Setup

1.  Create a database named `EduFlowDB` in your MSSQL instance.
2.  Run the scripts in the `/migrations` folder against your database to set up the schema.

### 5. Environment Variables

Create a `.env` file in the root directory and copy the contents from `.env.example`. Replace the placeholders with your actual database credentials and API keys.

```bash
cp .env.example .env
```

### 6. Development

Run the development server (Express + Vite):

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📁 Project Structure

*   `/src`: Frontend React application.
*   `/server`: Backend Express server and repositories.
*   `/migrations`: SQL scripts for database schema and hardening.
*   `server.ts`: Entry point for the full-stack application.

## 🛡️ Security & Hardening

This project includes production-ready hardening:
*   **Multi-Tenancy**: Strict isolation between schools and campuses.
*   **Financial Safety**: Transactions for payment processing.
*   **RBAC**: Role-based access control with normalized role matching.
*   **Data Integrity**: Foreign key constraints and unique indexes on critical IDs.

## 📄 License

Individual/Company license as per AI Studio Build terms.
