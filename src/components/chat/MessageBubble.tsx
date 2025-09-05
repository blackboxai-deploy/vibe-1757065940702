'use client'

import React from 'react'
import { Message } from '../../types'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { formatDistanceToNow, format } from 'date-fns'

interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
  const formatMessageTime = (timestamp: any) => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
      const now = new Date()
      const messageDate = new Date(date)
      
      // If message is from today, show time only
      if (
        now.getDate() === messageDate.getDate() &&
        now.getMonth() === messageDate.getMonth() &&
        now.getFullYear() === messageDate.getFullYear()
      ) {
        return format(messageDate, 'HH:mm')
      }
      
      // If message is from this week, show day and time
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      if (messageDate > weekAgo) {
        return format(messageDate, 'EEE HH:mm')
      }
      
      // Otherwise show full date
      return format(messageDate, 'MMM d, HH:mm')
    } catch {
      return ''
    }
  }

  const getStatusIcon = () => {
    if (!isOwnMessage) return null

    switch (message.status) {
      case 'sending':
        return <span className="text-gray-400 text-xs">⏳</span>
      case 'sent':
        return <span className="text-gray-400 text-xs">✓</span>
      case 'delivered':
        return <span className="text-gray-400 text-xs">✓✓</span>
      case 'read':
        return <span className="text-green-500 text-xs">✓✓</span>
      default:
        return null
    }
  }

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div className="break-words">
            {message.content}
          </div>
        )
      
      case 'image':
        return (
          <div className="space-y-2">
            {message.fileURL && (
              <img 
                src={message.fileURL} 
                alt="Shared image" 
                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
                onClick={() => window.open(message.fileURL, '_blank')}
              />
            )}
            {message.content && (
              <div className="break-words">
                {message.content}
              </div>
            )}
          </div>
        )
      
      case 'file':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📄</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{message.fileName}</p>
                <p className="text-xs text-gray-500">
                  {message.fileSize ? `${(message.fileSize / 1024 / 1024).toFixed(2)} MB` : 'File'}
                </p>
              </div>
              {message.fileURL && (
                <button
                  onClick={() => window.open(message.fileURL, '_blank')}
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                >
                  Download
                </button>
              )}
            </div>
            {message.content && (
              <div className="break-words">
                {message.content}
              </div>
            )}
          </div>
        )
      
      case 'audio':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🎵</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Voice Message</p>
                <p className="text-xs text-gray-500">Audio file</p>
              </div>
              {message.fileURL && (
                <audio controls className="max-w-48">
                  <source src={message.fileURL} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              )}
            </div>
            {message.content && (
              <div className="break-words">
                {message.content}
              </div>
            )}
          </div>
        )
      
      default:
        return (
          <div className="break-words">
            {message.content}
          </div>
        )
    }
  }

  return (
    <div className={`flex items-start space-x-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar for other users */}
      {!isOwnMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.senderPhotoURL} alt={message.senderName} />
          <AvatarFallback className="bg-gray-500 text-white text-xs">
            {message.senderName?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message bubble */}
      <div className={`max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        <div
          className={`
            px-4 py-2 rounded-2xl shadow-sm
            ${isOwnMessage
              ? 'bg-green-500 text-white ml-auto'
              : 'bg-white text-gray-900 border border-gray-200'
            }
          `}
        >
          {/* Sender name for group chats and received messages */}
          {!isOwnMessage && (
            <p className="text-xs font-medium text-gray-500 mb-1">
              {message.senderName}
            </p>
          )}

          {/* Message content */}
          <div className="text-sm">
            {renderMessageContent()}
          </div>

          {/* Time and status */}
          <div className={`flex items-center justify-end space-x-1 mt-1 ${
            isOwnMessage ? 'text-green-100' : 'text-gray-500'
          }`}>
            <span className="text-xs">
              {formatMessageTime(message.timestamp)}
            </span>
            {getStatusIcon()}
          </div>
        </div>
      </div>

      {/* Spacing for own messages */}
      {isOwnMessage && <div className="w-8 flex-shrink-0" />}
    </div>
  )
}