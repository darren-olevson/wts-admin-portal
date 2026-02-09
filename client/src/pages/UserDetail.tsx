import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Tabs from '../components/Tabs';
import UserDetailsTab from '../components/UserDetailsTab';
import UserDocumentsTab from '../components/UserDocumentsTab';
import AccountOverview from '../components/AccountOverview';
import UserWithdrawalsTab from '../components/UserWithdrawalsTab';
import {
  accountsApi,
  usersApi,
  withdrawalsApi,
  Withdrawal,
  AccountSummary,
  UserDocument,
} from '../lib/api';
import { InvestActivityTransaction } from '../components/InvestActivityTable';
import './UserDetail.css';

/** User detail information displayed on this page */
interface UserDetailInfo {
  id: string;
  wbClientId?: string;
  displayName?: string;
  dateOfBirth?: string;
  email: string;
  name?: string;
  citizenship?: string;
  countryOfResidence?: string;
  countryOfTaxResidence?: string;
  phoneNumber?: string;
  address?: string;
  accountId: string;
  brokerageAccountNumber: string;
  brokerageId: string;
  goalId: string;
}

function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<UserDetailInfo | null>(null);
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null);
  const [transactions, setTransactions] = useState<InvestActivityTransaction[]>([]);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const buildWithdrawalHistoryRange = () => {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 10);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const userData = await usersApi.get(userId);
        setUser({
          id: userData.id,
          wbClientId: userData.wbClientId,
          displayName: userData.displayName,
          dateOfBirth: userData.dateOfBirth,
          email: userData.email,
          name: userData.name,
          citizenship: userData.citizenship,
          countryOfResidence: userData.countryOfResidence,
          countryOfTaxResidence: userData.countryOfTaxResidence,
          phoneNumber: userData.phoneNumber,
          address: userData.address,
          accountId: userData.accountId,
          brokerageAccountNumber: userData.brokerageAccountNumber,
          brokerageId: userData.brokerageId,
          goalId: userData.goalId,
        });

        const { startDate, endDate } = buildWithdrawalHistoryRange();
        const [summary, docs, txs, userWithdrawals] = await Promise.all([
          usersApi.getAccountSummary(userId),
          usersApi.getDocuments(userId),
          accountsApi.getTransactions(userData.accountId),
          withdrawalsApi.list({
            accountId: userData.accountId,
            startDate,
            endDate,
          }),
        ]);

        setAccountSummary(summary);
        setDocuments(docs);
        setTransactions(txs);
        setWithdrawals(userWithdrawals);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load user details';
        setError(errorMessage);
        console.error('Error fetching user details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, refreshKey]);

  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey((prev) => prev + 1);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'withdrawals:refresh') {
        setRefreshKey((prev) => prev + 1);
      }
    };

    window.addEventListener('withdrawals:refresh', handleRefresh);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('withdrawals:refresh', handleRefresh);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  if (loading) {
    return <div className="user-detail-loading">Loading user details...</div>;
  }

  if (error) {
    return <div className="user-detail-error">Error: {error}</div>;
  }

  if (!user) {
    return <div className="user-detail-error">User not found</div>;
  }

  const userDetailsTab = (
    <UserDetailsTab
      user={{
        displayName: user.displayName || user.name || 'N/A',
        dateOfBirth: user.dateOfBirth || 'N/A',
        email: user.email,
        citizenship: user.citizenship,
        countryOfResidence: user.countryOfResidence || 'N/A',
        countryOfTaxResidence: user.countryOfTaxResidence || 'N/A',
        phoneNumber: user.phoneNumber,
        address: user.address,
      }}
    />
  );

  const documentsTab = <UserDocumentsTab documents={documents} />;
  const accountOverviewTab = (
    <AccountOverview
      accountId={user.accountId}
      transactions={transactions}
    />
  );
  const selectedWithdrawalId = searchParams.get('withdrawalId');
  const tabParam = searchParams.get('tab');
  const defaultTab = tabParam === 'withdrawals' || tabParam === 'account-overview' ? tabParam : undefined;
  const withdrawalsTab = (
    <UserWithdrawalsTab
      withdrawals={withdrawals}
      selectedWithdrawalId={selectedWithdrawalId}
      userId={user.id}
      onRefresh={() => setRefreshKey((prev) => prev + 1)}
    />
  );

  return (
    <div className="user-detail">
      <Link to="/invest/users/search" className="back-button">
        <ArrowLeft size={20} />
        Back to Search
      </Link>

      <div className="user-detail-header">
        <div>
          <h1 className="user-detail-title">
            {user.displayName || user.name || 'User Details'}
          </h1>
          <p className="user-detail-subtitle">
            {user.wbClientId ? `WTS User ID: ${user.wbClientId}` : user.id}
          </p>
        </div>
      </div>

      <Tabs
        key={defaultTab ?? 'default'}
        defaultActiveId={defaultTab}
        tabs={[
          { id: 'user-details', label: 'User Details', content: userDetailsTab },
          { id: 'account-overview', label: 'Account Overview', content: accountOverviewTab },
          { id: 'withdrawals', label: 'Withdrawals', content: withdrawalsTab },
          { id: 'documents', label: 'Documents', content: documentsTab },
        ]}
      />
    </div>
  );
}

export default UserDetail;
