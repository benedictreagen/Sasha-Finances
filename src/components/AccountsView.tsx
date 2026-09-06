import React, { useState } from 'react';
import { AccountInfo, Transaction, ListsConfig, ThemeMode, Deposit } from '../types';
import { formatIDR } from '../excelGenerator';
import { getThemeTokens } from '../theme';
import { Language, t } from '../i18n';
import { 
  Wallet, 
  Landmark, 
  Smartphone, 
  ArrowRightLeft, 
  CheckCircle2, 
  ShieldCheck,
  Edit2,
  Plus,
  Trash2,
  Archive,
  Info,
  AlertTriangle,
  X
} from 'lucide-react';

interface AccountsViewProps {
  accounts: AccountInfo[];
  transactions: Transaction[];
  deposits?: Deposit[];
  listsConfig: ListsConfig;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'income' | 'expense'>) => void;
  onUpdateAccount?: (oldName: string, updatedAcc: AccountInfo) => void;
  onAddAccount?: (newAcc: AccountInfo) => void;
  onDeleteAccount?: (accountName: string) => void;
  theme?: ThemeMode;
  lang?: Language;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  transactions,
  deposits = [],
  listsConfig,
  onAddTransaction,
  onUpdateAccount,
  onAddAccount,
  onDeleteAccount,
  theme = 'dark',
  lang = 'id',
}) => {
  const tokens = getThemeTokens(theme);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [fromAccount, setFromAccount] = useState(accounts[0]?.name || 'Blu');
  const [toAccount, setToAccount] = useState(accounts[1]?.name || 'Gopay');
  const [transferAmount, setTransferAmount] = useState('100000');
  const [transferNotes, setTransferNotes] = useState('Top up e-wallet');

  // Edit Account State
  const [editingAccount, setEditingAccount] = useState<AccountInfo | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'Bank' | 'Cash' | 'E-Wallet'>('Bank');
  const [editOpeningBalance, setEditOpeningBalance] = useState('');
  const [editClassification, setEditClassification] = useState('Operasional / Likuid');
  const [editIsArchived, setEditIsArchived] = useState(false);
  const [editError, setEditError] = useState('');

  // Add Account State
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addType, setAddType] = useState<'Bank' | 'Cash' | 'E-Wallet'>('Bank');
  const [addOpeningBalance, setAddOpeningBalance] = useState('0');
  const [addClassification, setAddClassification] = useState('Operasional / Likuid');
  const [addError, setAddError] = useState('');

  // Tab filter: 'active' | 'all' | 'archived'
  const [accountFilter, setAccountFilter] = useState<'active' | 'all' | 'archived'>('active');

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
    const computedBalance = (acc.openingBalance || 0) + incomeInflow - expenseOutflow + netTransfers + adjustments;

    // References count
    const txReferences = transactions.filter(t => t.account === acc.name || t.toAccount === acc.name).length;
    const depReferences = deposits.filter(d => d.sourceAccount === acc.name).length;

    return {
      ...acc,
      classification: acc.classification || (acc.type === 'Cash' ? 'Operasional / Likuid' : acc.type === 'Bank' ? 'Tabungan & Operasional' : 'Pembayaran & E-Wallet'),
      incomeInflow,
      expenseOutflow,
      transferIn,
      transferOut,
      netTransfers,
      computedBalance,
      txReferences,
      depReferences,
    };
  });

  const activeAccountsCount = detailedAccounts.filter(a => !a.isArchived).length;
  const archivedAccountsCount = detailedAccounts.filter(a => a.isArchived).length;

  const filteredAccounts = detailedAccounts.filter(a => {
    if (accountFilter === 'active') return !a.isArchived;
    if (accountFilter === 'archived') return a.isArchived;
    return true;
  });

  const totalBalance = detailedAccounts
    .filter(a => !a.isArchived)
    .reduce((sum, a) => sum + a.computedBalance, 0);
  const totalOpening = detailedAccounts
    .filter(a => !a.isArchived)
    .reduce((sum, a) => sum + (a.openingBalance || 0), 0);
  const totalInflow = detailedAccounts
    .filter(a => !a.isArchived)
    .reduce((sum, a) => sum + a.incomeInflow, 0);
  const totalOutflow = detailedAccounts
    .filter(a => !a.isArchived)
    .reduce((sum, a) => sum + a.expenseOutflow, 0);

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

  const handleOpenEditModal = (acc: typeof detailedAccounts[0]) => {
    setEditingAccount(acc);
    setEditName(acc.name);
    setEditType(acc.type as any);
    setEditOpeningBalance(acc.openingBalance.toString());
    setEditClassification(acc.classification);
    setEditIsArchived(!!acc.isArchived);
    setEditError('');
  };

  const handleSaveEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError(lang === 'id' ? 'Nama rekening tidak boleh kosong.' : 'Account name cannot be empty.');
      return;
    }

    // If name changed, verify no duplicate
    if (trimmedName.toLowerCase() !== editingAccount.name.toLowerCase()) {
      const exists = accounts.some(a => a.name.toLowerCase() === trimmedName.toLowerCase());
      if (exists) {
        setEditError(lang === 'id' ? 'Nama rekening sudah digunakan.' : 'Account name already in use.');
        return;
      }
    }

    const openingNum = parseFloat(editOpeningBalance.replace(/[^0-9.-]+/g, '')) || 0;

    const updated: AccountInfo = {
      name: trimmedName,
      type: editType,
      openingBalance: openingNum,
      balance: openingNum, // App will recompute balance dynamically
      classification: editClassification,
      isArchived: editIsArchived,
    };

    if (onUpdateAccount) {
      onUpdateAccount(editingAccount.name, updated);
    }

    setEditingAccount(null);
  };

  const handleSaveAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = addName.trim();
    if (!trimmedName) {
      setAddError(lang === 'id' ? 'Nama rekening tidak boleh kosong.' : 'Account name cannot be empty.');
      return;
    }

    const exists = accounts.some(a => a.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      setAddError(lang === 'id' ? 'Nama rekening sudah ada.' : 'Account name already exists.');
      return;
    }

    const openingNum = parseFloat(addOpeningBalance.replace(/[^0-9.-]+/g, '')) || 0;

    const newAcc: AccountInfo = {
      name: trimmedName,
      type: addType,
      openingBalance: openingNum,
      balance: openingNum,
      classification: addClassification,
      isArchived: false,
    };

    if (onAddAccount) {
      onAddAccount(newAcc);
    }

    setAddName('');
    setAddOpeningBalance('0');
    setIsAddAccountModalOpen(false);
  };

  const handleDeleteCurrentAccount = () => {
    if (!editingAccount) return;
    const refCount = (editingAccount.txReferences || 0) + (editingAccount.depReferences || 0);
    if (refCount > 0) {
      const confirmForce = window.confirm(
        lang === 'id'
          ? `Akun "${editingAccount.name}" memiliki ${refCount} data transaksi/deposito terkait. Menghapus akun dapat merusak riwayat transaksi. Sangat disarankan untuk memilih 'Arsipkan Akun' saja.\n\nApakah Anda benar-benar yakin ingin menghapusnya secara permanen?`
          : `Account "${editingAccount.name}" has ${refCount} linked transaction/deposit records. Archiving is recommended over permanent deletion.\n\nAre you sure you want to proceed with permanent deletion?`
      );
      if (!confirmForce) return;
    }

    if (onDeleteAccount) {
      onDeleteAccount(editingAccount.name);
    }
    setEditingAccount(null);
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

  const classificationOptions = [
    'Operasional / Likuid',
    'Tabungan',
    'Investasi',
    'Dana Darurat',
    'Kebutuhan (Need)',
    'Keinginan (Want)',
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">{t('accountsTitle', lang)}</h1>
          <p className={`text-xs mt-1 ${labelColor}`}>
            {lang === 'id' 
              ? `Terekonsiliasi di seluruh ${accounts.length} akun finansial. Anda dapat menambah, mengubah saldo awal, atau mengedit konfigurasi rekening kapan saja.` 
              : `Reconciled across ${accounts.length} financial accounts. Add, adjust opening balances, or edit configurations anytime.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddAccountModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl border border-amber-500/40 text-amber-500 hover:bg-amber-500/10 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addAccount', lang)}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsTransferModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors shadow-xs"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>{lang === 'id' ? 'Transfer Antar-Akun Cepat' : 'Quick Inter-Account Transfer'}</span>
          </button>
        </div>
      </div>

      {/* Aggregate Overview Card */}
      <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
              {lang === 'id' ? 'Kekayaan Bersih Konsolidasi (Akun Aktif)' : 'Consolidated Net Worth (Active Accounts)'}
            </span>
            <div className="text-3xl font-light mt-1 font-heading tracking-tight">{formatIDR(totalBalance)}</div>
            <div className="flex items-center space-x-2 mt-2">
              <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> {lang === 'id' ? 'Terekonsiliasi langsung' : 'Reconciled in real-time'}
              </span>
              <span className={`text-xs ${labelColor}`}>• {lang === 'id' ? 'Saldo Awal' : 'Opening'}: {formatIDR(totalOpening)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-inherit pt-4 lg:pt-0 lg:pl-6">
            <div>
              <div className={`text-[10px] uppercase font-semibold ${labelColor}`}>{lang === 'id' ? 'Total Pemasukan' : 'Total Inflow'}</div>
              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                +{formatIDR(totalInflow)}
              </div>
            </div>
            <div>
              <div className={`text-[10px] uppercase font-semibold ${labelColor}`}>{lang === 'id' ? 'Total Pengeluaran' : 'Total Outflow'}</div>
              <div className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                -{formatIDR(totalOutflow)}
              </div>
            </div>
            <div>
              <div className={`text-[10px] uppercase font-semibold ${labelColor}`}>{lang === 'id' ? 'Total Akun' : 'Total Accounts'}</div>
              <div className="text-sm font-semibold mt-0.5">{activeAccountsCount} {lang === 'id' ? 'Aktif' : 'Active'} {archivedAccountsCount > 0 ? `(${archivedAccountsCount} Arsip)` : ''}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Filters Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setAccountFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              accountFilter === 'active'
                ? 'bg-amber-500 text-black'
                : `border ${cardAlt} ${labelColor} hover:text-inherit`
            }`}
          >
            {lang === 'id' ? 'Akun Aktif' : 'Active'} ({activeAccountsCount})
          </button>
          <button
            type="button"
            onClick={() => setAccountFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              accountFilter === 'all'
                ? 'bg-amber-500 text-black'
                : `border ${cardAlt} ${labelColor} hover:text-inherit`
            }`}
          >
            {lang === 'id' ? 'Semua Akun' : 'All Accounts'} ({detailedAccounts.length})
          </button>
          {archivedAccountsCount > 0 && (
            <button
              type="button"
              onClick={() => setAccountFilter('archived')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                accountFilter === 'archived'
                  ? 'bg-amber-500 text-black'
                  : `border ${cardAlt} ${labelColor} hover:text-inherit`
              }`}
            >
              {lang === 'id' ? 'Diarsipkan' : 'Archived'} ({archivedAccountsCount})
            </button>
          )}
        </div>
        <span className={`text-xs ${labelColor} hidden sm:inline`}>
          {lang === 'id' ? 'Klik "Ubah" pada kartu untuk mengedit saldo awal atau nama akun' : 'Click "Edit" on any card to update opening balance or name'}
        </span>
      </div>

      {/* Reconciled Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.map((acc) => (
          <div 
            key={acc.name} 
            className={`p-5 rounded-2xl border shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${cardBg} ${
              acc.isArchived ? 'opacity-70 border-dashed' : ''
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl border ${cardAlt}`}>
                    {getAccountIcon(acc.type)}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold font-heading flex items-center space-x-1.5">
                      <span>{acc.name}</span>
                      {acc.isArchived && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium">
                          {t('archived', lang)}
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${cardAlt} ${labelColor}`}>
                        {acc.type}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 font-medium">
                        {acc.classification}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Actions: Edit button */}
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(acc)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors flex items-center space-x-1 ${cardAlt} hover:border-amber-500 hover:text-amber-500`}
                  title={t('editAccount', lang)}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{t('edit', lang)}</span>
                </button>
              </div>

              <div className="mt-5">
                <span className={`text-[10px] uppercase font-semibold ${labelColor}`}>
                  {lang === 'id' ? 'Saldo Terkini Terekonsiliasi' : 'Current Reconciled Balance'}
                </span>
                <div className="text-xl font-bold font-heading mt-0.5">
                  {formatIDR(acc.computedBalance)}
                </div>
              </div>

              <div className={`mt-4 pt-3 border-t border-inherit space-y-1.5 text-xs ${labelColor}`}>
                <div className="flex justify-between">
                  <span>{t('startingBalance', lang)}</span>
                  <span className="font-medium text-inherit">{formatIDR(acc.openingBalance)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>{lang === 'id' ? 'Pemasukan / Inflow' : 'Income / Inflow'}</span>
                  <span className="font-medium">+{formatIDR(acc.incomeInflow)}</span>
                </div>
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>{lang === 'id' ? 'Pengeluaran / Outflow' : 'Expense / Outflow'}</span>
                  <span className="font-medium">-{formatIDR(acc.expenseOutflow)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'id' ? 'Transfer Bersih' : 'Net Transfers'}</span>
                  <span className={`font-medium ${acc.netTransfers >= 0 ? 'text-blue-500' : 'text-amber-500'}`}>
                    {acc.netTransfers >= 0 ? '+' : ''}{formatIDR(acc.netTransfers)}
                  </span>
                </div>
              </div>
            </div>

            <div className={`mt-4 pt-3 border-t border-inherit flex items-center justify-between text-[11px] ${labelColor}`}>
              <span>{acc.txReferences} {lang === 'id' ? 'transaksi' : 'txs'}</span>
              {acc.isArchived ? (
                <span className="text-amber-500 font-medium flex items-center">
                  <Archive className="w-3 h-3 mr-1" /> {t('archived', lang)}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center font-medium">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> {lang === 'id' ? 'Aktif' : 'Active'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl p-6 ${cardBg}`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold font-heading">{t('editAccount', lang)}</h3>
                  <p className={`text-xs ${labelColor}`}>
                    {lang === 'id' ? 'Ubah parameter dan saldo awal akun' : 'Modify account parameters and opening balance'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${labelColor}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditAccount} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                  {t('accountName', lang)}
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border font-medium ${inputBg}`}
                />
                {editName.trim() !== editingAccount.name && (
                  <p className="text-[11px] text-amber-500 mt-1">
                    {lang === 'id' 
                      ? `Semua transaksi (${editingAccount.txReferences || 0}) dan deposito (${editingAccount.depReferences || 0}) terkait akun ini akan otomatis diperbarui ke nama baru.` 
                      : `All ${editingAccount.txReferences || 0} transactions and ${editingAccount.depReferences || 0} deposits will safely update to the new name.`}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                    {t('accountType', lang)}
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-medium ${inputBg}`}
                  >
                    <option value="Bank">Bank</option>
                    <option value="Cash">Cash (Tunai)</option>
                    <option value="E-Wallet">E-Wallet</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                    {t('accountClassification', lang)}
                  </label>
                  <select
                    value={editClassification}
                    onChange={(e) => setEditClassification(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-medium ${inputBg}`}
                  >
                    {classificationOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                  {t('startingBalance', lang)} (IDR)
                </label>
                <input
                  type="number"
                  required
                  value={editOpeningBalance}
                  onChange={(e) => setEditOpeningBalance(e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border font-mono font-medium ${inputBg}`}
                />
                <div className={`flex items-start space-x-1.5 mt-1.5 text-[11px] ${labelColor}`}>
                  <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{t('openingBalanceNotice', lang)}</span>
                </div>
              </div>

              {/* Archive / Deactivate Checkbox */}
              <div className={`p-3.5 rounded-xl border ${cardAlt} flex items-center justify-between`}>
                <div>
                  <span className="text-xs font-semibold">{t('archiveAccount', lang)}</span>
                  <p className={`text-[11px] ${labelColor} mt-0.5`}>
                    {lang === 'id' 
                      ? 'Sembunyikan akun dari pilihan transaksi baru tanpa menghapus data masa lalu.' 
                      : 'Hide account from new transaction dropdowns without losing past transaction history.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editIsArchived}
                  onChange={(e) => setEditIsArchived(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-inherit flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDeleteCurrentAccount}
                  className="px-3.5 py-2 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-medium cursor-pointer transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('delete', lang)}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className={`px-4 py-2 rounded-xl border text-xs font-medium cursor-pointer ${cardAlt}`}
                  >
                    {t('cancel', lang)}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                  >
                    {t('save', lang)}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border shadow-xl p-6 ${cardBg}`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold font-heading">{t('addAccount', lang)}</h3>
                  <p className={`text-xs ${labelColor}`}>
                    {lang === 'id' ? 'Tambahkan rekening bank, dompet digital, atau kas baru' : 'Add a new bank account, e-wallet, or cash reserve'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAccountModalOpen(false)}
                className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${labelColor}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddAccount} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                  {t('accountName', lang)}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BCA Digital, Bank Mandiri, ShopeePay..."
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border font-medium ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                    {t('accountType', lang)}
                  </label>
                  <select
                    value={addType}
                    onChange={(e) => setAddType(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-medium ${inputBg}`}
                  >
                    <option value="Bank">Bank</option>
                    <option value="Cash">Cash (Tunai)</option>
                    <option value="E-Wallet">E-Wallet</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                    {t('accountClassification', lang)}
                  </label>
                  <select
                    value={addClassification}
                    onChange={(e) => setAddClassification(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-medium ${inputBg}`}
                  >
                    {classificationOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                  {t('startingBalance', lang)} (IDR)
                </label>
                <input
                  type="number"
                  required
                  value={addOpeningBalance}
                  onChange={(e) => setAddOpeningBalance(e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border font-mono font-medium ${inputBg}`}
                />
                <div className={`flex items-start space-x-1.5 mt-1.5 text-[11px] ${labelColor}`}>
                  <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{t('openingBalanceNotice', lang)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-inherit flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border text-xs font-medium cursor-pointer ${cardAlt}`}
                >
                  {t('cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                >
                  {t('addAccount', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border shadow-xl p-6 ${cardBg}`}>
            <div className="flex items-center space-x-2.5 pb-3 border-b border-inherit">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold font-heading">
                  {lang === 'id' ? 'Transfer Antar-Akun' : 'Inter-Account Transfer'}
                </h3>
                <p className={`text-xs ${labelColor}`}>
                  {lang === 'id' ? 'Total saldo konsolidasi akan tetap sama' : 'Total consolidated balance will remain unchanged'}
                </p>
              </div>
            </div>

            <form onSubmit={handleTransferSubmit} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>
                  {lang === 'id' ? 'Akun Sumber (Dari)' : 'Source Account (From)'}
                </label>
                <select
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-medium ${inputBg}`}
                >
                  {accounts.filter(a => !a.isArchived).map((a) => (
                    <option key={a.name} value={a.name}>
                      {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>
                  {lang === 'id' ? 'Akun Tujuan (Ke)' : 'Destination Account (To)'}
                </label>
                <select
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-medium ${inputBg}`}
                >
                  {accounts.filter(a => !a.isArchived).map((a) => (
                    <option key={a.name} value={a.name}>
                      {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>
                  {lang === 'id' ? 'Jumlah Transfer (IDR)' : 'Transfer Amount (IDR)'}
                </label>
                <input
                  type="number"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-medium ${inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>
                  {lang === 'id' ? 'Catatan Mutasi' : 'Transfer Notes'}
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-medium ${inputBg}`}
                />
              </div>

              <div className="pt-3 border-t border-inherit flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border text-xs font-medium cursor-pointer ${cardAlt}`}
                >
                  {t('cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                >
                  {lang === 'id' ? 'Kirim Transfer' : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
