'use client'

import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useChat } from '../../contexts/ChatContext'
import { Chat } from '../../types'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { Badge } from '../ui/badge'
import { formatDistanceToNow } from 'date-fns'

export const ChatSidebar: React.FC = () => {
  const { user, signOut } = useAuth()
  const { chats, activeChat, setActiveChat } = useChat()
  const [searchTerm, setSearchTerm] = useState('')

  // Filter chats based on search term
  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    
    // Search by chat name (for groups) or participant names
    if (chat.type === 'group') {
      return chat.name?.toLowerCase().includes(searchLower)
    } else {
      // For private chats, search by participant names
      // This would require loading participant data
      return chat.lastMessage?.senderName?.toLowerCase().includes(searchLower) ||
             chat.lastMessage?.content?.toLowerCase().includes(searchLower)
    }
  })

  const getChatDisplayName = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.name || 'Group Chat'
    }
    
    // For private chats, get the other participant's name
    const otherParticipant = chat.participants.find(p => p !== user?.uid)
    return chat.participantsData?.[otherParticipant || '']?.displayName || 'Unknown User'
  }

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.photoURL || ''
    }
    
    // For private chats, get the other participant's avatar
    const otherParticipant = chat.participants.find(p => p !== user?.uid)
    return chat.participantsData?.[otherParticipant || '']?.photoURL || ''
  }

  const getLastMessagePreview = (chat: Chat) => {
    if (!chat.lastMessage) return 'No messages yet'
    
    const { content, type, senderName } = chat.lastMessage
    
    if (type === 'text') {
      return content.length > 40 ? `${content.substring(0, 40)}...` : content
    }
    
    return `${senderName}: ${type} message`
  }

  const formatLastMessageTime = (chat: Chat) => {
    if (!chat.lastMessage?.timestamp) return ''
    
    try {
      return formatDistanceToNow(chat.lastMessage.timestamp.toDate(), { addSuffix: true })
    } catch {
      return ''
    }
  }

  const getUnreadCount = (chat: Chat) => {
    if (!user) return 0
    return chat.unreadCount?.[user.uid] || 0
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.photoURL} alt={user?.displayName} />
              <AvatarFallback className="bg-green-500 text-white">
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{user?.displayName}</h2>
              <p className="text-sm text-gray-500 truncate">{user?.status}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={signOut}
            className="text-gray-500 hover:text-red-500"
          >
            Sign Out
          </Button>
        </div>
        
        {/* Search */}
        <Input
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredChats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                {searchTerm ? 'No chats found' : 'No chats yet'}
              </p>
              {!searchTerm && (
                <p className="text-gray-400 text-xs mt-2">
                  Start a new conversation to begin messaging
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-colors
                    ${activeChat?.id === chat.id 
                      ? 'bg-green-50 border border-green-200' 
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={getChatAvatar(chat)} alt={getChatDisplayName(chat)} />
                      <AvatarFallback className="bg-gray-500 text-white">
                        {getChatDisplayName(chat).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">
                          {getChatDisplayName(chat)}
                        </h3>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {formatLastMessageTime(chat) && (
                            <span className="text-xs text-gray-500">
                              {formatLastMessageTime(chat)}
                            </span>
                          )}
                          {getUnreadCount(chat) > 0 && (
                            <Badge className="bg-green-500 text-white text-xs">
                              {getUnreadCount(chat)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {getLastMessagePreview(chat)}
                      </p>
                      
                      {chat.type === 'group' && (
                        <p className="text-xs text-gray-400 mt-1">
                          {chat.participants.length} participants
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}