import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, Auth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let provider: GoogleAuthProvider | null = null;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/spreadsheets');
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  provider.setCustomParameters({ prompt: 'select_account' });
} catch (err) {
  console.warn('Firebase initialization in auth.ts warning/error:', err);
}

export { auth };

const TOKEN_STORAGE_KEY = 'sashas_google_access_token';
const TOKEN_EXPIRY_KEY = 'sashas_google_token_expiry';

let inMemoryAccessToken: string | null = null;

export const getStoredAccessToken = (): string | null => {
  if (inMemoryAccessToken) {
    return inMemoryAccessToken;
  }
  try {
    const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    const storedExpiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    if (storedToken && storedExpiry) {
      const expiry = parseInt(storedExpiry, 10);
      // Ensure token hasn't expired (leave 2 minute safety margin)
      if (Date.now() < expiry - 120000) {
        inMemoryAccessToken = storedToken;
        return storedToken;
      } else {
        // Expired
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
      }
    }
  } catch (e) {
    console.warn('Session storage read failed:', e);
  }
  return null;
};

export const setStoredAccessToken = (token: string, expiresInSeconds: number = 3600) => {
  inMemoryAccessToken = token;
  try {
    const expiryTime = Date.now() + expiresInSeconds * 1000;
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  } catch (e) {
    console.warn('Session storage write failed:', e);
  }
};

export const clearStoredAccessToken = () => {
  inMemoryAccessToken = null;
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch (e) {
    console.warn('Session storage clear failed:', e);
  }
};

export const getCurrentUser = (): User | null => {
  try {
    return auth?.currentUser || null;
  } catch {
    return null;
  }
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthRequired?: (user: User | null) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
  try {
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        const token = getStoredAccessToken();
        if (token) {
          if (onAuthSuccess) onAuthSuccess(user, token);
        } else {
          // User logged into Firebase, but Google Workspace token needed
          if (onAuthRequired) onAuthRequired(user);
          else if (onAuthFailure) onAuthFailure();
        }
      } else {
        clearStoredAccessToken();
        if (onAuthFailure) onAuthFailure();
      }
    });
  } catch (err) {
    console.warn('onAuthStateChanged error in auth.ts:', err);
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  if (!auth || !provider) {
    throw new Error('Google Authentication services could not be initialized in this browser environment.');
  }
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google did not return an access token. Please ensure your Google account grants spreadsheet permissions.');
    }

    setStoredAccessToken(credential.accessToken, 3600);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw error;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return getStoredAccessToken();
};

export const logout = async () => {
  clearStoredAccessToken();
  if (auth) {
    try {
      await auth.signOut();
    } catch (e) {
      console.warn('Error during signOut:', e);
    }
  }
};
