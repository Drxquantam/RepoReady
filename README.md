# RepoReady

RepoReady is a student-focused project readiness platform that helps developers check whether their project is ready to be shown on GitHub, added to a resume, or deployed publicly.

It is built for students, freshers, and indie developers who often create projects using tools like ChatGPT, Codex, Cursor, or other AI coding assistants, but are unsure whether the final project is clean, secure, deployable, and portfolio-ready.

---

## Problem Statement

Many student projects work locally but are not ready to be shared professionally.

Common issues include:

* Exposed `.env` files or API keys
* Hardcoded `localhost` URLs
* Missing `.env.example` file
* Weak or incomplete README
* No setup or deployment instructions
* Poor resume bullet points
* Large unstructured files
* Missing screenshots or project explanation
* Unclear GitHub presentation

RepoReady solves this by giving a simple cleanup plan that tells the user what is wrong, why it matters, and how to fix it.

---

## Features

* Project readiness dashboard
* Upload project ZIP or scan project data
* GitHub readiness score
* Deployment readiness check
* Security issue detection
* README quality check
* Resume bullet generator
* Project cleanup checklist
* Priority-based issue list
* Simple fix suggestions
* Copy-ready improvement points
* Student-friendly project presentation guidance

---

## Core Idea

RepoReady does not act like an enterprise code review tool.

Instead, it focuses on one clear goal:

> Make student and AI-generated projects GitHub-ready, deployable, and resume-worthy.

The platform converts raw project issues into simple action points such as:

* Remove `.env` from the repository
* Add `.env.example`
* Replace hardcoded localhost URLs
* Add setup instructions in README
* Add screenshots
* Improve resume bullet points
* Fix deployment configuration
* Organize large source files

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* Framer Motion
* Lucide React
* Recharts

### Backend / Server

* Node.js
* Express.js

### Other Tools

* Docker
* YAML deployment configuration
* Environment-based configuration

---

## Folder Structure

```bash
RepoReady/
│
├── docs/
├── infra/
├── server/
├── src/
│
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
├── pnpm-lock.yaml
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## Main Pages

### 1. Dashboard

Shows the overall project readiness status, recent scans, issue summary, and quick actions.

### 2. New Scan

Allows users to upload a project ZIP or provide project information for analysis.

### 3. Cleanup Plan

Shows the main mistakes found in the project and explains how to fix them in simple language.

### 4. README Generator

Generates a professional README structure based on the scanned project details.

### 5. Resume Pack

Creates clean resume bullet points from the project features and tech stack.

### 6. Settings

Contains basic configuration options for export format, theme, and future AI provider setup.

---

## Example Cleanup Issues Detected

RepoReady can detect or display issues such as:

* API key found in frontend code
* `.env` file included in project files
* Localhost URL used in production code
* Missing `.env.example`
* Missing README setup instructions
* Missing deployment guide
* No project screenshots
* Large source file that should be split
* Weak resume bullet points
* Missing project explanation

---

## Resume Pack

The Resume Pack converts project details into professional resume-ready bullet points.

Instead of writing messy points like:

```text
Implemented API workflows around /api/analyze and used multiple dependencies.
```

RepoReady generates cleaner resume bullets like:

```text
• Built a project readiness platform that helps students identify security, deployment, documentation, and portfolio presentation issues.
• Designed a responsive dashboard using React and Tailwind CSS to present project scores, cleanup tasks, and improvement suggestions.
• Implemented project cleanup workflows to generate README content, resume bullets, and fix checklists from scanned project metadata.
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/repoready.git
cd repoready
```

### 2. Install dependencies

```bash
pnpm install
```

Or, if using npm:

```bash
npm install
```

### 3. Create environment file

Create a `.env` file in the root directory.

Use `.env.example` as a reference.

```bash
cp .env.example .env
```

### 4. Start the development server

```bash
pnpm dev
```

Or:

```bash
npm run dev
```

### 5. Open in browser

```text
http://localhost:5174
```

The port may change depending on your Vite configuration.

---

## Environment Variables

Create a `.env` file and add required values.

Example:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Never commit real API keys or secrets to GitHub.

---

## Important Security Note

Do not push `.env` files to GitHub.

Make sure `.env` is added inside `.gitignore`.

Only commit `.env.example`, which should contain placeholder values.

Example:

```env
VITE_API_BASE_URL=your_backend_url_here
API_KEY=your_api_key_here
```

---

## Available Scripts

```bash
pnpm dev
```

Runs the project in development mode.

```bash
pnpm build
```

Builds the project for production.

```bash
pnpm preview
```

Previews the production build locally.

---

## Future Scope

* Real project ZIP scanning
* GitHub repository import
* AI-powered README generation
* AI-powered resume bullet generation
* Deployment readiness automation
* Secret detection engine
* Project score history
* PDF export for cleanup report
* Student portfolio improvement suggestions
* GitHub Actions integration
* Vercel and Render deployment checks

---

## Use Case

RepoReady is useful for:

* BTech students preparing projects for placements
* Freshers improving GitHub profiles
* Students using AI tools to build projects
* Hackathon participants polishing submissions
* Developers preparing projects for deployment
* Beginners who want simple project cleanup guidance

---

## Project Status

This project is currently under development.

The current version focuses on frontend experience, mock project reports, cleanup plans, README generation, and resume pack UI.

Backend scanning and real project analysis will be added in future versions.

---

## Author

Developed by Dhruv Rai.

---

## License

This project is for learning, portfolio, and academic use.
