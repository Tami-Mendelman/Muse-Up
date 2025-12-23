MuseUp
MuseUp is a full-stack social platform for artists, built to support artwork sharing, creator interaction, AI-powered feedback, and real-time communication.
This repository contains the complete source code for the MuseUp application and is structured according to modern, production-grade web development standards.
Repository Purpose
This GitHub repository serves as:
The primary source of truth for the MuseUp codebase
A portfolio-quality demonstration of full-stack development skills
A final graduation project showcasing real-world architecture and tooling
Live Demo
The application is deployed and publicly accessible at:
https://www.museup.blog/
Features
Firebase-based authentication (Google and Email providers)
Artwork publishing with image uploads, tags, and categories
Social interactions: likes, comments, saved collections
AI-powered art critique system
Real-time private messaging using Socket.IO
Artist profiles with follower and content management
Fully responsive layout for desktop and mobile
Tech StackFrontend
Next.js 16 (App Router)
React with TypeScript
React Query (server state)
Zustand (client state)
CSS Modules
Backend
Next.js API Routes
MongoDB with Mongoose
Firebase Authentication
Cloudinary (media storage)
Socket.IO (real-time messaging, separate server)
Deployment
Vercel (frontend and API)
Render (Socket.IO server)
Environment variable–based configuration
Project Structure
src/
 ├─ app/            # Pages, layouts, and API routes
 ├─ components/     # Reusable UI components
 ├─ hooks/          # Custom React hooks
 ├─ models/         # Mongoose schemas
 ├─ services/       # Client-side API services
 ├─ lib/            # Auth, Firebase config, utilities
 └─ styles/         # Global styles and CSS modules
Getting StartedPrerequisites
Node.js (LTS)
npm
Installation
npm install
Development Server
npm run dev
The application will run at http://localhost:3000.
Environment Variables
Create a .env.local file in the project root:
MONGODB_URI=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_SITE_URL=
Do not commit environment files to the repository.
Scripts
npm run dev       # Run development server
npm run build     # Build for production
npm run start     # Start production server
Project Status
The project is in advanced development. All core features are implemented, and the codebase is stable and extensible.
Future Work
Community challenges and events
Advanced search and discovery
Notification system
Administrative dashboard
