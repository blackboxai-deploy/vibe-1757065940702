import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  User as FirebaseUser
} from 'firebase/auth'
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { User } from '../types'

export const createUserDocument = async (firebaseUser: FirebaseUser, additionalData?: any): Promise<User> => {
  if (!firebaseUser) throw new Error('User not found')

  const userRef = doc(db, 'users', firebaseUser.uid)
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    const { displayName, email, phoneNumber, photoURL } = firebaseUser
    const userData: Omit<User, 'uid'> = {
      displayName: displayName || additionalData?.displayName || 'Anonymous User',
      email: email || '',
      phoneNumber: phoneNumber || '',
      photoURL: photoURL || '',
      status: 'Hey there! I am using WhatsApp Clone.',
      lastSeen: serverTimestamp() as Timestamp,
      isOnline: true,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      ...additionalData
    }

    try {
      await setDoc(userRef, userData)
    } catch (error) {
      console.error('Error creating user document:', error)
      throw error
    }
  }

  const userDoc = await getDoc(userRef)
  return { uid: firebaseUser.uid, ...userDoc.data() } as User
}

export const updateUserProfile = async (userId: string, data: Partial<User>) => {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp()
  })
}

export const updateUserPresence = async (userId: string, isOnline: boolean) => {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    isOnline,
    lastSeen: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  
  // Update the Firebase Auth profile
  if (result.user) {
    await firebaseUpdateProfile(result.user, { displayName })
    
    // Create user document in Firestore
    await createUserDocument(result.user, { displayName })
    
    // Set user as online
    await updateUserPresence(result.user.uid, true)
  }
  
  return result
}

export const signInWithEmail = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password)
  
  // Set user as online
  if (result.user) {
    await updateUserPresence(result.user.uid, true)
  }
  
  return result
}

export const signOut = async () => {
  const user = auth.currentUser
  
  // Set user as offline before signing out
  if (user) {
    await updateUserPresence(user.uid, false)
  }
  
  await firebaseSignOut(auth)
}