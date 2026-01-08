import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { bookApi, categoryApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';

interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  stock: number;
  image_url?: string;
  category?: {
    name: string;
  };
}

interface Category {
  id: number;
  name: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export function BooksPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12, // 12 items to support 2, 3, 4, 6 columns well
    total: 0,
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!token) return;
      try {
        const data = await categoryApi.getCategories(token);
        setCategories((data as any).categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, [token]);

  // Debounce search and filter
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, token]);

  const fetchBooks = async (page: number) => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await bookApi.getBooks(token, {
        page,
        limit: pagination.limit,
        search: searchQuery,
        categories: selectedCategory,
      });
      
      if (data && typeof data === 'object' && 'books' in data && Array.isArray((data as any).books)) {
        setBooks((data as any).books);
        if ('pagination' in data && data.pagination) {
          setPagination(prev => ({
            ...prev,
            page: (data.pagination as { page: number }).page,
            total: (data.pagination as { total: number }).total
          }));
        }
      } else {
        setBooks([]);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= Math.ceil(pagination.total / pagination.limit)) {
      fetchBooks(newPage);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa sách "${title}"?\n\nLưu ý: Nếu sách đã có đơn hàng, bạn sẽ không thể xóa.`)) return;
    if (!token) return;

    try {
      await bookApi.deleteBook(id.toString(), token);
      alert('Đã xóa sách thành công');
      fetchBooks(pagination.page);
    } catch (error: any) {
      console.error('Error deleting book:', error);
      const errorMessage = error.message || 'Không thể xóa sách. Vui lòng thử lại.';
      alert(`Lỗi: ${errorMessage}`);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Sách</h1>
        <Link
          to="/books/new"
          className="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm sách mới
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Tìm kiếm theo tên sách hoặc tác giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-center text-gray-500">Đang tải...</div>
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Search className="h-12 w-12 opacity-20 mb-4" />
            <p>Không tìm thấy sách nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {books.map((book) => (
              <div key={book.id} className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
                <div className="aspect-[2/3] w-full overflow-hidden bg-gray-200">
                  {book.image_url ? (
                    <img
                      src={book.image_url}
                      alt={book.title}
                      className="h-full w-full object-cover object-center group-hover:opacity-75"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                      NO IMG
                    </div>
                  )}
                  {/* Action buttons overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => navigate(`/books/${book.id}`)}
                      className="p-2 bg-white rounded-full text-blue-600 hover:text-blue-700 hover:bg-gray-100"
                      title="Sửa"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(book.id, book.title)}
                      className="p-2 bg-white rounded-full text-red-600 hover:text-red-700 hover:bg-gray-100"
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5em]" title={book.title}>
                    {book.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-1">{book.author}</p>
                  
                  <div className="mt-auto pt-2 space-y-1">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-blue-600">
                        {formatCurrency(book.price)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 border-t pt-2 mt-2">
                      <span>Kho: {book.stock}</span>
                      <span className="max-w-[50%] truncate" title={book.category?.name}>
                        {book.category?.name || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
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
