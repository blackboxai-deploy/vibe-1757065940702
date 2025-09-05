'use client'

import React from 'react'
import { useChat } from '../../contexts/ChatContext'
import { useAuth } from '../../contexts/AuthContext'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { ScrollArea } from '../ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'

export const ChatWindow: React.FC = () => {
  const { activeChat, messages } = useChat()
  const { user } = useAuth()

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-green-500 text-4xl font-bold">W</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Welcome to WhatsApp Clone
            </h3>
            <p className="text-gray-600">
              Select a chat from the sidebar to start messaging
            </p>
          </div>
        </div>
      </div>
    )
  }

  const getChatDisplayName = () => {
    if (activeChat.type === 'group') {
      return activeChat.name || 'Group Chat'
    }
    
    // For private chats, get the other participant's name
    const otherParticipant = activeChat.participants.find(p => p !== user?.uid)
    return activeChat.participantsData?.[otherParticipant || '']?.displayName || 'Unknown User'
  }

  const getChatAvatar = () => {
    if (activeChat.type === 'group') {
      return activeChat.photoURL || ''
    }
    
    // For private chats, get the other participant's avatar
    const otherParticipant = activeChat.participants.find(p => p !== user?.uid)
    return activeChat.participantsData?.[otherParticipant || '']?.photoURL || ''
  }

  const getOnlineStatus = () => {
    if (activeChat.type === 'group') {
      return `${activeChat.participants.length} participants`
    }
    
    // For private chats, show online status
    const otherParticipant = activeChat.participants.find(p => p !== user?.uid)
    const isOnline = activeChat.participantsData?.[otherParticipant || '']?.isOnline
    return isOnline ? 'Online' : 'Offline'
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getChatAvatar()} alt={getChatDisplayName()} />
            <AvatarFallback className="bg-gray-500 text-white">
              {getChatDisplayName().charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">{getChatDisplayName()}</h2>
            <p className="text-sm text-gray-500">{getOnlineStatus()}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-gray-500">
              Search
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500">
              Options
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-2xl">💬</span>
                </div>
                <p className="text-gray-500">No messages yet</p>
                <p className="text-gray-400 text-sm mt-1">Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  isOwnMessage={message.senderId === user?.uid}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <MessageInput />
        </div>
      </div>
    </div>
  )
}