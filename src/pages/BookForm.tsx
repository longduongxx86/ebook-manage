import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import { bookApi, categoryApi, uploadApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Category {
  id: number;
  name: string;
}

export function BookForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    price: 0,
    cost: 0,
    stock: 0,
    isbn: '',
    category_id: '',
    image_url: '',
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
    if (isEditing && id) {
      fetchBook(id);
    }
  }, [id, token]);

  const fetchCategories = async () => {
    try {
      const data = await categoryApi.getCategories(token!);
      setCategories((data as any).categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBook = async (bookId: string) => {
    try {
      const response = await bookApi.getBook(bookId, token!);
      const book = (response as any).book || response;
      setFormData({
        title: book.title,
        author: book.author,
        description: book.description || '',
        price: book.price,
        cost: book.cost || 0,
        stock: book.stock,
        isbn: book.isbn || '',
        category_id: book.category_id?.toString() || '',
        image_url: book.image_url || '',
      });
    } catch (error) {
      console.error('Error fetching book:', error);
      setError('Không thể tải thông tin sách');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'cost' || name === 'stock' ? Number(value) : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    try {
      const response = await uploadApi.uploadBookImage(file, token);
      setFormData((prev) => ({ ...prev, image_url: response.image_url }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Lỗi khi tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        category_id: formData.category_id ? Number(formData.category_id) : null,
      };

      if (isEditing && id) {
        await bookApi.updateBook(id, payload, token);
      } else {
        await bookApi.createBook(payload, token);
      }
      navigate('/books');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Có lỗi xảy ra khi lưu sách');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/books')}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Chỉnh sửa sách' : 'Thêm sách mới'}
          </h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || uploading}
          className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Đang lưu...' : 'Lưu lại'}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Thông tin chung</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên sách</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tác giả</label>
                  <input
                    type="text"
                    name="author"
                    required
                    value={formData.author}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ISBN</label>
                  <input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Giá & Tồn kho</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Giá bán (VNĐ)</label>
                <input
                  type="number"
                  name="price"
                  min="0"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Giá vốn (VNĐ)</label>
                <input
                  type="number"
                  name="cost"
                  min="0"
                  value={formData.cost}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tồn kho</label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  required
                  value={formData.stock}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Phân loại</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Danh mục</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Hình ảnh</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6">
                {formData.image_url ? (
                  <div className="relative h-48 w-full">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="h-full w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      className="absolute top-0 right-0 -mt-2 -mr-2 rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2 flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500"
                      >
                        <span>Tải ảnh lên</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
              {uploading && <p className="text-center text-sm text-gray-500">Đang tải lên...</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
