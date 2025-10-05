import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { Search, Send, Paperclip, User } from 'lucide-react';
import { useAuth } from './AuthContext';
import api from '../api/axios';
import io from 'socket.io-client';
import { useLocation } from 'react-router-dom';

// --- Components ---

const ConversationList = ({ conversations, activeConversationId, onSelectConversation }) => (
  <div className="bg-white border-r border-slate-200 flex flex-col h-full">
    <div className="p-4 border-b border-slate-200">
      <h2 className="text-xl font-bold text-slate-800">Messages</h2>
      <div className="relative mt-4">
        <input type="text" placeholder="Search messages..." className="w-full pl-10 pr-4 py-2 rounded-full bg-slate-100 border border-transparent focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-red-200 outline-none transition" />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="w-5 h-5" />
        </div>
      </div>
    </div>
    <div className="flex-grow overflow-y-auto">
      {conversations.map(convo => (
        <div
          key={convo._id}
          onClick={() => onSelectConversation(convo._id)}
          className={`p-4 flex items-center gap-4 cursor-pointer border-l-4 transition-colors ${activeConversationId === convo._id ? 'bg-red-50 border-red-500' : 'border-transparent hover:bg-slate-50'}`}
        >
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-slate-500" />
            </div>
          </div>
          <div className="flex-grow overflow-hidden">
            <div className="flex justify-between items-center">
              <p className="font-semibold text-slate-800 truncate">{convo.otherUser.name}</p>
              <p className="text-xs text-slate-400 flex-shrink-0">{new Date(convo.lastMessage.createdAt).toLocaleTimeString()}</p>
            </div>
            <div className="flex justify-between items-start">
              <p className="text-sm text-slate-500 truncate">{convo.lastMessage.text}</p>
              {convo.unreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ml-2 flex-shrink-0">{convo.unreadCount}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ChatWindow = ({ conversation, messages, onSendMessage, userId }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  if (!conversation) {
    return <div className="flex items-center justify-center h-full bg-slate-50 text-slate-500">Select a conversation to start chatting.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex items-center gap-4 bg-white">
        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-slate-500" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">{conversation.otherUser.name}</p>
        </div>
      </div>
      <div className="flex-grow p-6 overflow-y-auto bg-slate-50">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg._id} className={`flex ${msg.sender._id === userId ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md p-3 rounded-lg ${msg.sender._id === userId ? 'bg-red-500 text-white' : 'bg-white text-slate-700 shadow-sm'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="relative">
          <textarea
            rows="1"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="w-full pr-24 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-300 outline-none resize-none"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button onClick={handleSend} className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"><Send className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Chat() {
  const { userInfo } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef();

  useEffect(() => {
    if (!userInfo) return;

    // Connect to socket
    socketRef.current = io('http://localhost:5001');

    // Fetch conversations
    const fetchConversations = async () => {
      try {
        const { data } = await api.get('/messages');
        setConversations(data);
        setLoading(false);

        // Check for a conversation passed via navigation state from Rentals page
        const { conversationId, otherUser } = location.state || {};

        if (conversationId) {
          // Check if this conversation already exists
          const existingConvo = data.find(c => c._id === conversationId);

          if (!existingConvo && otherUser) {
            // This is a new conversation. Create a temporary one to show in the UI.
            // The backend will create the real one on the first message.
            const newTempConvo = {
              _id: conversationId,
              otherUser: otherUser,
              lastMessage: { text: 'Start the conversation!', createdAt: new Date().toISOString() },
              isNew: true, // Flag to identify this as a temporary conversation
            };
            // Add it to the top of the list
            setConversations(prev => [newTempConvo, ...prev]);
          }

          // Set it as the active conversation
          setActiveConversationId(conversationId);
        }

      } catch (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
      }
    };

    fetchConversations();

    return () => {
      socketRef.current.disconnect();
    };
  }, [userInfo, location.state]);

  useEffect(() => {
    if (activeConversationId) {
      // Fetch messages for active conversation
      const fetchMessages = async () => {
        try {
          const { data } = await api.get(`/messages/${activeConversationId}`);
          setMessages(data);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };

      fetchMessages();

      // Join conversation room
      socketRef.current.emit('joinConversation', activeConversationId);

      // Listen for new messages
      socketRef.current.on('receiveMessage', (message) => {
        setMessages(prev => [...prev, message]);
      });
    } else if (conversations.length > 0) {
      // If no active conversation selected, select the first one by default
      setActiveConversationId(conversations[0]._id);
    }
  }, [activeConversationId, conversations]);

  const handleSendMessage = async (text) => {
    if (!activeConversationId) return;

    const conversation = conversations.find(c => c._id === activeConversationId);
    let receiver;
    if (conversation) {
      receiver = conversation.otherUser._id;
    } else {
      // New conversation, parse receiver from conversationId
      const [user1, user2] = activeConversationId.split('-');
      receiver = user1 === userInfo._id ? user2 : user1;
    }

    const messageData = {
      conversationId: activeConversationId,
      receiverId: receiver,
      text,
    };

    try {
      // Save message to backend to create conversation
      const { data: savedMessage } = await api.post('/messages', messageData);

      // Add the sent message to the local state immediately
      setMessages(prev => [...prev, savedMessage]);

      // Emit saved message via socket
      socketRef.current.emit('sendMessage', savedMessage);

      // Refetch conversations to update the list with new conversation
      if (conversation?.isNew) {
        const { data: updatedConversations } = await api.get('/messages');
        setConversations(updatedConversations);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  let activeConversation = conversations.find(c => c._id === activeConversationId);

  if (loading) {
    return (
      <div className="bg-slate-50 flex justify-center items-center h-screen">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-800 font-sans flex flex-col h-screen">
      <Navbar />
      <main className="flex-grow overflow-hidden" style={{ paddingTop: '48px' }}>
        <div className="h-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
          <div className="md:col-span-1 lg:col-span-1 h-full hidden md:block overflow-y-auto">
            <ConversationList
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={setActiveConversationId}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3 h-full">
            <ChatWindow
              conversation={activeConversation}
              messages={messages}
              onSendMessage={handleSendMessage}
              userId={userInfo?._id}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
