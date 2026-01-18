import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { dashboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';

type TabType = 'revenue' | 'users' | 'books';

interface RevenueData {
  date: string;
  revenue: number;
  orders_count: number;
}

interface UserStat {
  user_id: number;
  full_name: string;
  email: string;
  orders_count: number;
  total_spent: number;
}

interface BookStat {
  book_id: number;
  title: string;
  category: string;
  quantity: number;
  cost: number;
  revenue: number;
  profit: number;
}

export function StatisticsPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('revenue');
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [bookStats, setBookStats] = useState<BookStat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token, activeTab]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (activeTab === 'revenue') {
        const response = await dashboardApi.getCharts('30d', token);
        const raw = (response as any)?.data;
        const mapped: RevenueData[] = Array.isArray(raw)
          ? raw.map((item: any) => ({
              date: item.date,
              revenue: item.revenue,
              orders_count: item.orders ?? item.orders_count ?? 0,
            }))
          : [];
        setRevenueData(mapped);
      } else if (activeTab === 'users') {
        const data = await dashboardApi.getUserStats(token);
        setUserStats(Array.isArray(data) ? (data as UserStat[]) : []);
      } else if (activeTab === 'books') {
        const data = await dashboardApi.getBookStats(token);
        setBookStats(Array.isArray(data) ? (data as BookStat[]) : []);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Reset data on error to avoid stale/invalid state
      if (activeTab === 'revenue') setRevenueData([]);
      if (activeTab === 'users') setUserStats([]);
      if (activeTab === 'books') setBookStats([]);
    } finally {
      setLoading(false);
    }
  };

  const renderTabs = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {[
          { id: 'revenue', label: 'Doanh thu & Lợi nhuận' },
          { id: 'users', label: 'Người dùng' },
          { id: 'books', label: 'Sách & Kho' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`
              whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  const renderRevenueTab = () => (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Revenue Chart */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-medium text-gray-900">Doanh thu theo thời gian</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value) => `${value / 1000}k`}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Chart */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-medium text-gray-900">Số lượng đơn hàng</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="orders_count" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="rounded-lg bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Thống kê người dùng</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Người dùng</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Số đơn hàng</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Tổng chi tiêu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {userStats.map((user) => (
              <tr key={user.user_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{user.orders_count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                  {formatCurrency(user.total_spent)}
                </td>
              </tr>
            ))}
            {userStats.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Chưa có dữ liệu</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBooksTab = () => (
    <div className="space-y-6">
      {/* Cost vs Revenue Chart for Top Books */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-medium text-gray-900">Giá vốn vs Giá bán (Top 10 doanh thu)</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={bookStats.slice(0, 10)}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="title" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={80} />
              <YAxis tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Bar dataKey="cost" name="Giá vốn" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" name="Doanh thu" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Chi tiết doanh thu sách</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tên sách</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Danh mục</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Đã bán</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Tổng vốn</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Doanh thu</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Lợi nhuận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {bookStats.map((book) => (
                <tr key={book.book_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 max-w-xs truncate" title={book.title}>
                    {book.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{book.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                    {formatCurrency(book.cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                    {formatCurrency(book.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-bold">
                    {formatCurrency(book.profit)}
                  </td>
                </tr>
              ))}
              {bookStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Chưa có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Thống kê & Báo cáo</h1>

      {renderTabs()}

      {loading ? (
        <div className="p-8 text-center">Đang tải thống kê...</div>
      ) : (
        <>
          {activeTab === 'revenue' && renderRevenueTab()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'books' && renderBooksTab()}
        </>
      )}
    </div>
  );
}

