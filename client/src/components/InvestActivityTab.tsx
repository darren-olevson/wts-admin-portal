import AccountSummaryHeader from './AccountSummaryHeader';
import InvestActivityTable, { InvestActivityTransaction } from './InvestActivityTable';
import './InvestActivityTab.css';

interface InvestActivityTabProps {
  accountSummary: {
    totalEquity?: number;
    gains?: number;
    cash?: number;
    positions?: number;
    availableToWithdraw?: number;
    target?: number;
    sleeveType?: string;
    brokerageAccountNumber?: string;
    brokerageAccountId?: string;
    accountStatus?: string;
  };
  transactions: InvestActivityTransaction[];
}

function InvestActivityTab({ accountSummary, transactions }: InvestActivityTabProps) {
  return (
    <div className="invest-activity-tab">
      <AccountSummaryHeader summary={accountSummary} />
      <InvestActivityTable
        transactions={transactions}
        totalEquity={
          accountSummary.totalEquity ??
          ((accountSummary.cash ?? 0) + (accountSummary.positions ?? 0))
        }
        seasonedCash={accountSummary.availableToWithdraw}
      />
    </div>
  );
}

export default InvestActivityTab;
