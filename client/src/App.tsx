import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import AppSidebar from './components/app-sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import Withdrawals from './pages/withdrawals';
import WithdrawalDetail from './pages/withdrawal-detail';
import Documents from './pages/documents';
import UserSearch from './pages/user-search';
import UserDetail from './pages/user-detail';
import UserManagement from './pages/user-management';
import TransactionsBalances from './pages/transactions-balances';

function WithdrawalRedirect() {
  const { withdrawalId } = useParams<{ withdrawalId: string }>();
  if (!withdrawalId) {
    return <Navigate to="/invest/withdrawals" replace />;
  }
  return <Navigate to={`/invest/withdrawals/${withdrawalId}`} replace />;
}

function UserRedirect() {
  const { userId } = useParams<{ userId: string }>();
  if (!userId) {
    return <Navigate to="/invest/users/search" replace />;
  }
  return <Navigate to={`/invest/users/${userId}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary title="Application Error">
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <AppSidebar />
          <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
            <ErrorBoundary title="Page Error">
              <Routes>
                <Route path="/" element={<Navigate to="/invest/dashboard" replace />} />

                <Route path="/invest/dashboard" element={<Dashboard />} />
                <Route path="/invest/withdrawals" element={<Withdrawals />} />
                <Route path="/invest/withdrawals/:withdrawalId" element={<WithdrawalDetail />} />
                <Route path="/invest/users/search" element={<UserSearch />} />
                <Route path="/invest/users/:userId" element={<UserDetail />} />

                <Route path="/documents" element={<Documents />} />

                <Route path="/money-movement" element={<Navigate to="/money-movement/transactions-balances" replace />} />
                <Route path="/money-movement/transactions-balances" element={<TransactionsBalances />} />

                <Route path="/users/manage" element={<UserManagement />} />

                <Route path="/withdrawals" element={<Navigate to="/invest/withdrawals" replace />} />
                <Route path="/withdrawals/:withdrawalId" element={<WithdrawalRedirect />} />
                <Route path="/users/search" element={<Navigate to="/invest/users/search" replace />} />
                <Route path="/users/:userId" element={<UserRedirect />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
