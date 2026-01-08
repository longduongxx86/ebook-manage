import { useEffect, useState } from 'react';
import { 
  Search, 
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { paymentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../lib/utils';

interface Payment {
  id: number;
  order_id: number;
  amount: number;
  method: string;
  status: string;
  transaction_id?: string;
  created_at: number;
  order?: {
    order_number: string;
    buyer?: {
      full_name: string;
      email: string;
    };
  };
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  completed: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  failed: { label: 'Thất bại', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export function PaymentsPage() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPayments();
  }, [token]);

  const fetchPayments = async () => {
    if (!token) return;
    try {
      const data = await paymentApi.getPayments(token);
      const list = Array.isArray(data) ? data : (data as any).payments || [];
      setPayments(list);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    if (!token) return;
    if (!confirm('Bạn có chắc chắn muốn cập nhật trạng thái thanh toán này?')) return;
    
    try {
      await paymentApi.updateStatus(id.toString(), newStatus, token);
      fetchPayments();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Không thể cập nhật trạng thái thanh toán');
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      payment.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.order?.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.order?.buyer?.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="p-8 text-center">Đang tải danh sách thanh toán...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Quản lý Thanh toán</h1>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 leading-5 placeholder-gray-500 focus:border-blue-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            placeholder="Tìm kiếm mã đơn, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <FilterButton 
            active={statusFilter === 'all'} 
            onClick={() => setStatusFilter('all')} 
            label="Tất cả" 
          />
          <FilterButton 
            active={statusFilter === 'pending'} 
            onClick={() => setStatusFilter('pending')} 
            label="Chờ xử lý" 
          />
          <FilterButton 
            active={statusFilter === 'completed'} 
            onClick={() => setStatusFilter('completed')} 
            label="Hoàn thành" 
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
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
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Phương thức
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Không tìm thấy giao dịch nào.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const StatusIcon = STATUS_MAP[payment.status]?.icon || Clock;
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        #{payment.order?.order_number || payment.order_id}
                        {payment.transaction_id && (
                          <div className="text-xs text-gray-500 mt-1">
                            Trans: {payment.transaction_id}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="font-medium text-gray-900">
                          {payment.order?.buyer?.full_name || 'N/A'}
                        </div>
                        <div className="text-xs">{payment.order?.buyer?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 uppercase">
                        {payment.method}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_MAP[payment.status]?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          <StatusIcon className="h-3 w-3" />
                          {STATUS_MAP[payment.status]?.label || payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(new Date(payment.created_at))}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        {payment.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUpdateStatus(payment.id, 'completed')}
                              className="text-green-600 hover:text-green-900"
                              title="Xác nhận thanh toán"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(payment.id, 'failed')}
                              className="text-red-600 hover:text-red-900"
                              title="Hủy bỏ"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700'
          : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {label}
    </button>
  );
}
