// Offline Firebase Service (Demo Mode)
// This service provides dummy implementations of Firebase functionality
// for demo purposes when Firebase is not available or configured

console.log('🔧 Firebase service running in offline demo mode');

// Dummy Firebase Auth implementation
export const auth = {
  currentUser: null,
  signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
  createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
  signInAnonymously: () => Promise.reject(new Error('Firebase not configured')),
  signOut: () => Promise.resolve(),
  onAuthStateChanged: () => () => {} // Return unsubscribe function
};

// Dummy Firestore implementation
export const db = {
  collection: () => ({
    doc: () => ({
      set: () => Promise.resolve(),
      get: () => Promise.resolve({ exists: false, data: () => null }),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve()
    }),
    add: () => Promise.resolve({ id: 'demo-id' }),
    where: () => ({
      get: () => Promise.resolve({ docs: [] })
    })
  })
};

// Dummy storage implementation
export const storage = {
  ref: () => ({
    put: () => Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve('demo-url') } })
  })
};

// Helper function to check if Firebase is available
export const isFirebaseAvailable = () => false;

// Demo user for offline mode
export const createDemoUser = () => ({
  uid: 'demo-user',
  name: 'Demo User',
  email: 'demo@example.com',
  onboardingResponses: [],
  selectedAIPersona: 'sage' as const,
  createdAt: new Date(),
  lastActive: new Date()
});

export default { auth, db, storage, isFirebaseAvailable, createDemoUser }; 