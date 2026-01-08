import { useEffect, useState } from 'react';
import { 
  Search, 
  Eye, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { orderApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';

interface Order {
  id: number;
  order_number: string;
  buyer: {
    full_name: string;
    email: string;
  };
  total_amount: number;
  status: string;
  created_at: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Đã thanh toán', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  shipped: { label: 'Đang chuyển hàng', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Đã nhận', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  completed: { label: 'Đã nhận', color: 'bg-green-100 text-green-800', icon: CheckCircle }, // Alias for delivered if needed
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
  });

  useEffect(() => {
    fetchOrders(1);
  }, [token, statusFilter]);

  const fetchOrders = async (page: number) => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await orderApi.getOrders(token, {
        page,
        limit: pagination.limit,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      
      if (data && typeof data === 'object' && 'orders' in data && Array.isArray((data as any).orders)) {
        setOrders((data as { orders: Order[] }).orders);
        setPagination(prev => ({
          ...prev,
          page: (data as any).pagination.page,
          total: (data as unknown as { pagination: { total: number } }).pagination.total
        }));
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= Math.ceil(pagination.total / pagination.limit)) {
      fetchOrders(newPage);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    if (!token) return;
    try {
      await orderApi.updateOrderStatus(id.toString(), newStatus, token);
      fetchOrders(pagination.page); // Refresh list
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Không thể cập nhật trạng thái đơn hàng');
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  if (loading && orders.length === 0) {
    return <div className="p-8 text-center">Đang tải danh sách đơn hàng...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h1>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(STATUS_MAP)
              .filter(([key]) => key !== 'completed')
              .map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Mã đơn hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ngày tạo
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Chi tiết</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Không tìm thấy đơn hàng nào
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const status = STATUS_MAP[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800', icon: Clock };
                  const StatusIcon = status.icon;

                  return (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.order_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.buyer.full_name}</div>
                        <div className="text-sm text-gray-500">{order.buyer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> đến <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> trong số <span className="font-medium">{pagination.total}</span> kết quả
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                  {pagination.page} / {totalPages || 1}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
