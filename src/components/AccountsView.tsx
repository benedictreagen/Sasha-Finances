import React, { useState } from 'react';
import { AccountInfo, Transaction, ListsConfig, ThemeMode } from '../types';
import { formatIDR } from '../excelGenerator';
import { getThemeTokens } from '../theme';
import { 
  Wallet, 
  Landmark, 
  Smartphone, 
  ArrowRightLeft, 
  CheckCircle2, 
  ShieldCheck
} from 'lucide-react';

interface AccountsViewProps {
  accounts: AccountInfo[];
  transactions: Transaction[];
  listsConfig: ListsConfig;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'income' | 'expense'>) => void;
  theme?: ThemeMode;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  transactions,
  listsConfig,
  onAddTransaction,
  theme = 'dark',
}) => {
  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [fromAccount, setFromAccount] = useState(accounts[0]?.name || 'Blu');
  const [toAccount, setToAccount] = useState(accounts[1]?.name || 'Gopay');
  const [transferAmount, setTransferAmount] = useState('100000');
  const [transferNotes, setTransferNotes] = useState('Top up e-wallet');

  // Compute detailed metrics for each account
  const detailedAccounts = accounts.map((acc) => {
    let incomeInflow = 0;
    let expenseOutflow = 0;
    let transferIn = 0;
    let transferOut = 0;
    let adjustments = 0;

    transactions.forEach((tx) => {
      // Source account transactions
      if (tx.account === acc.name) {
        if (tx.type === 'Income') incomeInflow += tx.amount;
        else if (tx.type === 'Expense') expenseOutflow += tx.amount;
        else if (tx.type === 'Transfer') transferOut += tx.amount;
        else if (tx.type === 'Adjustment') adjustments += tx.amount;
      }

      // Incoming transfers to this account
      const destAccount = tx.toAccount || (tx.type === 'Transfer' && tx.context?.match(/To:\s*([^,\s]+)/i)?.[1]);
      if (tx.type === 'Transfer' && destAccount === acc.name) {
        transferIn += tx.amount;
      }
    });

    const netTransfers = transferIn - transferOut;
    const computedBalance = acc.openingBalance + incomeInflow - expenseOutflow + netTransfers + adjustments;

    return {
      ...acc,
      incomeInflow,
      expenseOutflow,
      transferIn,
      transferOut,
      netTransfers,
      computedBalance,
    };
  });

  const totalBalance = detailedAccounts.reduce((sum, a) => sum + a.computedBalance, 0);
  const totalOpening = accounts.reduce((sum, a) => sum + a.openingBalance, 0);
  const totalInflow = detailedAccounts.reduce((sum, a) => sum + a.incomeInflow, 0);
  const totalOutflow = detailedAccounts.reduce((sum, a) => sum + a.expenseOutflow, 0);

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount.replace(/[^0-9.-]+/g, ''));
    if (isNaN(amt) || amt <= 0 || fromAccount === toAccount) return;

    onAddTransaction({
      date: new Date().toISOString().split('T')[0],
      description: `Transfer: ${fromAccount} to ${toAccount}`,
      type: 'Transfer',
      category: 'Other',
      account: fromAccount,
      toAccount,
      paymentMethod: 'Transfer',
      amount: amt,
      context: `To: ${toAccount}`,
      purpose: 'Need',
      event: 'Personal',
      notes: transferNotes.trim(),
    });

    setIsTransferModalOpen(false);
  };

  const cardBg = tokens.cardBg;
  const cardAlt = tokens.cardAlt;
  const labelColor = tokens.labelColor;
  const inputBg = tokens.inputBg;

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'Bank':
        return <Landmark className="w-5 h-5 text-blue-500" />;
      case 'E-Wallet':
        return <Smartphone className="w-5 h-5 text-amber-500" />;
      default:
        return <Wallet className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Accounts & Balances</h1>
          <p className={`text-xs mt-1 ${labelColor}`}>
            Reconciled across {accounts.length} active financial accounts. Transfers do not alter net totals.
          </p>
        </div>
        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors shadow-xs"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Quick Inter-Account Transfer</span>
        </button>
      </div>

      {/* Aggregate Overview Card */}
      <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
              Consolidated Net Worth
            </span>
            <div className="text-3xl font-light mt-1 font-heading tracking-tight">{formatIDR(totalBalance)}</div>
            <div className="flex items-center space-x-2 mt-2">
              <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Reconciled in real-time
              </span>
              <span className={`text-xs ${labelColor}`}>• Opening: {formatIDR(totalOpening)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-inherit pt-4 lg:pt-0 lg:pl-6">
            <div>
              <div className={`text-[10px] uppercase font-semibold ${labelColor}`}>Total Inflow</div>
              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                +{formatIDR(totalInflow)}
              </div>
            </div>
            <div>
              <div className={`text-[10px] uppercase font-semibold ${labelColor}`}>Total Outflow</div>
              <div className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                -{formatIDR(totalOutflow)}
              </div>
            </div>
            <div>
              <div className={`text-[10px] uppercase font-semibold ${labelColor}`}>Total Accounts</div>
              <div className="text-sm font-semibold mt-0.5">{accounts.length} Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Reconciled Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {detailedAccounts.map((acc) => (
          <div key={acc.name} className={`p-5 rounded-2xl border shadow-xs transition-all hover:shadow-md ${cardBg}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl border ${cardAlt}`}>
                  {getAccountIcon(acc.type)}
                </div>
                <div>
                  <h3 className="text-base font-semibold font-heading">{acc.name}</h3>
                  <span className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${cardAlt} ${labelColor}`}>
                    {acc.type}
                  </span>
                </div>
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
              </span>
            </div>

            <div className="mt-5">
              <span className={`text-[10px] uppercase font-semibold ${labelColor}`}>Current Reconciled Balance</span>
              <div className="text-xl font-bold font-heading mt-0.5">
                {formatIDR(acc.computedBalance)}
              </div>
            </div>

            <div className={`mt-4 pt-3 border-t border-inherit space-y-1.5 text-xs ${labelColor}`}>
              <div className="flex justify-between">
                <span>Opening Balance</span>
                <span className="font-medium text-inherit">{formatIDR(acc.openingBalance)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Income / Inflow</span>
                <span className="font-medium">+{formatIDR(acc.incomeInflow)}</span>
              </div>
              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>Expense / Outflow</span>
                <span className="font-medium">-{formatIDR(acc.expenseOutflow)}</span>
              </div>
              <div className="flex justify-between">
                <span>Net Transfers</span>
                <span className={`font-medium ${acc.netTransfers >= 0 ? 'text-blue-500' : 'text-amber-500'}`}>
                  {acc.netTransfers >= 0 ? '+' : ''}{formatIDR(acc.netTransfers)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border shadow-xl p-6 ${cardBg}`}>
            <div className="flex items-center space-x-2.5 pb-3 border-b border-inherit">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold font-heading">Inter-Account Transfer</h3>
                <p className={`text-xs ${labelColor}`}>Total consolidated balance will remain unchanged</p>
              </div>
            </div>

            <form onSubmit={handleTransferSubmit} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>Source Account (From)</label>
                <select
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
                >
                  {accounts.map((a) => (
                    <option key={a.name} value={a.name}>{a.name} ({formatIDR(a.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>Destination Account (To)</label>
                <select
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
                >
                  {accounts.filter(a => a.name !== fromAccount).map((a) => (
                    <option key={a.name} value={a.name}>{a.name} ({formatIDR(a.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>Amount (IDR)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>Description / Notes</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="e.g. Top up e-wallet for lunch"
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className={`px-4 py-2 text-xs font-medium rounded-xl hover:bg-black/5 dark:hover:bg-white/5 ${labelColor}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-black transition-colors cursor-pointer"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
