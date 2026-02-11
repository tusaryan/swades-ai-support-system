import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import AuthPage from '@/pages/AuthPage';
import ChatPage from '@/pages/ChatPage';
import DashboardLayout from '@/pages/dashboard/DashboardLayout';
import ProfilePage from '@/pages/dashboard/ProfilePage';
import OrdersPage from '@/pages/dashboard/OrdersPage';
import InvoicesPage from '@/pages/dashboard/InvoicesPage';
import ChatHistoryPage from '@/pages/dashboard/ChatHistoryPage';

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/chat" element={<ChatPage />} />

            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/dashboard/profile" replace />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="invoices" element={<InvoicesPage />} />
                <Route path="history" element={<ChatHistoryPage />} />
            </Route>

            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/register" element={<Navigate to="/auth" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
