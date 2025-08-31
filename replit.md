# Overview

This is an AI English Tutor application that provides personalized, interactive English conversation practice. The platform allows users to create custom AI tutors with generated character images and practice conversations through different learning scenarios. It's designed as a progressive learning experience with three target audiences: middle/high school students, college/general learners, and business professionals.

## Recent Updates (August 2025)
- ✅ **Complete Voice Chat Redesign**: Rebuilt playground as natural conversation app with WhatsApp-style chat interface
- ✅ **Character First Greeting**: Tutor automatically introduces themselves and starts conversation on page load
- ✅ **Real-time Voice Chat**: Seamless speech recognition → character response → TTS audio playbook flow
- ✅ **Natural Conversation Flow**: Messages display in chat bubbles with audio playback and accuracy scores
- ✅ **Advanced TTS System**: Multi-tier fallback (OpenAI → Supertone → Browser TTS) for reliable audio
- ✅ **Cost-Effective Audio**: OpenAI TTS integration ($15/1M chars) with character-specific voice selection
- ✅ **Error Recovery**: Robust error handling with fallback responses for failed API calls
- ✅ **Authentication System**: Custom email/password + Google OAuth (no Replit Auth)
- ✅ **Browser Compatibility**: Fixed React Context, useRef, and module loading errors
- ✅ **App Successfully Running**: Login page functional, Google OAuth integration working
- ✅ **Landing Page Restored**: Original landing page with pricing plans and "무료로 시작하기" button
- ✅ **Navigation Flow**: Landing → Auth → Home with proper back navigation
- ✅ **Error Resolution**: Fixed all PWA, CSP, and MIME type browser errors (August 30, 2025)
- ✅ **Authentication Fix**: Resolved 401 errors by adding /api/user endpoint and proper session handling
- ✅ **PWA Implementation**: Added proper beforeinstallprompt event handling for app installation
- ✅ **Pricing Strategy**: Finalized pricing structure - Starter ₩4,900, Pro ₩9,900, Premium ₩19,900 with 135%+ margins
- ✅ **Cost Analysis**: Detailed API cost breakdown with realistic usage limits ensuring profitability
- ✅ **Google OAuth Fix**: Configured proper redirect URIs in Google Cloud Console for Replit domains
- ✅ **PWA Error Resolution**: Completely removed PWA-related errors by deleting pwa-install.js.bak file and implementing comprehensive error blocking system
- ✅ **Browser Console Clean**: No more F5 refresh needed, app loads cleanly without console errors
- ✅ **Login System Recovery**: Fixed comparePasswords function with proper error handling and logging (August 30, 2025)
- ✅ **SB Module System**: Created comprehensive modular architecture for rapid app development and code reuse
- ✅ **Template & Framework Setup**: Prepared for GitHub backup, Developer Framework publishing, and Public Remix functionality
- ✅ **GitHub Backup Complete**: Successfully uploaded complete codebase with SB modules to GitHub repository
- ✅ **Ready for Framework Publishing**: All documentation and setup files prepared for Replit Developer Framework
- 🔧 **세션 생성 문제 해결**: saveUninitialized: true 설정 및 강제 세션 생성 로직 추가 (August 31, 2025)

# User Preferences

Preferred communication style: Simple, everyday language.

## Development Guidelines (Critical)
- **NEVER break existing authentication/core systems when adding new features**
- **Always test incrementally** - make small changes and verify they work before proceeding
- **Preserve working functionality** - if something works, don't touch it unless absolutely necessary
- **Document and backup** - before major changes, ensure rollback is possible
- User is frustrated with repeated system breakdowns during feature development

# System Architecture

## Frontend Architecture
- **React 18 + Vite**: Modern development setup with TypeScript for type safety
- **State Management**: Zustand for lightweight, centralized application state
- **Routing**: Wouter for minimal client-side routing
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with custom themes for different audience segments (pastel for students, cozy for general, deep blue for business)

## Backend Architecture
- **Express.js**: RESTful API server with TypeScript
- **Validation**: Zod schemas for runtime type checking and API request validation
- **Storage**: In-memory storage implementation with interface for future database integration
- **Session Management**: Basic session handling for user learning progress

## Data Architecture
- **Database**: Configured for PostgreSQL with Drizzle ORM
- **Schema Design**: 
  - Users table for authentication
  - Sessions table storing learning progress, character data, scenarios, and generated content
  - JSONB fields for flexible character and scenario data storage

## Application Flow
1. **Audience Selection**: Three-tier system (student/general/business) with different themes and scenarios
2. **Scenario Selection**: Preset scenarios per audience or custom text input
3. **Character Creation**: Form-based character definition (name, gender, style) with AI image generation
4. **Playground**: Interactive learning environment with AI-generated dialogue and TTS audio

## External Dependencies

- **OpenAI GPT-4o**: Conversational dialogue generation using the latest model
- **OpenAI DALL-E 3**: Character image generation with customized prompts
- **Supertone**: High-quality text-to-speech with voice mapping for different character styles
- **Neon Database**: Serverless PostgreSQL database provider
- **Font Awesome**: Icon library for UI elements
- **Google Fonts**: Inter and Poppins font families for typography

## API Integration Strategy
- RESTful endpoints for AI service integration (`/api/generate-image`, `/api/generate-dialogue`, `/api/tts`)
- Error handling and loading states for external API calls
- Base64 audio encoding for TTS responses (production would use cloud storage)
- Configurable API keys through environment variables with fallback options

## Development Considerations
- Monorepo structure with shared types and schemas
- Development vs production environment handling
- Cost-aware API usage with proper error boundaries
- Mobile-responsive design with audience-specific theming
- Progressive enhancement from basic form interactions to AI-powered features