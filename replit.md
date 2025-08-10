# Overview

This is an AI English Tutor application that provides personalized, interactive English conversation practice. The platform allows users to create custom AI tutors with generated character images and practice conversations through different learning scenarios. It's designed as a progressive learning experience with three target audiences: middle/high school students, college/general learners, and business professionals.

# User Preferences

Preferred communication style: Simple, everyday language.

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
2. **Character Creation**: Form-based character definition (name, gender, style) with AI image generation
3. **Scenario Selection**: Preset scenarios per audience or custom text input
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