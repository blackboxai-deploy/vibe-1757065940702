'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Chat, Message, Contact, ChatContextType } from '../types'
import { useAuth } from './AuthContext'
import {
  getUserChats,
  getChatMessages,
  sendMessage as sendMessageToFirestore,
  createChat,
  markMessageAsRead,
  getUserContacts,
  addContact as addContactToFirestore,
  blockContact,
  deleteChat,
  archiveChat,
  muteChat
} from '../lib/firestore'
import toast from 'react-hot-toast'

const ChatContext = createContext<ChatContextType | null>(null)

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

interface ChatProviderProps {
  children: ReactNode
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)

  // Load user chats
  useEffect(() => {
    if (!user) return

    const unsubscribe = getUserChats(user.uid, (userChats) => {
      setChats(userChats)
    })

    return unsubscribe
  }, [user])

  // Load user contacts
  useEffect(() => {
    if (!user) return

    const unsubscribe = getUserContacts(user.uid, (userContacts) => {
      setContacts(userContacts)
    })

    return unsubscribe
  }, [user])

  // Load messages for active chat
  useEffect(() => {
    if (!activeChat) {
      setMessages([])
      return
    }

    const unsubscribe = getChatMessages(activeChat.id, (chatMessages) => {
      setMessages(chatMessages)
    })

    return unsubscribe
  }, [activeChat])

  const sendMessage = async (
    content: string,
    type: Message['type'] = 'text',
    fileData?: { file: File; fileName: string }
  ) => {
    if (!user || !activeChat || !content.trim()) return

    try {
      await sendMessageToFirestore(
        activeChat.id,
        user.uid,
        user.displayName,
        content,
        type,
        fileData
      )
    } catch (error: any) {
      toast.error('Failed to send message')
      console.error('Error sending message:', error)
    }
  }

  const createNewChat = async (
    participantIds: string[],
    type: Chat['type'],
    name?: string
  ): Promise<string> => {
    if (!user) throw new Error('User not authenticated')

    try {
      setLoading(true)
      const allParticipants = [user.uid, ...participantIds]
      const chatId = await createChat(allParticipants, type, user.uid, name)
      toast.success(type === 'group' ? 'Group created successfully!' : 'Chat created!')
      return chatId
    } catch (error: any) {
      toast.error('Failed to create chat')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await markMessageAsRead(messageId)
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const setTyping = async (isTyping: boolean) => {
    if (!user || !activeChat) return

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    if (isTyping) {
      // Set typing indicator
      // This would typically update a typing status in Firestore
      // For now, we'll just set a timeout to clear it
      const timeout = setTimeout(() => {
        // Clear typing status after 3 seconds of inactivity
      }, 3000)
      setTypingTimeout(timeout)
    }
  }

  const addContactByPhone = async (phoneNumber: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      setLoading(true)
      await addContactToFirestore(user.uid, phoneNumber)
      toast.success('Contact added successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add contact')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const blockContactById = async (userId: string) => {
    if (!user) return

    try {
      await blockContact(user.uid, userId)
      toast.success('Contact blocked')
    } catch (error: any) {
      toast.error('Failed to block contact')
      console.error('Error blocking contact:', error)
    }
  }

  const deleteChatById = async (chatId: string) => {
    try {
      await deleteChat(chatId)
      if (activeChat?.id === chatId) {
        setActiveChat(null)
      }
      toast.success('Chat deleted')
    } catch (error: any) {
      toast.error('Failed to delete chat')
      console.error('Error deleting chat:', error)
    }
  }

  const archiveChatById = async (chatId: string, isArchived: boolean) => {
    if (!user) return

    try {
      await archiveChat(chatId, user.uid, isArchived)
      toast.success(isArchived ? 'Chat archived' : 'Chat unarchived')
    } catch (error: any) {
      toast.error(`Failed to ${isArchived ? 'archive' : 'unarchive'} chat`)
      console.error('Error archiving chat:', error)
    }
  }

  const muteChatById = async (chatId: string, isMuted: boolean) => {
    if (!user) return

    try {
      await muteChat(chatId, user.uid, isMuted)
      toast.success(isMuted ? 'Chat muted' : 'Chat unmuted')
    } catch (error: any) {
      toast.error(`Failed to ${isMuted ? 'mute' : 'unmute'} chat`)
      console.error('Error muting chat:', error)
    }
  }

  const contextValue: ChatContextType = {
    chats,
    activeChat,
    messages,
    contacts,
    loading,
    setActiveChat,
    sendMessage,
    createChat: createNewChat,
    markMessageAsRead: markAsRead,
    setTyping,
    addContact: addContactByPhone,
    blockContact: blockContactById,
    deleteChat: deleteChatById,
    archiveChat: archiveChatById,
    muteChat: muteChatById
  }

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  )
}