import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { API_ENDPOINTS, getHeaders } from '../config/api';
import { userApi } from '../services/api';
import { Modal } from '../components/Modal';
import { MessageCircle, Search, Send, User, Plus } from 'lucide-react';

interface Conversation {
  id: number;
  user_id: number;
  user: {
      full_name: string;
      email: string;
      avatar_url?: string;
  };
  last_message: string;
  last_message_at: number;
}

interface Message {
  id: number;
  content: string;
  sender_id: number;
  created_at: number;
  is_admin: boolean;
  conversation_id: number;
}

interface UserData {
  id: number;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

const ChatPage: React.FC = () => {
  const { token } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  // New Chat Modal State
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [userSearch, setUserSearch] = useState('');
  
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<number | null>(null);

  // Initial Fetch Conversations
  useEffect(() => {
      fetchConversations();
  }, [token]);

  useEffect(() => {
      localStorage.setItem('manage_chat_unread', '0');
      window.dispatchEvent(new CustomEvent('manage-chat-unread', { detail: 0 }));
  }, []);

  // Handle auto-selection from location state
  useEffect(() => {
    if (location.state?.conversationId && conversations.length > 0) {
        const conv = conversations.find(c => c.id === location.state.conversationId);
        if (conv) {
            setSelectedConversation(conv);
        }
    }
  }, [location.state, conversations]);

  // Handle Selection Change
  useEffect(() => {
      selectedIdRef.current = selectedConversation?.id || null;
      if (selectedConversation && selectedConversation.id !== 0) {
          fetchHistory(selectedConversation.user_id);
      } else {
          setMessages([]);
      }
  }, [selectedConversation]);

  // Handle auto-switching from temporary to real conversation
  useEffect(() => {
      if (selectedConversation?.id === 0) {
          const realConv = conversations.find(c => c.user_id === selectedConversation.user_id);
          if (realConv) {
              setSelectedConversation(realConv);
          }
      }
  }, [conversations, selectedConversation]);

  // WebSocket Setup
  useEffect(() => {
      if (!token) return;
      
      const wsUrl = API_ENDPOINTS.chat.ws(token);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => setIsConnected(false);
      
      ws.onmessage = (event) => {
           try {
               const data = JSON.parse(event.data);
               if (data.type === 'chat') {
                   const msg = data.payload;
                   // Check if message belongs to currently open conversation
                   if (selectedIdRef.current && msg.conversation_id === selectedIdRef.current) {
                       setMessages(prev => [...prev, msg]);
                       scrollToBottom();
                   }
                   // Always update conversation list (last message)
                   fetchConversations();
               }
           } catch (e) { console.error(e); }
      };
      
      socketRef.current = ws;
      
      return () => ws.close();
  }, [token]);


  const fetchConversations = async () => {
      if (!token) return;
      try {
          const res = await fetch(API_ENDPOINTS.chat.conversations, {
              headers: getHeaders(token)
          });
          const data = await res.json();
          if (Array.isArray(data)) {
              setConversations(data);
          }
      } catch (error) {
          console.error('Error fetching conversations', error);
      }
  };

  const fetchUsers = async () => {
      if (!token) return;
      try {
          const data = await userApi.getUsers(token);
          const userList = Array.isArray(data) ? data : (data as any).users || [];
          setUsers(userList);
      } catch (error) {
          console.error('Error fetching users', error);
      }
  };

  const openNewChatModal = () => {
      setIsNewChatModalOpen(true);
      fetchUsers();
  };

  const startChatWithUser = (user: UserData) => {
      // Check if conversation already exists
      const existingConv = conversations.find(c => c.user_id === user.id);
      if (existingConv) {
          setSelectedConversation(existingConv);
      } else {
          // Create temporary conversation
          setSelectedConversation({
              id: 0,
              user_id: user.id,
              user: {
                  full_name: user.full_name || user.email,
                  email: user.email,
                  avatar_url: user.avatar_url
              },
              last_message: '',
              last_message_at: Date.now() / 1000
          });
      }
      setIsNewChatModalOpen(false);
  };

  const fetchHistory = async (userId: number) => {
      if (!token) return;
      try {
          const res = await fetch(`${API_ENDPOINTS.chat.history}?user_id=${userId}`, {
              headers: getHeaders(token)
          });
          const data = await res.json();
          if (Array.isArray(data)) {
              setMessages(data);
              scrollToBottom();
          }
      } catch (error) {
          console.error('Error fetching history', error);
      }
  };
  
  const scrollToBottom = () => {
      setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
  };

  const sendMessage = () => {
      if (!input.trim() || !socketRef.current || !selectedConversation) return;
      
      socketRef.current.send(JSON.stringify({
          type: 'chat',
          payload: { 
              content: input,
              to_user_id: selectedConversation.user_id
          }
      }));
      
      setInput('');
  };

  const filteredUsers = users.filter(u => 
      (u.full_name?.toLowerCase() || '').includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* Sidebar - Conversation List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Tin nhắn</h2>
            <button 
                onClick={openNewChatModal}
                className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                title="Tạo cuộc trò chuyện mới"
            >
                <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <div 
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversation?.id === conv.id ? 'bg-blue-50 hover:bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-semibold flex-shrink-0">
                   {conv.user?.full_name?.charAt(0) || <User size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{conv.user?.full_name || conv.user?.email}</h3>
                    <span className="text-xs text-gray-500">
                      {conv.last_message_at ? new Date(conv.last_message_at * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.last_message || "Chưa có tin nhắn"}</p>
                </div>
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">Chưa có cuộc trò chuyện nào</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  {selectedConversation.user?.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{selectedConversation.user?.full_name}</h3>
                  <p className="text-xs text-gray-500">{selectedConversation.user?.email}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] p-3 rounded-lg text-sm shadow-sm ${
                    msg.is_admin 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                  }`}>
                    {msg.content}
                    <div className={`text-[10px] mt-1 ${msg.is_admin ? 'text-blue-100' : 'text-gray-400'}`}>
                      {new Date(msg.created_at * 1000).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!isConnected}
                />
                <button 
                  onClick={sendMessage}
                  disabled={!isConnected || !input.trim()}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageCircle size={64} className="mb-4 opacity-20" />
            <p>Chọn một cuộc hội thoại hoặc tạo mới để bắt đầu chat</p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <Modal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        title="Bắt đầu cuộc trò chuyện mới"
      >
        <div className="space-y-4">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Tìm kiếm người dùng..." 
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredUsers.map(user => (
                    <div 
                        key={user.id}
                        onClick={() => startChatWithUser(user)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                    >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
                            {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{user.full_name || 'Người dùng'}</h4>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                    </div>
                ))}
                {filteredUsers.length === 0 && (
                    <div className="text-center text-gray-500 py-4 text-sm">
                        Không tìm thấy người dùng
                    </div>
                )}
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChatPage;
