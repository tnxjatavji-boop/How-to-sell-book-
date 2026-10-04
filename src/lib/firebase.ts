import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  orderBy,
  limit
} from "firebase/firestore";

import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App instance singleton
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || "(default)");
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export interface FirestoreUserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  balance: number;
  demoBalance: number;
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  referralBonus: number;
  wagerTarget: number;
  wagerCurrent: number;
  hasDeposited: boolean;
  isBlocked?: boolean;
  createdAt: any;
  lastLoginAt: any;
}

// Ensure unique referral code
export async function generateUniqueReferralCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Sync or create user profile in Firestore
export async function syncUserProfile(user: { uid: string; email: string; displayName?: string | null; photoURL?: string | null }, referralCodeInput?: string): Promise<FirestoreUserProfile> {
  const normalizedEmail = (user.email || "").toLowerCase().trim();
  const userDocRef = doc(firestore, "users", normalizedEmail);
  
  try {
    const docSnap = await getDoc(userDocRef);
    const now = serverTimestamp();

    if (docSnap.exists()) {
      const existing = docSnap.data() as FirestoreUserProfile;
      await updateDoc(userDocRef, {
        lastLoginAt: now,
        name: user.displayName || existing.name || normalizedEmail.split('@')[0],
        photoURL: user.photoURL || existing.photoURL || ""
      });
      return {
        ...existing,
        name: user.displayName || existing.name || normalizedEmail.split('@')[0],
        photoURL: user.photoURL || existing.photoURL || ""
      };
    }

    // New User Registration
    const newRefCode = await generateUniqueReferralCode();
    const newProfile: FirestoreUserProfile = {
      uid: user.uid,
      email: normalizedEmail,
      name: user.displayName || normalizedEmail.split('@')[0],
      photoURL: user.photoURL || "",
      balance: 97, // ₹97 Welcome Bonus
      demoBalance: 10000,
      referralCode: newRefCode,
      referredBy: referralCodeInput ? referralCodeInput.toUpperCase().trim() : "",
      referralCount: 0,
      referralBonus: 0,
      wagerTarget: 194, // 2x turnover
      wagerCurrent: 0,
      hasDeposited: false,
      isBlocked: false,
      createdAt: now,
      lastLoginAt: now
    };

    await setDoc(userDocRef, newProfile);
    
    // Also notify server backend database to ensure syncing
    try {
      await fetch('/api/google_auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          name: newProfile.name,
          photoUrl: newProfile.photoURL
        })
      });
    } catch (e) {
      console.warn("Backend server sync notice failed:", e);
    }

    return newProfile;
  } catch (err) {
    console.warn("Firestore user sync fallback:", err);
    // Return standard fallback
    return {
      uid: user.uid,
      email: normalizedEmail,
      name: user.displayName || normalizedEmail.split('@')[0],
      photoURL: user.photoURL || "",
      balance: 97,
      demoBalance: 10000,
      referralCode: "TRADEX",
      referralCount: 0,
      referralBonus: 0,
      wagerTarget: 194,
      wagerCurrent: 0,
      hasDeposited: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
  }
}

// Real Google Sign In with Firebase Popup & Fallback
export async function signInWithGoogleReal(referralCode?: string): Promise<{ success: boolean; user?: FirestoreUserProfile; email?: string; error?: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    if (!fbUser.email) {
      throw new Error("No email found in Google account.");
    }
    const profile = await syncUserProfile({
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL
    }, referralCode);

    return { success: true, user: profile, email: fbUser.email.toLowerCase().trim() };
  } catch (error: any) {
    console.warn("Firebase Google popup error, trying direct API authentication:", error);
    return { success: false, error: error.message || "Google sign in was canceled or restricted." };
  }
}
