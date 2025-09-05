import { Timestamp } from 'firebase/firestore'

export interface User {
  uid: string
  email?: string
  phoneNumber?: string
  displayName: string
  photoURL?: string
  status?: string
  lastSeen: Timestamp
  isOnline: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  senderName: string
  senderPhotoURL?: string
  content: string
  type: 'text' | 'image' | 'file' | 'audio'
  fileURL?: string
  fileName?: string
  fileSize?: number
  timestamp: Timestamp
  status: 'sending' | 'sent' | 'delivered' | 'read'
  replyTo?: string
  editedAt?: Timestamp
  reactions?: { [userId: string]: string }
}

export interface Chat {
  id: string
  type: 'private' | 'group'
  participants: string[]
  participantsData?: { [userId: string]: Partial<User> }
  lastMessage?: {
    content: string
    senderId: string
    senderName: string
    timestamp: Timestamp
    type: string
  }
  unreadCount?: { [userId: string]: number }
  createdAt: Timestamp
  updatedAt: Timestamp
  
  // Group chat specific
  name?: string
  description?: string
  photoURL?: string
  admins?: string[]
  createdBy?: string
  
  // Private chat specific
  blockedBy?: string[]
  
  // Settings
  isMuted?: { [userId: string]: boolean }
  isArchived?: { [userId: string]: boolean }
}

export interface Contact {
  uid: string
  displayName: string
  photoURL?: string
  phoneNumber?: string
  email?: string
  status?: string
  isBlocked?: boolean
  addedAt: Timestamp
}

export interface TypingStatus {
  userId: string
  userName: string
  chatId: string
  isTyping: boolean
  timestamp: Timestamp
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithPhone: (phoneNumber: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

export interface ChatContextType {
  chats: Chat[]
  activeChat: Chat | null
  messages: Message[]
  contacts: Contact[]
  loading: boolean
  setActiveChat: (chat: Chat | null) => void
  sendMessage: (content: string, type?: Message['type'], fileData?: any) => Promise<void>
  createChat: (participantIds: string[], type: Chat['type'], name?: string) => Promise<string>
  markMessageAsRead: (messageId: string) => Promise<void>
  setTyping: (isTyping: boolean) => void
  addContact: (phoneNumber: string) => Promise<void>
  blockContact: (userId: string) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  archiveChat: (chatId: string, isArchived: boolean) => Promise<void>
  muteChat: (chatId: string, isMuted: boolean) => Promise<void>
}