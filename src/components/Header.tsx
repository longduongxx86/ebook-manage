import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Bell, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { notificationApi } from '../services/api';
import { API_CONFIG } from '../config/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  reference_id: number;
}

export function Header() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Store signatures of recently processed notifications to prevent duplicates
  const processedRef = useRef<Set<string>>(new Set());

  // Cleanup processedRef periodically
  useEffect(() => {
    const interval = setInterval(() => {
      processedRef.current.clear();
    }, 10000); // Clear every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Initial fetch
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res: any = await notificationApi.getNotifications(token, 1, 50);
      if (res && res.notifications) {
        setNotifications(res.notifications);
        // Calculate unread count from the fetched list or use the count from API if provided
        // Assuming API returns sorted list, we can count unread
        // const count = res.notifications.filter((n: Notification) => !n.is_read).length;
        // Or use server returned count
        if (res.unread_count !== undefined) {
             setUnreadCount(res.unread_count);
        } else {
             const count = res.notifications.filter((n: Notification) => !n.is_read).length;
             setUnreadCount(count);
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // WebSocket connection
    const connectWebSocket = () => {
      if (!token) return;

      // Convert http(s) to ws(s) and remove /api if present, append /ws
      let wsUrl = API_CONFIG.baseURL.replace(/^http/, 'ws');
      if (wsUrl.endsWith('/api')) {
        wsUrl = wsUrl.slice(0, -4);
      }
      wsUrl = `${wsUrl}/ws?token=${token}`;

      // Prevent duplicate connection if already connected to same URL
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        return;
      }
      // Close existing connection if any (e.g. connecting or closing)
      if (ws.current) {
         ws.current.close();
      }

      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket connected');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          const idFromServer = typeof data.id === 'number' ? data.id : Date.now();
          const createdAtFromServer = data.created_at
            ? new Date(data.created_at).toISOString()
            : new Date().toISOString();

          const newNotification: Notification = {
            id: idFromServer,
            title: data.title,
            message: data.message,
            type: data.type,
            is_read: false,
            created_at: createdAtFromServer,
            reference_id: data.reference_id
          };

          const signature = `${data.type}-${data.reference_id}`;
          
          if (processedRef.current.has(signature)) {
            console.log("Duplicate notification ignored:", signature);
            return;
          }
          
          processedRef.current.add(signature);

          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        } catch (e) {
          console.error("Error parsing websocket message", e);
        }
      };

      socket.onclose = (event) => {
        console.log('WebSocket disconnected', event);
        if (event.code === 1006) {
          console.warn("WebSocket connection failed. If you see 401 in Network tab, your token is expired. Please Log Out and Log In.");
        }
        // Simple reconnect logic
        setTimeout(connectWebSocket, 3000);
      };

      ws.current = socket;
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [token]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMarkAsRead = async (notificationId: number) => {
    if (!token) return;
    try {
      await notificationApi.markAsRead([notificationId], token);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token || unreadCount === 0) return;
    try {
      await notificationApi.markAsRead([], token);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    // Navigate based on type
    if (notification.type === 'order') {
      navigate(`/orders/${notification.reference_id}`);
    } else if (notification.type === 'stock') {
      navigate(`/books/${notification.reference_id}`); // Assuming reference_id is book ID
    }
    setShowNotifications(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          Xin chào, {user?.full_name || 'Admin'}
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 outline-none"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-md border bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <h3 className="text-sm font-semibold text-gray-700">Thông báo</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Đọc tất cả
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Không có thông báo nào
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`cursor-pointer px-4 py-3 hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-[10px] text-gray-400">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <span className="ml-2 h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5"></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 border-l pl-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {user?.username}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
