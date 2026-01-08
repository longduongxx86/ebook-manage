import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { dashboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';

export function Dashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const [summaryRes, chartRes, topSellingRes] = await Promise.all([
          dashboardApi.getSummary(token),
          dashboardApi.getCharts('30d', token),
          dashboardApi.getTopSelling('month', token)
        ]);

        // Transform API data to UI format
        const summary = (summaryRes as any)?.summary || {};
        const alerts = (summaryRes as any)?.alerts || {};
        const chartData = (chartRes as any)?.data || [];
        const topBooks = (topSellingRes as any)?.top_books || [];

        // Calculate trends (using Today vs Yesterday as a proxy for "current trend" or just show Today/Yesterday)
        // Or we can just show This Month's stats without trend percentage for now.
        // Let's use Today vs Yesterday for the "Trend" indicator
        const calculateTrend = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return ((current - previous) / previous) * 100;
        };

        const revenueTrend = calculateTrend(summary.today?.revenue || 0, summary.yesterday?.revenue || 0);
        const ordersTrend = calculateTrend(summary.today?.orders || 0, summary.yesterday?.orders || 0);
        const profitTrend = calculateTrend(summary.today?.profit || 0, summary.yesterday?.profit || 0);

        const uiData = {
          revenue: summary.this_month?.revenue || 0,
          orders: summary.this_month?.orders || 0,
          profit: summary.this_month?.profit || 0,
          revenueTrend: revenueTrend, // displaying daily trend
          ordersTrend: ordersTrend,
          profitTrend: profitTrend,
          chartData: chartData.map((item: any) => ({
            date: item.date,
            revenue: item.revenue,
          })),
          topBooks: topBooks.map((book: any) => ({
            id: book.id,
            title: book.title,
            sales: book.quantity,
            revenue: book.revenue,
          })),
          alerts: [
            ...(alerts.low_stock_books || []).map((book: any) => ({
              id: `stock-${book.id}`,
              message: `Sách "${book.title}" sắp hết hàng (còn ${book.stock})`,
              type: 'warning'
            })),
            ...(alerts.pending_orders > 0 ? [{
              id: 'pending-orders',
              message: `Có ${alerts.pending_orders} đơn hàng chờ xử lý`,
              type: 'info'
            }] : []),
            ...(alerts.pending_payments > 0 ? [{
              id: 'pending-payments',
              message: `Có ${alerts.pending_payments} thanh toán chờ xác nhận`,
              type: 'info'
            }] : [])
          ]
        };

        setData(uiData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return <div className="p-8">Đang tải dữ liệu...</div>;
  }

  if (!data) {
    return <div className="p-8">Không có dữ liệu.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tổng quan (Tháng này)</h1>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Doanh thu"
          value={formatCurrency(data.revenue)}
          icon={DollarSign}
          trend={data.revenueTrend}
          trendLabel="so với hôm qua"
          color="blue"
        />
        <StatsCard
          title="Đơn hàng"
          value={data.orders}
          icon={ShoppingBag}
          trend={data.ordersTrend}
          trendLabel="so với hôm qua"
          color="green"
        />
        <StatsCard
          title="Lợi nhuận"
          value={formatCurrency(data.profit)}
          icon={TrendingUp}
          trend={data.profitTrend}
          trendLabel="so với hôm qua"
          color="purple"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Doanh thu 30 ngày qua</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  width={60}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#374151' }}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('vi-VN')}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Books & Alerts */}
        <div className="space-y-6">
          {/* Top Books */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Sách bán chạy (Tháng này)</h3>
            <div className="space-y-4">
              {data.topBooks.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
              ) : (
                data.topBooks.map((book: any) => (
                  <div key={book.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex-1 truncate pr-4">
                      <p className="font-medium text-gray-900 truncate">{book.title}</p>
                      <p className="text-sm text-gray-500">{book.sales} cuốn</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(book.revenue)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Thông báo</h3>
            <div className="space-y-4">
              {data.alerts.length === 0 ? (
                <p className="text-sm text-gray-500">Không có thông báo mới</p>
              ) : (
                data.alerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-start space-x-3">
                    <AlertCircle className={`h-5 w-5 flex-shrink-0 ${alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, trend, trendLabel, color }: any) {
  const isPositive = trend >= 0;
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${(colorClasses as any)[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <span className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
          {isPositive ? <ArrowUpRight className="mr-1 h-4 w-4" /> : <ArrowDownRight className="mr-1 h-4 w-4" />}
          {Math.abs(trend).toFixed(1)}%
        </span>
        <span className="ml-2 text-sm text-gray-500">{trendLabel}</span>
      </div>
    </div>
  );
}
