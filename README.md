# School Management System - Sierra Leone

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/mohamedalphakamara855-8983s-projects/v0-school-management-system)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/nfwpQyuYjLJ)

## Overview

A comprehensive school management system designed for educational institutions in Sierra Leone. The system provides role-based access for principals, teachers, and students with features including:

- **Modern Landing Page** with AI-generated educational quotes
- **School Registration** with automated credential generation
- **Role-Based Dashboards** for Principals, Teachers, and Students
- **Grade Management** with approval workflows
- **Learning Materials** upload and distribution
- **Announcement System** with comments
- **AI Complaint Bot** for student/teacher feedback
- **Email & SMS Notifications** for important events
- **Dark Mode Support** with smooth animations

## Deployment

Your project is live at:

**[https://vercel.com/mohamedalphakamara855-8983s-projects/v0-school-management-system](https://vercel.com/mohamedalphakamara855-8983s-projects/v0-school-management-system)**

## Features

### 🏫 School Registration
- Principals register schools with complete details
- Automatic generation of Principal ID and password
- Instant access to Principal's Portal after registration
- Welcome email and SMS notifications

### 👥 User Management
- Principal registers students and teachers
- Automated ID generation (STU/TCH prefix)
- One-time passwords sent via email/SMS
- Principal approval workflow for student access

### 📚 Academic Management
- Teachers upload learning materials
- Grade submission and approval system
- Student progress tracking
- Performance analytics

### 📢 Communication
- Announcements from teachers and principals
- Student comments on announcements
- Real-time notifications
- AI-powered complaint system

### 🎨 Modern UI/UX
- Responsive design for all devices
- Light/Dark mode with system preference detection
- Smooth Framer Motion animations
- Sierra Leone flag colors (Green & Blue theme)

## Technology Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19.2
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui with Radix UI
- **Animations:** Framer Motion
- **Theme:** next-themes for dark mode
- **Analytics:** Vercel Analytics
- **Deployment:** Vercel

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

\`\`\`bash
# Required for Supabase Database Integration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: SendGrid API for Email Notifications
SENDGRID_API_KEY=your_sendgrid_api_key_here

# Optional: Twilio API for SMS Notifications
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Optional: API Keys for AI Quote Generation
OPENAI_API_KEY=your_openai_api_key_here
\`\`\`

**Note:** The system uses a hybrid approach. If Supabase environment variables are provided, it persists data to PostgreSQL. Otherwise, it falls back to \`localStorage\` for demonstration purposes.

> [!TIP]
> **Windows Users:** If you encounter a "running scripts is disabled on this system" error when running \`npm\`, you may need to run \`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser\` in an Administrator PowerShell.

## Getting Started

### Prerequisites
- Node.js 18+ and npm/pnpm installed
- Git for version control

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/mohamedalphakamara855-web/v0-school-management-system.git
cd v0-school-management-system
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
pnpm install
\`\`\`

3. Create environment variables file:
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Run the development server:
\`\`\`bash
npm run dev
# or
pnpm dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### GET `/api/quotes/random`
Fetches a random AI-generated educational quote.

**Response:**
\`\`\`json
{
  "text": "Education is the most powerful weapon...",
  "author": "Nelson Mandela"
}
\`\`\`

### POST `/api/schools/register`
Registers a new school and generates principal credentials.

**Request Body:**
\`\`\`json
{
  "name": "St. John's High School",
  "type": "government",
  "location": "Freetown",
  "address": "123 Main Street",
  "phone": "+232 XX XXX XXXX",
  "email": "contact@school.edu.sl",
  "principalName": "John Doe"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "...",
    "principalId": "PRIN...",
    "principalPassword": "...",
    "registeredAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "School registered successfully"
}
\`\`\`

### GET `/api/schools/[id]`
Retrieves school information by ID.

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "St. John's High School",
    "type": "government",
    "location": "Freetown"
  }
}
\`\`\`

## Project Structure

\`\`\`
├── app/
│   ├── api/
│   │   ├── quotes/random/route.ts
│   │   └── schools/
│   │       ├── register/route.ts
│   │       └── [id]/route.ts
│   ├── authority/page.tsx       # Principal Dashboard
│   ├── teacher/page.tsx         # Teacher Dashboard
│   ├── student/page.tsx         # Student Dashboard
│   ├── complaint-bot/page.tsx   # AI Complaint System
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── landing-page.tsx
│   ├── login-form.tsx
│   ├── school-registration.tsx
│   ├── dashboard-layout.tsx
│   ├── theme-provider.tsx
│   └── ui/                      # shadcn/ui components
├── lib/
│   └── utils.ts
├── tests/
│   ├── api/
│   │   ├── quotes.test.ts
│   │   └── schools.test.ts
│   └── integration/
│       └── registration-flow.test.ts
└── README.md
\`\`\`

## Testing

Run the test suite:

\`\`\`bash
npm run test
# or
pnpm test
\`\`\`

Run integration tests:

\`\`\`bash
npm run test:integration
# or
pnpm test:integration
\`\`\`

## User Roles

### Principal (School Authority)
- Register and manage school
- Register students and teachers
- Approve student registrations
- Submit and approve grades
- Post announcements
- View all complaints
- Access analytics

### Teacher
- Upload learning materials
- Submit grades (pending principal approval)
- Post announcements
- View student progress
- Submit complaints

### Student
- View grades and report cards
- Access learning materials
- Read and comment on announcements
- Submit complaints
- Track academic progress

## How It Works

### Registration Flow
1. Principal registers school on landing page
2. System generates Principal ID and password
3. Welcome email/SMS sent automatically
4. Principal logs in and registers students/teachers
5. Students/Teachers receive credentials via email/SMS
6. Students require principal approval before accessing portal

### Grade Management
1. Teacher submits grades through dashboard
2. Grades enter "Pending Approval" status
3. Principal reviews and approves grades
4. Students can view approved grades
5. Notifications sent on grade updates

### Announcement System
1. Teacher/Principal posts announcement
2. All students receive notification
3. Students can read and comment
4. Real-time comment updates

## Future Enhancements

- [x] Database integration (Supabase/PostgreSQL)
- [ ] Real SendGrid email integration
- [ ] Real Twilio SMS integration
- [ ] File upload to cloud storage (Vercel Blob)
- [ ] Advanced analytics dashboard
- [ ] Parent portal access
- [ ] Attendance tracking
- [ ] Exam scheduling system
- [ ] Library management
- [ ] Fee payment integration

## Build with v0

Continue building your app on:

**[https://v0.app/chat/nfwpQyuYjLJ](https://v0.app/chat/nfwpQyuYjLJ)**

## Support

For issues and feature requests, please open an issue on GitHub or contact support through the v0 platform.

## License

This project is built with [v0.app](https://v0.app) and deployed on Vercel.
