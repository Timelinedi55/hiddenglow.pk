# Hidden Glow — Agent Team

This project uses custom Copilot agents organized as a development team. The **Project Manager** coordinates all sub-agents.

## Team Overview

| Agent | File | Role | Tools |
|-------|------|------|-------|
| **Project Manager** | `project-manager.agent.md` | Orchestrates work, plans sprints, delegates to specialists, manages deployments | All + sub-agents |
| **Content Writer** | `content-writer.agent.md` | Product descriptions, CMS pages, brand voice, copywriting | read, edit, search |
| **SEO Specialist** | `seo-specialist.agent.md` | Meta tags, structured data, sitemap, Open Graph, search ranking | read, edit, search, web |
| **UI/UX Designer** | `ui-ux-designer.agent.md` | Responsive design, conversion optimization, color/branding, layouts | read, edit, search, web |
| **QA Tester** | `qa-tester.agent.md` | Functional testing, accessibility, cross-browser, validation | read, search, execute, web |
| **Performance Engineer** | `performance-engineer.agent.md` | Core Web Vitals, bundle size, caching, image optimization | read, edit, search, execute |
| **Frontend Developer** | `frontend-developer.agent.md` | Next.js components, React, Tailwind, TypeScript, state management | read, edit, search, execute |
| **Backend Developer** | `backend-developer.agent.md` | NestJS API, TypeORM, database, DTOs, authentication | read, edit, search, execute |

## Agent Memory

Each agent has a persistent memory file in `.github/agents/memories/` that tracks:
- Decisions made and rationale
- Known issues and fixes
- Domain-specific knowledge accumulated during work
- Audit/test history

## Usage

### Direct Invocation
Select any agent from the agent picker in VS Code Chat to work with that specialist directly.

### Via Project Manager
Use the **Project Manager** agent for multi-step work — it will plan tasks and delegate to the right specialists automatically.

### Example Prompts

| Prompt | Agent Used |
|--------|-----------|
| "Update product descriptions for the new collection" | Content Writer |
| "Add structured data to product pages" | SEO Specialist |
| "Make the product page mobile-responsive" | UI/UX Designer |
| "Run a full QA audit of the storefront" | QA Tester |
| "Reduce the homepage load time" | Performance Engineer |
| "Add a wishlist feature to the frontend" | Frontend Developer |
| "Create an API endpoint for coupons" | Backend Developer |
| "Plan and execute the new branding update" | Project Manager (delegates to UI/UX + Frontend + QA) |
