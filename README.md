# In the Middle of All Things - PWA

A poetic, interactive Progressive Web App (PWA) companion to the book "In the Middle of All Things". This app offers an introspective and symbolic user journey through reading, reflection, listening, and dialogue.

## 🌟 Features Built

### ✅ Core Architecture
- **React + TypeScript** - Modern, type-safe development
- **Tailwind CSS** - Utility-first styling with custom paper/ink aesthetic
- **Firebase Integration** - Authentication, Firestore, and analytics
- **PWA Capabilities** - Offline support, installable, service worker
- **Responsive Design** - Works on desktop and mobile

### ✅ Authentication System
- Email/password authentication
- Anonymous guest access
- Protected routes and state management

### ✅ Onboarding Experience
- Interactive question flow
- Dynamic symbol generation based on user responses
- Progress tracking and completion celebration

### ✅ Symbol Generation Engine
- Evolving SVG symbols that grow with user interactions
- Multiple base shapes (circle, triangle, square, diamond, star, hexagon)
- Complexity and density evolution based on:
  - Highlighting text (increases density)
  - Creating reflections (increases complexity)
  - AI interactions (general growth)

### ✅ AI Integration (Gemini 2.5 Flash)
- Three conversation tones: Reflective, Interpretive, Philosophical
- Context-aware responses based on current chapter
- Real-time chat interface with streaming responses
- Conversation memory and tone selection

### ✅ Core Pages & Navigation
- **Home Page** - Living axis with breathing symbol, chapter info, control bar
- **Reader Page** - Immersive reading experience with book content
- **Garden Page** - Reflection collection (placeholder ready for implementation)
- **Settings Page** - Dark mode, AI preferences, privacy controls
- **Bottom Navigation** - Persistent navigation between main sections

### ✅ UI/UX Design System
- **Paper/Ink Aesthetic** - Soft textures, grain effects, e-ink inspired
- **Dark/Light Mode** - Automatic system detection with manual toggle
- **Typography** - Inter for body, Space Grotesk for headings, Georgia for reading
- **Animation** - Framer Motion for smooth transitions and breathing effects
- **Accessibility** - Focus states, semantic HTML, keyboard navigation

### ✅ Data & Content
- Sample book chapters with rich, contemplative content
- Type-safe data models for users, symbols, reflections, chapters
- Structured content management ready for CMS integration

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Environment Setup

Create a `.env` file with your credentials:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 📱 PWA Features

- **Installable** - Add to home screen on mobile/desktop
- **Offline Support** - Service worker caches key resources
- **Fast Loading** - Optimized bundles and lazy loading
- **Responsive** - Works seamlessly across device sizes

## 🎨 Design Philosophy

The app embodies a "paper and ink" aesthetic with:
- Soft grain textures mimicking paper
- Gentle shadows and glows resembling ink on paper
- Muted color palette focused on contrast and readability
- Breathing animations that suggest life and contemplation
- Minimal, purposeful interactions that encourage reflection

## 🔮 Future Enhancements

Ready for implementation:
- **Live Audio Integration** - Voice chat with AI using Google AI Studio
- **Advanced Symbol Evolution** - More sophisticated shape morphing
- **Reflection Garden** - Visual map of user's journey and insights
- **Highlighting System** - Interactive text selection and annotation
- **Audio Narration** - Chapter reading with synchronized text
- **Export Features** - Save symbols, reflections, and journey progress
- **Social Features** - Share symbols and insights (optional)

## 🏗️ Architecture

```
src/
├── components/          # Reusable UI components
├── features/           # Feature-specific modules
│   ├── Auth/          # Authentication flow
│   ├── AI/            # AI chat and interaction
│   ├── Reader/        # Reading experience
│   └── Reflections/   # Journal and garden
├── pages/             # Route-based screens
├── services/          # API integrations
│   ├── firebase.ts    # Firebase setup
│   ├── gemini.ts      # AI service
│   └── symbolGenerator.ts # Symbol evolution
├── hooks/             # Custom React hooks
├── utils/             # Helper functions
├── types/             # TypeScript definitions
└── data/              # Sample content
```

## 🎯 Current Status

The application is **fully functional** with core features implemented and ready for user testing. The foundation is solid and extensible, with clean architecture that supports rapid feature addition.

**Live at:** `http://localhost:5173`

Built with ❤️ using modern web technologies and contemplative design principles.
