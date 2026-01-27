import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  ShoppingBag, 
  ShoppingCart, 
  CreditCard, 
  BarChart, 
  Users, 
  Settings, 
  MessageCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Quản lý Sách', href: '/books', icon: BookOpen },
  { name: 'Đơn hàng', href: '/orders', icon: ShoppingBag },
  { name: 'Thống kê', href: '/statistics', icon: BarChart },
  { name: 'Tin nhắn', href: '/chat', icon: MessageCircle },
  { name: 'Người dùng', href: '/users', icon: Users },
];

export function Sidebar() {
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    const stored = Number(localStorage.getItem('manage_chat_unread') || '0');
    if (!Number.isNaN(stored)) {
      setChatUnread(stored);
    }
    const handler = (event: Event) => {
      const custom = event as CustomEvent<number>;
      if (typeof custom.detail === 'number') {
        setChatUnread(custom.detail);
      }
    };
    window.addEventListener('manage-chat-unread', handler as EventListener);
    return () => {
      window.removeEventListener('manage-chat-unread', handler as EventListener);
    };
  }, []);

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center px-6">
        <BookOpen className="h-8 w-8 text-blue-500" />
        <span className="ml-2 text-xl font-bold">EBook Admin</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="flex items-center gap-2">
              {item.name}
              {item.name === 'Tin nhắn' && chatUnread > 0 && (
                <span className="ml-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
            </span>
          </NavLink>
        ))}
      </nav>
      {/* <div className="border-t border-gray-800 p-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )
          }
        >
          <Settings className="mr-3 h-5 w-5 flex-shrink-0" />
          Cài đặt
        </NavLink> */}
      {/* </div> */}
    </div>
  );
}
