# ustadh

## Add Captcha in auth
## Add amazigh language to i18n
# Block student from browsing when on an exam
## Schedule, allow user to either upload image of schedule to JSON, or manually enter
## if usr goes to landing page, and if user is logged in, redirect to dashboard

## Implement school onboarding + role-based UI
## Implement updateuser on AuthProvider
## add analytics tables
## Integrate websockets for real-time updates in notes
## Have specific chat prompt templates based on user class (primaire -> uni)
## use editorjs for notes
## Implement CSRF
## Store JWT in httpOnly cookie, not localStorage.

## Sprint: 19/04 --> 26/04
### Implement Community services + messaging
### Finalize tutoring services
### Implement solid admin/professor page, especially professor
### Build AI Data Layer for RAG
### Scrape, curate and upload school data for morocco
## Add report bug to sidebar
## Attach Ibn battuta name to tutoring service

# 🚀 Initial Deployment Strategy for SaaS (MVP)

## 🧱 Stack Overview
- **Backend**: FastAPI (Cloud Run)
- **Mobile/Web Clients**: React Native / Next.js (Vercel or Firebase)
- **Database**: Neon (PostgreSQL)
- **Cache/Queue**: Upstash Redis
- **Worker**: Celery (Cloud Run Jobs)
- **Emails**: SendGrid or Mailgun (triggered via Cloud Function)
- **Storage**: Cloud Storage (if needed)

---

## 🛠 Deployment Steps

### 1. 🚀 FastAPI Backend
- Containerize with Docker
- Deploy to Cloud Run with min-instances=0
- Use environment variables from Secret Manager

### 2. 📱 Web/Mobile Clients
- Web: Deploy Next.js to Vercel or Cloud Run
- Mobile: Connect to backend API via HTTPS

### 3. 🧠 Database
- Create Neon project
- Set up connection pooling
- Store DB URL in secrets

### 4. ⚙️ Celery Worker
- Containerize worker
- Deploy as Cloud Run Job (manual or scheduled)
- Use Upstash Redis as broker

### 5. ✉️ Email Function
- Deploy Cloud Function (Python or Node.js)
- Trigger on API or Pub/Sub
- Use SendGrid/Mailgun API key

### 6. 🔐 Secrets & Config
- Use GCP Secret Manager
- Store DB URL, Redis URL, API keys securely

---

## 🧪 Monitoring & Cost Control
- Enable basic Cloud Monitoring + Logging
- Set alert on error rate, cost budget, and Redis usage
- Use GCP free tiers + Upstash + Neon (free plans)

---

## ✅ MVP Ready
- Scales to ~5K users
- Low cost (~$20–40/month)
- Easy to iterate & extend

## Synchronize avec l ecole button just fetches any new update to schedule
## Add feature to professor section: analyze students' performance and weaknesses and into suggestions
## Think of int --> uuid

### May
Build major AI functionalities and bulk of users interface to present AgentX.
### modify header to be that floating cool header
### Add quizzes
