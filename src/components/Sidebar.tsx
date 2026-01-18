import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  ShoppingBag, 
  ShoppingCart, 
  CreditCard, 
  BarChart, 
  Users, 
  Settings 
} from 'lucide-react';
import { cn } from '../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Quản lý Sách', href: '/books', icon: BookOpen },
  { name: 'Đơn hàng', href: '/orders', icon: ShoppingBag },
  { name: 'Thống kê', href: '/statistics', icon: BarChart },
  { name: 'Người dùng', href: '/users', icon: Users },
];

export function Sidebar() {
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
            {item.name}
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
