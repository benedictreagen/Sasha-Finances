import React from 'react';
import { 
  FilterState, 
  Transaction, 
  AccountInfo, 
  SavingsGoal, 
  EmergencyFundData,
  ThemeMode,
  Deposit
} from '../types';
import { BannerConfig } from '../banner';
import { Language, t, formatControlledValue } from '../i18n';
import { BannerCover } from './BannerCover';
import { formatIDR, formatPercent } from '../excelGenerator';
import { getThemeTokens } from '../theme';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  ShieldAlert, 
  Award, 
  Calendar, 
  CreditCard,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Plus,
  RotateCcw,
  Landmark,
  ArrowRight,
  Coins
} from 'lucide-react';

interface DashboardViewProps {
  transactions: Transaction[];
  accounts: AccountInfo[];
  budgets: Record<string, number>;
  goals: SavingsGoal[];
  emergencyFund: EmergencyFundData;
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  onAddTransactionClick: () => void;
  theme?: ThemeMode;
  bannerConfig: BannerConfig;
  lang: Language;
  onOpenBannerSettings?: () => void;
  deposits?: Deposit[];
  onNavigateToDeposits?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  accounts,
  budgets,
  goals,
  emergencyFund,
  filter,
  setFilter,
  onAddTransactionClick,
  theme = 'dark',
  bannerConfig,
  lang,
  onOpenBannerSettings,
  deposits = [],
  onNavigateToDeposits,
}) => {
  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;
  const cardBg = tokens.cardBg;
  const cardAlt = tokens.cardAlt;
  const labelColor = tokens.labelColor;
  const inputBg = tokens.inputBg;
  const barBg = tokens.barBg;

  // Calculate Deposits & Total Assets
  const activeDeposits = deposits.filter((d) => d.status === 'Active');
  const totalDeposits = activeDeposits.reduce((sum, d) => sum + d.principal, 0);
  const totalEstimatedInterest = activeDeposits.reduce((sum, d) => sum + (d.estimatedInterest || 0), 0);
  const activePlatformsCount = new Set(activeDeposits.map((d) => d.platform)).size;

  // Apply filters to transactions
  const filteredTx = transactions.filter((tx) => {
    if (filter.month !== 'All') {
      const txMonth = tx.date.split('-')[1];
      if (txMonth !== filter.month) return false;
    }
    if (filter.account !== 'All' && tx.account !== filter.account) {
      return false;
    }
    if (filter.category !== 'All' && tx.category !== filter.category) {
      return false;
    }
    if (filter.event !== 'All' && !tx.event?.toLowerCase().includes(filter.event.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Calculate row 1 KPIs
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalIncome = filteredTx.filter((t) => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTx.filter((t) => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpense;

  // Calculate row 2 KPIs
  const savingRate = totalIncome > 0 ? netSavings / totalIncome : 0;
  const totalBudget = (Object.values(budgets) as number[]).reduce((sum, b) => sum + (b || 0), 0);
  const budgetLeft = Math.max(0, totalBudget - totalExpense);
  const habitScore = 95; // Reconciled compliance score

  // Expense grouping by Purpose (Need, Want, Investment)
  const expenseByPurpose = ['Need', 'Want', 'Investment'].map((p) => {
    const total = filteredTx
      .filter((t) => t.type === 'Expense' && (t.purpose === p || (!t.purpose && p === 'Need')))
      .reduce((sum, t) => sum + t.amount, 0);
    const percent = totalExpense > 0 ? total / totalExpense : 0;
    return { purpose: p, total, percent };
  });

  // Budget progress by Category
  const categoriesList = Object.keys(budgets);
  const categoryProgress = categoriesList.map((cat) => {
    const budget = budgets[cat] || 0;
    const spent = filteredTx
      .filter((t) => t.type === 'Expense' && t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);
    const left = budget - spent;
    const percentUsed = budget > 0 ? spent / budget : 0;
    const percentOfTotal = totalExpense > 0 ? spent / totalExpense : 0;
    return {
      category: cat,
      spent,
      budget,
      left,
      percentUsed,
      percentOfTotal,
    };
  });

  // Payment methods breakdown
  const paymentMethods = ['Cash', 'QRIS', 'Transfer', 'E-Wallet', 'Virtual Account'] as const;
  const expenseByPayment = paymentMethods.map((pm) => {
    const total = filteredTx
      .filter((t) => t.paymentMethod === pm && t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const percent = totalExpense > 0 ? total / totalExpense : 0;
    return { method: pm, total, percent };
  });

  // Top 5 Expenses
  const top5Expenses = [...filteredTx]
    .filter((t) => t.type === 'Expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Cash Flow Last 6 Months (Simulated / aggregated historical trend)
  const last6Months = [
    { name: 'Apr', income: 6800000, expense: 4200000, net: 2600000 },
    { name: 'May', income: 7200000, expense: 4900000, net: 2300000 },
    { name: 'Jun', income: 8100000, expense: 5100000, net: 3000000 },
    { name: 'Jul', income: 7000000, expense: 4600000, net: 2400000 },
    { name: 'Aug', income: 7500000, expense: 4800000, net: 2700000 },
    { name: 'Sep', income: totalIncome, expense: totalExpense, net: netSavings },
  ];

  const maxCashFlow = Math.max(...last6Months.map((m) => Math.max(m.income, m.expense)), 10000000);

  return (
    <div className="space-y-6">
      {/* Top Banner Cover Component */}
      <BannerCover
        config={bannerConfig}
        lang={lang}
        onAddTransactionClick={onAddTransactionClick}
        onOpenBannerSettings={onOpenBannerSettings}
        labelColor={labelColor}
        theme={theme}
      />

      {/* Interactive Filter Presets Toolbar */}
      <div id="dashboard-filters" className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className={`text-[10px] font-semibold tracking-wider uppercase ${labelColor}`}>
              {t('interactiveFilters', lang)}
            </span>
            <span className="text-[11px] text-amber-500 font-medium px-2 py-0.5 rounded-md bg-amber-500/10">
              {t('liveReconciled', lang)}
            </span>
          </div>
          <button
            onClick={() => setFilter({
              semester: 'Semester 2 (2026)',
              period: 'Monthly',
              month: 'All',
              week: 'All',
              account: 'All',
              category: 'All',
              event: 'All'
            })}
            className={`text-xs hover:underline font-medium cursor-pointer transition-colors flex items-center space-x-1 ${labelColor}`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t('resetFilters', lang)}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          <div>
            <label className={`block text-[11px] font-medium mb-1 ${labelColor}`}>{t('semester', lang)}</label>
            <select
              value={filter.semester}
              onChange={(e) => setFilter({ ...filter, semester: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${inputBg}`}
            >
              <option value="Semester 1 (2026)">Sem 1 (2026)</option>
              <option value="Semester 2 (2026)">Sem 2 (2026)</option>
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-medium mb-1 ${labelColor}`}>{t('period', lang)}</label>
            <select
              value={filter.period}
              onChange={(e) => setFilter({ ...filter, period: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${inputBg}`}
            >
              <option value="Monthly">{t('periodMonthly', lang)}</option>
              <option value="Weekly">{t('periodWeekly', lang)}</option>
              <option value="Annual">{t('periodAnnual', lang)}</option>
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-medium mb-1 ${labelColor}`}>{t('month', lang)}</label>
            <select
              value={filter.month}
              onChange={(e) => setFilter({ ...filter, month: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${inputBg}`}
            >
              <option value="All">{t('allMonths', lang)}</option>
              <option value="08">{lang === 'id' ? 'Agustus' : 'August'}</option>
              <option value="09">{lang === 'id' ? 'September' : 'September'}</option>
              <option value="10">{lang === 'id' ? 'Oktober' : 'October'}</option>
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-medium mb-1 ${labelColor}`}>{t('week', lang)}</label>
            <select
              value={filter.week}
              onChange={(e) => setFilter({ ...filter, week: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${inputBg}`}
            >
              <option value="All">{lang === 'id' ? 'Semua Minggu' : 'All Weeks'}</option>
              <option value="W1">W1 (1-7)</option>
              <option value="W2">W2 (8-14)</option>
              <option value="W3">W3 (15-21)</option>
              <option value="W4">W4 (22-28)</option>
              <option value="W5">W5 (29-31)</option>
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-medium mb-1 ${labelColor}`}>{t('account', lang)}</label>
            <select
              value={filter.account}
              onChange={(e) => setFilter({ ...filter, account: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${inputBg}`}
            >
              <option value="All">{t('allAccounts', lang)}</option>
              {accounts.map((a) => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-medium mb-1 ${labelColor}`}>{t('category', lang)}</label>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${inputBg}`}
            >
              <option value="All">{t('allCategories', lang)}</option>
              {categoriesList.map((c) => (
                <option key={c} value={c}>{formatControlledValue('category', c, lang)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-medium mb-1 ${labelColor}`}>{t('event', lang)}</label>
            <select
              value={filter.event}
              onChange={(e) => setFilter({ ...filter, event: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${inputBg}`}
            >
              <option value="All">{t('allEvents', lang)}</option>
              <option value="College">{formatControlledValue('event', 'College', lang)}</option>
              <option value="Personal">{formatControlledValue('event', 'Personal', lang)}</option>
              <option value="Travel">{formatControlledValue('event', 'Travel', lang)}</option>
              <option value="Food">{formatControlledValue('event', 'Food', lang)}</option>
              <option value="Shopping">{formatControlledValue('event', 'Shopping', lang)}</option>
              <option value="Family">{formatControlledValue('event', 'Family', lang)}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Total Assets & Dedicated Deposits Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Assets Card */}
        <div className={`md:col-span-2 p-5 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
                  {t('totalAssets', lang)}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                  {lang === 'id' ? 'Likuid + Deposito' : 'Liquid + Deposits'}
                </span>
              </div>
              <div className="mt-2 text-3xl font-light font-heading tracking-tight text-inherit">
                {formatIDR(totalBalance + totalDeposits)}
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-inherit">
              <div className="flex items-center space-x-2 text-xs">
                <span className={`flex items-center space-x-1 ${labelColor}`}>
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  <span>{t('liquidBalance', lang)}:</span>
                </span>
                <span className="font-semibold font-mono">{formatIDR(totalBalance)}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className={`flex items-center space-x-1 ${labelColor}`}>
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  <span>{t('totalDeposits', lang)}:</span>
                </span>
                <span className="font-semibold font-mono text-amber-600 dark:text-amber-400">{formatIDR(totalDeposits)}</span>
              </div>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-inherit/60 flex items-center justify-between text-xs">
            <p className={`text-[11px] ${labelColor}`}>
              {t('totalAssetsDesc', lang)}
            </p>
            {activeDeposits.length > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px] flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 inline" />
                <span>{t('estimatedInterest', lang)}: +{formatIDR(totalEstimatedInterest)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Compact Deposits Quick Card */}
        <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${cardBg}`}>
          <div>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
                {t('navDeposits', lang)}
              </span>
              <div className={`p-1.5 rounded-xl border ${cardAlt}`}>
                <Landmark className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-light font-heading tracking-tight text-amber-600 dark:text-amber-400">
              {formatIDR(totalDeposits)}
            </div>
            <div className={`mt-1 text-xs ${labelColor}`}>
              {activeDeposits.length} {lang === 'id' ? 'deposito aktif' : 'active deposits'} • {activePlatformsCount} {lang === 'id' ? 'platform' : 'platforms'}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-inherit/60 flex items-center justify-between">
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              +{formatIDR(totalEstimatedInterest)} (Est.)
            </span>
            {onNavigateToDeposits && (
              <button
                type="button"
                onClick={onNavigateToDeposits}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <span>{t('viewDeposits', lang)}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Row 1 KPIs (4 Cards: Liquid Balance, Total Income, Total Expense, Net Saving) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Liquid Cash Balance */}
        <div className={`p-5 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              {t('liquidBalance', lang)}
            </span>
            <div className={`p-2 rounded-xl border ${cardAlt}`}>
              <Wallet className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-light font-heading tracking-tight">
            {formatIDR(totalBalance)}
          </div>
          <div className={`mt-1 text-xs ${labelColor}`}>
            {lang === 'id' ? `Dari ${accounts.length} rekening kas/bank likuid` : `Across ${accounts.length} liquid accounts`}
          </div>
        </div>

        {/* Total Income */}
        <div className={`p-5 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              {t('totalIncome', lang)}
            </span>
            <div className={`p-2 rounded-xl border ${cardAlt}`}>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-light font-heading tracking-tight text-emerald-600 dark:text-emerald-400">
            +{formatIDR(totalIncome)}
          </div>
          <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 inline" /> {lang === 'id' ? 'Arus kas masuk aktif' : 'Active inflow'}
          </div>
        </div>

        {/* Total Expense */}
        <div className={`p-5 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              {t('totalExpense', lang)}
            </span>
            <div className={`p-2 rounded-xl border ${cardAlt}`}>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-light font-heading tracking-tight text-rose-600 dark:text-rose-400">
            -{formatIDR(totalExpense)}
          </div>
          <div className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center">
            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 inline" /> {lang === 'id' ? 'Total pengeluaran tercatat' : 'Operational spending'}
          </div>
        </div>

        {/* Net Saving */}
        <div className={`p-5 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              {t('netSavings', lang)}
            </span>
            <div className={`p-2 rounded-xl border ${cardAlt}`}>
              <PiggyBank className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-light font-heading tracking-tight">
            {formatIDR(netSavings)}
          </div>
          <div className={`mt-1 text-xs ${netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {netSavings >= 0 ? (lang === 'id' ? 'Surplus periode ini' : 'Surplus this period') : (lang === 'id' ? 'Defisit periode ini' : 'Deficit this period')}
          </div>
        </div>
      </div>

      {/* Row 2 KPIs (4 Cards: Saving Rate, Budget Left, Emergency Fund, Habit Score) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saving Rate */}
        <div className={`p-4 rounded-xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              {t('savingRate', lang)}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {formatPercent(savingRate)}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full mt-3 overflow-hidden bg-black/10 dark:bg-white/10">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, savingRate * 100))}%` }}
            />
          </div>
          <div className={`mt-2 text-[11px] ${labelColor}`}>
            {lang === 'id' ? 'Target ideal: 20%+' : 'Benchmark: 20%+ target'}
          </div>
        </div>

        {/* Budget Left */}
        <div className={`p-4 rounded-xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              {t('budgetLeft', lang)}
            </span>
            <span className="text-xs font-bold font-mono">
              {formatIDR(budgetLeft)}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full mt-3 overflow-hidden bg-black/10 dark:bg-white/10">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, (totalExpense / (totalBudget || 1)) * 100))}%` }}
            />
          </div>
          <div className={`mt-2 text-[11px] ${labelColor}`}>
            {t('budgetTotal', lang)}: {formatIDR(totalBudget)}
          </div>
        </div>

        {/* Emergency Fund */}
        <div className={`p-4 rounded-xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              {t('emergencyFundTitle', lang)}
            </span>
            <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatIDR(emergencyFund.currentAmount)}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full mt-3 overflow-hidden bg-black/10 dark:bg-white/10">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${Math.min(100, (emergencyFund.currentAmount / (emergencyFund.targetAmount || 1)) * 100)}%` }}
            />
          </div>
          <div className={`mt-2 text-[11px] ${labelColor}`}>
            Target: {formatIDR(emergencyFund.targetAmount)} ({emergencyFund.idealMonths} {t('months', lang)})
          </div>
        </div>

        {/* Habit Score */}
        <div className={`p-4 rounded-xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              {t('habitScore', lang)}
            </span>
            <span className="text-xs font-semibold text-amber-500">
              {habitScore} / 100
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full mt-3 overflow-hidden bg-black/10 dark:bg-white/10">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${habitScore}%` }} />
          </div>
          <div className={`mt-2 text-[11px] ${labelColor}`}>
            {lang === 'id' ? 'Pencatatan keuangan konsisten' : 'Consistent daily logging'}
          </div>
        </div>
      </div>

      {/* Cash Flow Last 6 Months */}
      <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold font-heading">{t('cashFlowTrend', lang)}</h2>
            <p className={`text-xs ${labelColor}`}>{lang === 'id' ? 'Perbandingan arus kas masuk versus keluar bulanan' : 'Comparison of monthly inflow versus outflow'}</p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>{t('income', lang)}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>{t('expense', lang)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-3 items-end h-44 pt-4 border-b border-inherit">
          {last6Months.map((m) => {
            const incH = Math.max(10, (m.income / maxCashFlow) * 100);
            const expH = Math.max(10, (m.expense / maxCashFlow) * 100);

            return (
              <div key={m.name} className="flex flex-col items-center h-full justify-end group">
                <div className="w-full flex justify-center space-x-1 sm:space-x-2 items-end h-full">
                  <div
                    className="w-3 sm:w-5 bg-emerald-500/80 rounded-t-sm transition-all group-hover:bg-emerald-500"
                    style={{ height: `${incH}%` }}
                    title={`${m.name} ${t('income', lang)}: ${formatIDR(m.income)}`}
                  />
                  <div
                    className="w-3 sm:w-5 bg-rose-500/80 rounded-t-sm transition-all group-hover:bg-rose-500"
                    style={{ height: `${expH}%` }}
                    title={`${m.name} ${t('expense', lang)}: ${formatIDR(m.expense)}`}
                  />
                </div>
                <span className={`text-[11px] mt-2 font-medium ${labelColor}`}>{m.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle Row: Budget Progress & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Progress (2 Cols) */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold font-heading">{t('budgetProgressByCategory', lang)}</h2>
            <span className={`text-xs ${labelColor}`}>{lang === 'id' ? 'Alokasi bulanan' : 'Monthly allocations'}</span>
          </div>

          <div className="space-y-4">
            {categoryProgress.map((item) => {
              const isOver = item.spent > item.budget;
              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{formatControlledValue('category', item.category, lang)}</span>
                    <div className="space-x-2">
                      <span className="font-mono">{formatIDR(item.spent)}</span>
                      <span className={labelColor}>/ {formatIDR(item.budget)}</span>
                      <span className={`font-semibold ${isOver ? 'text-rose-500' : 'text-amber-500'}`}>
                        ({formatPercent(item.percentUsed)})
                      </span>
                    </div>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${barBg}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, item.percentUsed * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Grouping by Purpose (Need, Want, Investment) */}
        <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
          <h2 className="text-base font-semibold font-heading mb-1">{t('expenseByPurpose', lang)}</h2>
          <p className={`text-xs ${labelColor} mb-4`}>
            {lang === 'id' ? 'Kebutuhan vs Keinginan vs Investasi' : 'Need vs Want vs Investment'}
          </p>

          <div className="space-y-4">
            {expenseByPurpose.map((ep) => (
              <div key={ep.purpose} className={`p-3.5 rounded-xl border ${cardAlt}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{formatControlledValue('purpose', ep.purpose, lang)}</span>
                  <span className="font-bold text-amber-500">{formatPercent(ep.percent)}</span>
                </div>
                <div className="text-sm font-light mt-1 font-mono">{formatIDR(ep.total)}</div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden mt-2 ${barBg}`}>
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, ep.percent * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-inherit">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">{t('paymentMethods', lang)}</h3>
            <div className="space-y-1.5 text-xs">
              {expenseByPayment.map((pm) => (
                <div key={pm.method} className="flex justify-between items-center py-1">
                  <span className={labelColor}>{formatControlledValue('paymentMethod', pm.method, lang)}</span>
                  <span className="font-mono font-medium">{formatIDR(pm.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Top 5 Expenses & Accounts Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Expenses */}
        <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
          <h2 className="text-base font-semibold font-heading mb-1">{t('topExpenses', lang)}</h2>
          <p className={`text-xs ${labelColor} mb-4`}>
            {lang === 'id' ? 'Pengeluaran terbesar periode ini' : 'Largest individual outflows this period'}
          </p>

          <div className="divide-y divide-inherit">
            {top5Expenses.length === 0 ? (
              <div className={`text-xs py-4 text-center ${labelColor}`}>{t('noTransactionsFound', lang)}</div>
            ) : (
              top5Expenses.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium truncate max-w-xs">{tx.description}</div>
                    <div className={`text-[10px] ${labelColor}`}>
                      {tx.date} • {formatControlledValue('category', tx.category, lang)} • {tx.account}
                    </div>
                  </div>
                  <div className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                    -{formatIDR(tx.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Savings Goals Widget */}
        <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold font-heading">{t('savingsTargetProgress', lang)}</h2>
            <Target className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-3.5">
            {goals.map((g) => {
              const pct = g.targetBalance > 0 ? g.saved / g.targetBalance : 0;
              return (
                <div key={g.id} className={`p-3 rounded-xl border ${cardAlt}`}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>{g.name}</span>
                    <span className="text-amber-500">{formatPercent(pct)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="font-mono">{formatIDR(g.saved)}</span>
                    <span className={labelColor}>Target: {formatIDR(g.targetBalance)}</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${barBg}`}>
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, pct * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
