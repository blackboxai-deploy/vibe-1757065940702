import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './firebase'
import { Chat, Message, Contact, User } from '../types'
import { v4 as uuidv4 } from 'uuid'

// Chat operations
export const createChat = async (
  participants: string[],
  type: 'private' | 'group',
  currentUserId: string,
  name?: string,
  description?: string
): Promise<string> => {
  const chatData: Omit<Chat, 'id'> = {
    type,
    participants,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
    ...(type === 'group' && {
      name: name || 'New Group',
      description: description || '',
      admins: [currentUserId],
      createdBy: currentUserId
    })
  }

  const chatRef = await addDoc(collection(db, 'chats'), chatData)
  return chatRef.id
}

export const getChatById = async (chatId: string): Promise<Chat | null> => {
  const chatDoc = await getDoc(doc(db, 'chats', chatId))
  if (chatDoc.exists()) {
    return { id: chatDoc.id, ...chatDoc.data() } as Chat
  }
  return null
}

export const getUserChats = (userId: string, callback: (chats: Chat[]) => void) => {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  )

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const chats: Chat[] = []
    snapshot.forEach((doc) => {
      chats.push({ id: doc.id, ...doc.data() } as Chat)
    })
    callback(chats)
  })
}

// Message operations
export const sendMessage = async (
  chatId: string,
  senderId: string,
  senderName: string,
  content: string,
  type: Message['type'] = 'text',
  fileData?: { file: File; fileName: string }
): Promise<string> => {
  let fileURL = ''
  let fileName = ''
  let fileSize = 0

  // Handle file upload
  if (fileData && type !== 'text') {
    const fileRef = ref(storage, `messages/${chatId}/${uuidv4()}_${fileData.fileName}`)
    const uploadResult = await uploadBytes(fileRef, fileData.file)
    fileURL = await getDownloadURL(uploadResult.ref)
    fileName = fileData.fileName
    fileSize = fileData.file.size
  }

  const messageData: Omit<Message, 'id'> = {
    chatId,
    senderId,
    senderName,
    content,
    type,
    fileURL,
    fileName,
    fileSize,
    timestamp: serverTimestamp() as Timestamp,
    status: 'sent'
  }

  const messageRef = await addDoc(collection(db, 'messages'), messageData)

  // Update chat's last message
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: {
      content: type === 'text' ? content : `${type} message`,
      senderId,
      senderName,
      timestamp: serverTimestamp(),
      type
    },
    updatedAt: serverTimestamp()
  })

  return messageRef.id
}

export const getChatMessages = (chatId: string, callback: (messages: Message[]) => void) => {
  const q = query(
    collection(db, 'messages'),
    where('chatId', '==', chatId),
    orderBy('timestamp', 'asc'),
    limit(50)
  )

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const messages: Message[] = []
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as Message)
    })
    callback(messages)
  })
}

export const markMessageAsRead = async (messageId: string) => {
  await updateDoc(doc(db, 'messages', messageId), {
    status: 'read'
  })
}

export const deleteMessage = async (messageId: string, fileURL?: string) => {
  // Delete file from storage if exists
  if (fileURL) {
    try {
      const fileRef = ref(storage, fileURL)
      await deleteObject(fileRef)
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  await deleteDoc(doc(db, 'messages', messageId))
}

// Contact operations
export const addContact = async (currentUserId: string, phoneNumber: string): Promise<Contact | null> => {
  // Find user by phone number
  const q = query(
    collection(db, 'users'),
    where('phoneNumber', '==', phoneNumber),
    limit(1)
  )

  const querySnapshot = await getDocs(q)
  
  if (querySnapshot.empty) {
    throw new Error('User not found with this phone number')
  }

  const userDoc = querySnapshot.docs[0]
  const userData = userDoc.data() as User

  // Add to contacts collection
  const contactData: Contact = {
    uid: userData.uid,
    displayName: userData.displayName,
    photoURL: userData.photoURL,
    phoneNumber: userData.phoneNumber,
    email: userData.email,
    status: userData.status,
    addedAt: serverTimestamp() as Timestamp
  }

  await setDoc(doc(db, 'contacts', `${currentUserId}_${userData.uid}`), contactData)
  
  return contactData
}

export const getUserContacts = (userId: string, callback: (contacts: Contact[]) => void) => {
  const q = query(
    collection(db, 'contacts'),
    where('__name__', '>=', `${userId}_`),
    where('__name__', '<', `${userId}_\uf8ff`)
  )

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const contacts: Contact[] = []
    snapshot.forEach((doc) => {
      contacts.push(doc.data() as Contact)
    })
    callback(contacts)
  })
}

export const blockContact = async (currentUserId: string, contactUserId: string) => {
  await updateDoc(doc(db, 'contacts', `${currentUserId}_${contactUserId}`), {
    isBlocked: true
  })
}

export const unblockContact = async (currentUserId: string, contactUserId: string) => {
  await updateDoc(doc(db, 'contacts', `${currentUserId}_${contactUserId}`), {
    isBlocked: false
  })
}

// Chat settings
export const archiveChat = async (chatId: string, userId: string, isArchived: boolean) => {
  const chatRef = doc(db, 'chats', chatId)
  const chatDoc = await getDoc(chatRef)
  
  if (chatDoc.exists()) {
    const currentData = chatDoc.data()
    const isArchivedData = currentData.isArchived || {}
    
    await updateDoc(chatRef, {
      isArchived: {
        ...isArchivedData,
        [userId]: isArchived
      },
      updatedAt: serverTimestamp()
    })
  }
}

export const muteChat = async (chatId: string, userId: string, isMuted: boolean) => {
  const chatRef = doc(db, 'chats', chatId)
  const chatDoc = await getDoc(chatRef)
  
  if (chatDoc.exists()) {
    const currentData = chatDoc.data()
    const isMutedData = currentData.isMuted || {}
    
    await updateDoc(chatRef, {
      isMuted: {
        ...isMutedData,
        [userId]: isMuted
      },
      updatedAt: serverTimestamp()
    })
  }
}

export const deleteChat = async (chatId: string) => {
  // Delete all messages in the chat
  const messagesQuery = query(
    collection(db, 'messages'),
    where('chatId', '==', chatId)
  )
  
  const messagesSnapshot = await getDocs(messagesQuery)
  const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref))
  await Promise.all(deletePromises)
  
  // Delete the chat
  await deleteDoc(doc(db, 'chats', chatId))
}

// Search operations
export const searchUsers = async (searchTerm: string): Promise<User[]> => {
  const q = query(
    collection(db, 'users'),
    where('displayName', '>=', searchTerm),
    where('displayName', '<=', searchTerm + '\uf8ff'),
    limit(10)
  )

  const querySnapshot = await getDocs(q)
  const users: User[] = []
  
  querySnapshot.forEach((doc) => {
    users.push({ uid: doc.id, ...doc.data() } as User)
  })
  
  return users
}