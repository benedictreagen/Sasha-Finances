import React, { useState } from 'react';
import { Transaction, ListsConfig, GoogleConnectionState, ThemeMode } from '../types';
import { formatIDR } from '../excelGenerator';
import { getThemeTokens } from '../theme';
import { Language, t, formatControlledValue } from '../i18n';
import { 
  Plus, 
  Trash2, 
  Edit3,
  Search, 
  ArrowUpDown, 
  Download, 
  FileSpreadsheet, 
  ArrowRightLeft,
  RefreshCw,
  ExternalLink,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { AddTransactionModal } from './AddTransactionModal';
import { CsvImportModal } from './CsvImportModal';

interface TransactionsViewProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'income' | 'expense'>) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  listsConfig: ListsConfig;
  onExportExcel: () => void;
  theme?: ThemeMode;
  connectionState?: GoogleConnectionState;
  spreadsheetTitle?: string;
  isSyncing?: boolean;
  onRefreshSync?: () => Promise<void>;
  onConnectGoogleSheets?: () => Promise<void>;
  spreadsheetUrl?: string | null;
  lang?: Language;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  listsConfig,
  onExportExcel,
  theme = 'dark',
  connectionState = 'not_connected',
  spreadsheetTitle = 'Sasha Finance',
  isSyncing = false,
  onRefreshSync,
  onConnectGoogleSheets,
  spreadsheetUrl,
  lang = 'id',
}) => {
  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Search, Filter & Sort State
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterAccount, setFilterAccount] = useState<string>('All');
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const cardBg = tokens.cardBg;
  const cardAlt = tokens.cardAlt;
  const labelColor = tokens.labelColor;
  const inputBg = tokens.inputBg;
  const tableHeaderBg = tokens.tableHeaderBg;
  const rowHoverBg = tokens.rowHoverBg;

  // Filter logic
  const filtered = transactions.filter((tx) => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchNotes = (tx.notes || '').toLowerCase().includes(q);
      const matchCat = tx.category.toLowerCase().includes(q);
      if (!matchDesc && !matchNotes && !matchCat) return false;
    }

    // Type filter
    if (filterType !== 'All' && tx.type !== filterType) return false;

    // Category filter
    if (filterCategory !== 'All' && tx.category !== filterCategory) return false;

    // Account filter
    if (filterAccount !== 'All' && tx.account !== filterAccount && tx.toAccount !== filterAccount) return false;

    // Month filter
    if (filterMonth !== 'All') {
      const txMonth = tx.date.split('-')[1];
      if (txMonth !== filterMonth) return false;
    }

    return true;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  const handleImportCsvData = (importedTransactions: Omit<Transaction, 'id' | 'income' | 'expense'>[]) => {
    importedTransactions.forEach((tx) => {
      onAddTransaction(tx);
    });
  };

  const isConnected = connectionState === 'connected';

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold font-heading">{t('transactionsTitle', lang)}</h1>
            {isConnected && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{spreadsheetTitle}</span>
              </span>
            )}
          </div>
          <p className={`text-xs mt-1 ${labelColor}`}>
            {t('transactionsSubtitle', lang)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Connection status specific sync actions */}
          {connectionState === 'connected' ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onRefreshSync}
                disabled={isSyncing}
                title="Fetch latest updates from Google Sheets"
                className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${cardAlt} hover:bg-black/5 dark:hover:bg-white/5 flex items-center space-x-1.5 disabled:opacity-50`}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? (lang === 'id' ? 'Menyinkronkan...' : 'Syncing...') : (lang === 'id' ? 'Segarkan Sinkronisasi' : 'Refresh Sync')}</span>
              </button>

              {spreadsheetUrl && (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open permanent Google Sheet in new tab"
                  className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${cardAlt} hover:bg-black/5 dark:hover:bg-white/5 text-emerald-600 dark:text-emerald-400`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ) : connectionState === 'auth_required' ? (
            <button
              type="button"
              onClick={onConnectGoogleSheets}
              disabled={isSyncing}
              title="Sign in with Google to resume sync"
              className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 flex items-center space-x-1.5`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{lang === 'id' ? 'Masuk untuk Sinkron' : 'Sign In to Sync'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnectGoogleSheets}
              disabled={isSyncing}
              title="Connect permanent Google Spreadsheet"
              className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${cardAlt} hover:bg-black/5 dark:hover:bg-white/5 flex items-center space-x-1.5 text-amber-500`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{lang === 'id' ? 'Hubungkan Google Sheets' : 'Connect Google Sheets'}</span>
            </button>
          )}

          <button
            onClick={() => setIsCsvModalOpen(true)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${cardAlt} hover:bg-black/5 dark:hover:bg-white/5`}
          >
            {t('importCsv', lang)}
          </button>

          <button
            onClick={onExportExcel}
            title="Download optional offline backup (.xlsx)"
            className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${cardAlt} hover:bg-black/5 dark:hover:bg-white/5 flex items-center space-x-1.5`}
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('exportBackup', lang)}</span>
          </button>

          <button
            onClick={() => {
              setEditingTransaction(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addTransaction', lang)}</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className={`p-4 rounded-2xl border shadow-xs space-y-3 ${cardBg}`}>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-2.5 w-4 h-4 ${labelColor}`} />
            <input
              type="text"
              placeholder={t('searchPlaceholder', lang)}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
            />
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <ArrowUpDown className={`w-4 h-4 ${labelColor}`} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none ${inputBg}`}
            >
              <option value="date-desc">{t('dateDesc', lang)}</option>
              <option value="date-asc">{t('dateAsc', lang)}</option>
              <option value="amount-desc">{t('amountDesc', lang)}</option>
              <option value="amount-asc">{t('amountAsc', lang)}</option>
            </select>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-inherit">
          <div>
            <label className={`block text-[11px] mb-1 font-medium ${labelColor}`}>{t('type', lang)}</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${inputBg}`}
            >
              <option value="All">{t('all', lang)} {t('type', lang)}</option>
              {listsConfig.types.map((tVal) => (
                <option key={tVal} value={tVal}>{formatControlledValue('type', tVal, lang)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-[11px] mb-1 font-medium ${labelColor}`}>{t('category', lang)}</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${inputBg}`}
            >
              <option value="All">{t('allCategories', lang)}</option>
              {listsConfig.categories.map((c) => (
                <option key={c} value={c}>{formatControlledValue('category', c, lang)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-[11px] mb-1 font-medium ${labelColor}`}>{t('account', lang)}</label>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${inputBg}`}
            >
              <option value="All">{t('allAccounts', lang)}</option>
              {listsConfig.accounts.map((a) => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-[11px] mb-1 font-medium ${labelColor}`}>{t('month', lang)}</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${inputBg}`}
            >
              <option value="All">{t('allMonths', lang)}</option>
              <option value="08">{lang === 'id' ? 'Agustus' : 'August'} (08)</option>
              <option value="09">{lang === 'id' ? 'September' : 'September'} (09)</option>
              <option value="10">{lang === 'id' ? 'Oktober' : 'October'} (10)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Records Count & Status */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className={labelColor}>
          {lang === 'id' 
            ? <>Menampilkan <strong>{sorted.length}</strong> dari {transactions.length} transaksi</>
            : <>Showing <strong>{sorted.length}</strong> of {transactions.length} transactions</>}
        </span>
        {(search || filterType !== 'All' || filterCategory !== 'All' || filterAccount !== 'All' || filterMonth !== 'All') && (
          <button
            onClick={() => {
              setSearch('');
              setFilterType('All');
              setFilterCategory('All');
              setFilterAccount('All');
              setFilterMonth('All');
            }}
            className="text-amber-500 hover:underline cursor-pointer font-medium"
          >
            {lang === 'id' ? 'Hapus Filter Aktif' : 'Clear Active Filters'}
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b border-inherit font-semibold ${tableHeaderBg}`}>
                <th className="py-3 px-4">{t('date', lang)}</th>
                <th className="py-3 px-4">{t('description', lang)}</th>
                <th className="py-3 px-4">{t('type', lang)}</th>
                <th className="py-3 px-4">{t('category', lang)}</th>
                <th className="py-3 px-4">{t('account', lang)}</th>
                <th className="py-3 px-4">{t('paymentMethod', lang)}</th>
                <th className="py-3 px-4">{t('purpose', lang)}</th>
                <th className="py-3 px-4 text-right">{t('amount', lang)}</th>
                <th className="py-3 px-4 text-center">{t('actions', lang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`py-12 text-center ${labelColor}`}>
                    {lang === 'id' ? 'Tidak ada transaksi yang cocok ditemukan.' : 'No matching transactions found. Try adjusting filters or record a new transaction.'}
                  </td>
                </tr>
              ) : (
                sorted.map((tx) => {
                  const isIncome = tx.type === 'Income';
                  const isTransfer = tx.type === 'Transfer';

                  return (
                    <tr key={tx.id} className={`transition-colors ${rowHoverBg}`}>
                      <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3.5 px-4 font-medium max-w-xs">
                        <div className="truncate">{tx.description}</div>
                        {tx.notes && (
                          <div className={`text-[10px] truncate ${labelColor}`}>{tx.notes}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : isTransfer
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {formatControlledValue('type', tx.type, lang)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md border ${cardAlt} font-medium text-[11px]`}>
                          {formatControlledValue('category', tx.category, lang)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium">{tx.account}</div>
                        {isTransfer && (tx.toAccount || tx.context) && (
                          <div className={`text-[10px] flex items-center ${labelColor}`}>
                            <ArrowRightLeft className="w-2.5 h-2.5 mr-0.5" />
                            {tx.toAccount || tx.context}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px]">
                        {formatControlledValue('paymentMethod', tx.paymentMethod, lang)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-[11px] ${labelColor}`}>
                          {formatControlledValue('purpose', tx.purpose, lang)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold whitespace-nowrap">
                        <span
                          className={
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isTransfer
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {isIncome ? '+' : isTransfer ? '' : '-'}{formatIDR(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => {
                              setEditingTransaction(tx);
                              setIsAddModalOpen(true);
                            }}
                            className={`p-1.5 rounded-lg hover:bg-amber-500/10 hover:text-amber-500 cursor-pointer transition-colors ${labelColor}`}
                            title="Edit transaction"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            className={`p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer transition-colors ${labelColor}`}
                            title="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onAddTransaction={onAddTransaction}
        onEditTransaction={onEditTransaction}
        initialTransaction={editingTransaction}
        listsConfig={listsConfig}
        theme={theme}
        lang={lang}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImport={handleImportCsvData}
      />
    </div>
  );
};
