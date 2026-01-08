import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { BooksPage } from './pages/BooksPage';
import { BookForm } from './pages/BookForm';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { POSPage } from './pages/POSPage';
import { UsersPage } from './pages/UsersPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { PaymentsPage } from './pages/PaymentsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Books Management */}
            <Route path="books" element={<BooksPage />} />
            <Route path="books/new" element={<BookForm />} />
            <Route path="books/:id" element={<BookForm />} />
            
            {/* Orders Management */}
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            
            {/* POS */}
            <Route path="cart" element={<POSPage />} />
            <Route path="checkout" element={<POSPage />} />
            
            {/* Others */}
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="users" element={<UsersPage />} />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
