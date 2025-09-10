Here’s a refined version of your project README or planning document with the Loom iframe embedded properly and some formatting improvements for clarity and presentation:

---

# 🧑‍🏫 Ustadh — AI-powered LMS

<p align="center">
  <img src="./App.png" alt="Ustadh App Preview" width="600"/>
</p>

---

## 🔁 Sprint Notes (11/05)

* **Implement course generator**
* **Add preview & export for course sessions**
* **Fix file uploads and finalize chat/session tools**
* **Reduce complexity**
* **Fix endpoint errors**

---

## 🔄 Changelog

* ✅ Switched from `await fetch` to `useSWR`
* ✅ Added CAPTCHA to auth and all unauthenticated forms
* ✅ Started building the blog

---

## 📹 Loom Preview

---

## 🚧 Roadmap

### ✅ Core Features

* CAPTCHA in auth
* Amazigh language support (i18n)
* Block student browsing during exams
* Redirect logged-in users from landing → dashboard
* Schedule management via image → JSON or manual input
* CSRF protection
* Store JWT in httpOnly cookie

### 🏫 School Onboarding

* Role-based UI & navigation
* Update user via `AuthProvider`
* Analytics tables
* Community + messaging services
* Tutoring with **Ibn Battuta** branding
* Admin & Professor dashboard features

### ✨ User Features

* Real-time notes (WebSocket)
* EditorJS for note-taking
* Prompt templates by education level
* Quizzes
* “Report a Bug” sidebar link
* Student performance analysis & suggestions

---

## 📅 Sprint (19/04 → 26/04)

* Finalize community + tutoring
* Admin/Professor UI enhancements
* Implement AI RAG data layer
* Upload curated Moroccan school data

---

## 🔄 Sync Feature

* **Synchronize avec l’école**: Fetch updated schedules

---

## 💬 Messaging Logic

* Students see only relevant teachers
* Admins & Professors can message all users

---

## 🛠 Deployment Strategy

### Stack Overview

| Component   | Tech                            |
| ----------- | ------------------------------- |
| Backend     | FastAPI (Cloud Run)             |
| Clients     | React Native / Next.js (Vercel) |
| Database    | Neon (PostgreSQL)               |
| Cache/Queue | Upstash Redis                   |
| Worker      | Celery (Cloud Run Jobs)         |
| Email       | SendGrid / Mailgun              |
| Storage     | GCP Cloud Storage (optional)    |

### Steps

1. **Backend**: Dockerize + deploy to Cloud Run
2. **Frontend**: Web (Vercel/Cloud Run), Mobile (HTTPS)
3. **Database**: Neon w/ pooling + GCP Secrets
4. **Worker**: Celery job via Cloud Run
5. **Email**: Triggered via GCP Function or Pub/Sub
6. **Secrets**: All stored in GCP Secret Manager

---

## 📊 Monitoring & Budget

* Cloud Monitoring & Logging
* Alerts: errors, cost, Redis usage
* Free tiers for most services
* **Target**: \~\$20–40/month (up to 5,000 users)

---

## 🔮 Coming in May

* Launch **AgentX** (AI-first features)
* Complete UI overhaul
* Refactor `int` IDs → UUIDs
* Add modern floating header

---

Would you like this content exported to a Markdown file or used in a GitHub README?
