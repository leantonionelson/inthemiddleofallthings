# In the Middle of All Things

An interactive book reader application with AI-powered audio synthesis, featuring a beautiful paper texture design and seamless reading experience.

## 🌟 Features

### 📖 Interactive Reading Experience
- **Chapter Navigation**: Smooth progression through book chapters
- **Text Highlighting**: Real-time highlighting as audio plays
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark/Light Mode**: Automatic system theme detection

### 🎧 AI Audio Synthesis
- **Gemini TTS Integration**: High-quality text-to-speech using Google's Gemini API
- **Browser Fallback**: Seamless fallback to browser speech synthesis when API quota is exceeded
- **Auto-Play & Auto-Advance**: Automatic chapter progression
- **Audio Controls**: Play/pause, speed control, mute functionality
- **Persistent Caching**: Audio files cached locally for offline access

### 🎨 Beautiful Design
- **Paper Texture**: Authentic paper grain texture for both light and dark modes
- **Consistent Theming**: Unified color scheme across all components
- **Smooth Animations**: Framer Motion powered transitions
- **Glassmorphism Effects**: Modern backdrop blur and transparency

### 🤖 AI Integration
- **AI Chat**: Contextual AI assistance with specialized personas
- **Smart Suggestions**: Page-specific question recommendations
- **Multiple Personas**: Early Careers, Tech Talent, Diversity, Experienced Hire, Executive Leadership, Remote & Global

### 📱 User Experience
- **Onboarding Flow**: Guided setup for new users
- **Progress Tracking**: Save reading progress across sessions
- **Reflection Garden**: Personal insights and highlights collection
- **Settings Management**: Customizable preferences

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key (for TTS features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/leantonionelson/inthemiddleofallthings.git
   cd inthemiddleofallthings
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Add your Gemini API key to `.env`:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation

### Audio & AI
- **Google Gemini API** for text-to-speech
- **Web Speech API** for browser fallback
- **IndexedDB** for audio caching
- **localStorage** for user preferences

### Design System
- **Custom Paper Texture**: Multi-layered grain patterns
- **HeroUI Components**: Modern UI components
- **Responsive Grid**: Mobile-first design approach

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AudioControlStrip.tsx    # Audio player controls
│   ├── StandardHeader.tsx       # App header
│   ├── StandardNavigation.tsx   # Bottom navigation
│   └── ReaderNavigation.tsx     # Reader-specific controls
├── features/            # Feature-specific components
│   ├── AI/             # AI chat functionality
│   ├── Auth/           # Authentication
│   ├── Reader/         # Reading interface
│   └── Reflections/    # Reflection garden
├── services/           # API and utility services
│   ├── geminiTTS.ts    # Text-to-speech service
│   ├── firebase.ts     # Firebase integration
│   └── symbolGenerator.ts # Symbol generation
├── book/               # Book content (MDX files)
└── types/              # TypeScript type definitions
```

## 🎯 Key Features Explained

### Paper Texture Design
The app features an authentic paper texture that adapts to light and dark modes:
- **Multi-layered grain**: Three different grain patterns for depth
- **Dynamic opacity**: Adjusts based on theme
- **Performance optimized**: CSS-only implementation

### Audio System
Robust audio system with multiple fallback options:
1. **Primary**: Gemini TTS API (high quality)
2. **Fallback**: Browser Speech Synthesis (when API quota exceeded)
3. **Caching**: IndexedDB for persistent storage
4. **Error Handling**: Graceful degradation

### Text Highlighting
Real-time text highlighting synchronized with audio:
- **Word-level tracking**: For Gemini TTS
- **Progressive highlighting**: For browser speech
- **Markdown support**: Handles formatted text correctly

## 🔧 Configuration

### Environment Variables
- `VITE_GEMINI_API_KEY`: Google Gemini API key
- `VITE_FIREBASE_CONFIG`: Firebase configuration (optional)

### Customization
- **Colors**: Modify `tailwind.config.js` for theme colors
- **Paper Texture**: Adjust grain patterns in `src/index.css`
- **Audio Settings**: Configure TTS parameters in `src/services/geminiTTS.ts`

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini API** for advanced text-to-speech capabilities
- **Tailwind CSS** for the utility-first CSS framework
- **Framer Motion** for smooth animations
- **React Community** for the excellent ecosystem

## 📞 Support

For support, email support@inthemiddleofallthings.com or create an issue in this repository.

---

**In the Middle of All Things** - Where reading meets technology, and every word comes to life. 📚✨
