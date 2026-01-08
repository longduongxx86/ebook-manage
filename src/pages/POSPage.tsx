import { useEffect, useState } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  User,
  MapPin
} from 'lucide-react';
import { bookApi, cartApi, orderApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

interface Book {
  id: number;
  title: string;
  price: number;
  stock: number;
  image_url?: string;
}

interface CartItem {
  id: number;
  book_id: number;
  quantity: number;
  book: Book;
}

export function POSPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: 'Khách vãng lai',
    address: 'Tại quầy',
  });
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [token]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  const fetchBooks = async () => {
    if (!token) return;
    try {
      const data = await bookApi.getBooks(token, {
        page: 1,
        limit: 20, // Show top 20 or search results
        search: searchQuery
      });
      
      if (data && data.books) {
        setBooks(data.books);
      } else {
        setBooks([]);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const fetchCart = async () => {
    if (!token) return;
    try {
      const data = await cartApi.getCart(token);
      setCartItems(data?.items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const handleAddToCart = async (book: Book) => {
    if (!token) return;
    setLoading(true);
    try {
      await cartApi.addToCart(book.id.toString(), 1, token);
      await fetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Không thể thêm vào giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (!token || newQuantity < 1) return;
    setLoading(true);
    try {
      await cartApi.updateCart(itemId.toString(), newQuantity, token);
      await fetchCart();
    } catch (error) {
      console.error('Error updating cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromCart = async (itemId: number) => {
    if (!token) return;
    if (!confirm('Xóa sản phẩm này khỏi giỏ hàng?')) return;
    
    setLoading(true);
    try {
      await cartApi.removeFromCart(itemId.toString(), token);
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!token || cartItems.length === 0) return;
    
    setProcessing(true);
    try {
      // Use the address field for customer name + address combo for POS
      const shippingAddress = `${customerInfo.name} - ${customerInfo.address}`;
      await orderApi.createOrderFromCart(shippingAddress, token);
      alert('Thanh toán thành công!');
      await cartApi.clearCart(token);
      setCartItems([]);
      navigate('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Thanh toán thất bại');
    } finally {
      setProcessing(false);
    }
  };

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.book.price * item.quantity,
    0
  );

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      {/* Products Section */}
      <div className="flex flex-1 flex-col rounded-lg bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Tìm kiếm sách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {books.map((book) => (
              <div
                key={book.id}
                className="flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
                onClick={() => handleAddToCart(book)}
              >
                <div className="aspect-w-3 aspect-h-4 bg-gray-200">
                  {book.image_url ? (
                    <img
                      src={book.image_url}
                      alt={book.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400">
                      NO IMG
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <h3 className="line-clamp-2 text-sm font-medium text-gray-900">
                    {book.title}
                  </h3>
                  <div className="mt-auto pt-2">
                    <p className="text-sm font-bold text-blue-600">
                      {formatCurrency(book.price)}
                    </p>
                    <p className="text-xs text-gray-500">Kho: {book.stock}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="flex w-96 flex-col rounded-lg bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <h2 className="flex items-center text-lg font-semibold text-gray-900">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Giỏ hàng
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-gray-500">
              <ShoppingCart className="mb-2 h-12 w-12 opacity-20" />
              <p>Chưa có sản phẩm nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{item.book.title}</h4>
                    <p className="text-sm text-gray-500">{formatCurrency(item.book.price)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center rounded-md border border-gray-300">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-100"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-100"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="mb-4 space-y-3">
            <div className="flex items-center rounded-md bg-white px-3 py-2 shadow-sm ring-1 ring-inset ring-gray-300">
              <User className="mr-2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="block w-full border-0 p-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                placeholder="Tên khách hàng"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              />
            </div>
            <div className="flex items-center rounded-md bg-white px-3 py-2 shadow-sm ring-1 ring-inset ring-gray-300">
              <MapPin className="mr-2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="block w-full border-0 p-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                placeholder="Địa chỉ / Ghi chú"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between text-lg font-bold">
            <span>Tổng cộng:</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || processing}
            className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <CreditCard className="mr-2 h-5 w-5" />
            {processing ? 'Đang xử lý...' : 'Thanh toán'}
          </button>
        </div>
      </div>
    </div>
  );
}
