import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Printer, 
  MapPin, 
  User, 
  Calendar,
  CreditCard,
  Package
} from 'lucide-react';
import { orderApi, paymentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../lib/utils';

interface OrderItem {
  id: number;
  book: {
    id: number;
    title: string;
    image_url?: string;
  };
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  order_number: string;
  buyer: {
    full_name: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
  total_amount: number;
  status: string;
  shipping_address: string;
  created_at: number;
  payment_method?: string;
}

interface Payment {
  id: number;
  order_id: number;
  amount: number;
  method: string;
  status: string;
  transaction_id?: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ thanh toán' },
  { value: 'confirmed', label: 'Đã thanh toán' },
  { value: 'shipped', label: 'Đang chuyển hàng' },
  { value: 'delivered', label: 'Đã nhận' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrder(id);
    }
  }, [id, token]);

  const fetchOrder = async (orderId: string) => {
    if (!token) return;
    try {
      const data = await orderApi.getOrder(orderId, token);
      const orderData = (data as any).order;
      setOrder(orderData);
      setSelectedStatus(orderData.status);
      await fetchPayment(orderId);
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!token || !order) return;
    if (selectedStatus === order.status) return;
    if (!confirm(`Bạn có chắc muốn đổi trạng thái sang "${STATUS_OPTIONS.find(o => o.value === selectedStatus)?.label}"?`)) return;

    setUpdating(true);
    try {
      await orderApi.updateOrderStatus(order.id.toString(), selectedStatus, token);
      setOrder((prev) => prev ? { ...prev, status: selectedStatus } : null);
      alert('Cập nhật trạng thái thành công');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Cập nhật trạng thái thất bại');
    } finally {
      setUpdating(false);
    }
  };

  const fetchPayment = async (orderId: string) => {
    if (!token) return;
    try {
      const data = await paymentApi.getPaymentByOrder(orderId, token);
      const p = (data as any).payment;
      if (p) {
        setPayment(p);
        setPaymentStatus(p.status);
      } else {
        setPayment(null);
        setPaymentStatus('');
      }
    } catch (error) {
      setPayment(null);
      setPaymentStatus('');
    }
  };

  const handleUpdatePaymentStatus = async () => {
    if (!token || !payment) return;
    if (paymentStatus === payment.status) return;
    if (!confirm(`Xác nhận đổi trạng thái thanh toán sang "${paymentStatus}"?`)) return;
    setUpdatingPayment(true);
    try {
      await paymentApi.updateStatus(payment.id.toString(), paymentStatus, token);
      setPayment((prev) => prev ? { ...prev, status: paymentStatus } : null);
      if (paymentStatus === 'completed') {
        setOrder((prev) => prev ? { ...prev, status: 'confirmed' } : null);
      }
      alert('Cập nhật thanh toán thành công');
    } catch (error) {
      alert('Cập nhật thanh toán thất bại');
    } finally {
      setUpdatingPayment(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Đang tải thông tin đơn hàng...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center">Không tìm thấy đơn hàng.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/orders')}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Đơn hàng #{order.order_number}
            </h1>
            <p className="text-sm text-gray-500">
              Đặt ngày {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50">
            <Printer className="mr-2 h-4 w-4" />
            In hóa đơn
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <div className="rounded-lg bg-white shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">Sản phẩm</h2>
            </div>
            <div className="divide-y">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center p-6">
                  <div className="h-16 w-12 flex-shrink-0 bg-gray-100">
                    {item.book.image_url && (
                      <img
                        src={item.book.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {item.book.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Giá: {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      x{item.quantity}
                    </p>
                    <p className="mt-1 text-sm font-medium text-blue-600">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t bg-gray-50 px-6 py-4">
              <div className="flex justify-between text-base font-medium text-gray-900">
                <p>Tổng tiền</p>
                <p>{formatCurrency(order.total_amount)}</p>
              </div>
            </div>
          </div>

          {/* Activity/History could go here */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-medium text-gray-500">Trạng thái đơn hàng</h3>
            <div className="space-y-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={updating}
                className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleUpdateStatus}
                disabled={updating || selectedStatus === order.status}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  updating || selectedStatus === order.status
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {updating ? 'Đang cập nhật...' : 'Xác nhận đổi trạng thái'}
              </button>
            </div>
          </div>

          {/* Customer Info */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center text-sm font-medium text-gray-500">
              <User className="mr-2 h-4 w-4" />
              Thông tin khách hàng
            </h3>
            <div className="space-y-3 text-sm">
              <p className="font-medium text-gray-900">{order.buyer?.full_name || 'Khách vãng lai'}</p>
              <p className="text-gray-600">{order.buyer?.email || 'N/A'}</p>
              <p className="text-gray-600">{order.buyer?.phone || 'Chưa cập nhật SĐT'}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center text-sm font-medium text-gray-500">
              <MapPin className="mr-2 h-4 w-4" />
              Địa chỉ giao hàng
            </h3>
            <p className="text-sm text-gray-600">{order.shipping_address}</p>
          </div>

          {/* Payment Info */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center text-sm font-medium text-gray-500">
              <CreditCard className="mr-2 h-4 w-4" />
              Thanh toán
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Phương thức:</span>
                <span className="font-medium text-gray-900">
                  {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : order.payment_method || 'Chưa xác định'}
                </span>
              </div>
              {payment ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái thanh toán:</span>
                    <span className={`font-medium ${
                      payment.status === 'completed' ? 'text-green-600' :
                      payment.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {payment.status === 'completed' ? 'Đã thanh toán' :
                       payment.status === 'failed' ? 'Thất bại' : 'Chờ thanh toán'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      disabled={updatingPayment}
                      className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="pending">Chờ thanh toán</option>
                      <option value="completed">Đã thanh toán</option>
                      <option value="failed">Thất bại</option>
                    </select>
                    <button
                      onClick={handleUpdatePaymentStatus}
                      disabled={updatingPayment || paymentStatus === payment.status}
                      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        updatingPayment || paymentStatus === payment.status
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      }`}
                    >
                      {updatingPayment ? 'Đang cập nhật...' : 'Cập nhật thanh toán'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-600">Chưa có bản ghi thanh toán cho đơn này</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
