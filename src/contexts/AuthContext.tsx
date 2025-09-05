'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { createUserDocument, signUpWithEmail, signInWithEmail, signOut, updateUserPresence } from '../lib/auth'
import { User, AuthContextType } from '../types'
import toast from 'react-hot-toast'

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Create or get user document from Firestore
          const userDoc = await createUserDocument(firebaseUser)
          setUser(userDoc)
          
          // Set up real-time listener for user data
          const userDocRef = doc(db, 'users', firebaseUser.uid)
          const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              setUser({ uid: firebaseUser.uid, ...doc.data() } as User)
            }
          })

          // Set user as online
          await updateUserPresence(firebaseUser.uid, true)
          
          // Return cleanup function
          return unsubscribeUser
        } catch (error) {
          console.error('Error setting up user:', error)
          toast.error('Failed to load user data')
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Set user offline when tab is closed or app is minimized
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        updateUserPresence(user.uid, false)
      }
    }

    const handleVisibilityChange = () => {
      if (user) {
        updateUserPresence(user.uid, !document.hidden)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  const signInWithPhone = async (phoneNumber: string) => {
    // This would typically involve Firebase phone authentication
    // For now, we'll show a toast that it's not implemented
    toast.error('Phone authentication not implemented yet. Please use email/password.')
    throw new Error('Phone authentication not implemented')
  }

  const handleSignInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true)
      await signInWithEmail(email, password)
      toast.success('Signed in successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true)
      await signUpWithEmail(email, password, displayName)
      toast.success('Account created successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out')
      throw error
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    if (!user) throw new Error('No user logged in')
    
    try {
      const { updateUserProfile } = await import('../lib/auth')
      await updateUserProfile(user.uid, data)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
      throw error
    }
  }

  const contextValue: AuthContextType = {
    user,
    loading,
    signInWithPhone,
    signInWithEmail: handleSignInWithEmail,
    signUp,
    signOut: handleSignOut,
    updateProfile
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}