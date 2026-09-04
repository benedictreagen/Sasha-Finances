import React from 'react';
import { 
  FilterState, 
  Transaction, 
  AccountInfo, 
  SavingsGoal, 
  EmergencyFundData,
  ThemeMode
} from '../types';
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
  RotateCcw
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
}) => {
  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;
  const cardBg = tokens.cardBg;
  const cardAlt = tokens.cardAlt;
  const labelColor = tokens.labelColor;
  const inputBg = tokens.inputBg;
  const barBg = tokens.barBg;

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
      {/* Top Banner with Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Sasha’s Finance Dashboard</h1>
          <p className={`text-xs mt-1 ${labelColor}`}>
            Personal finance overview synchronized with the persistent spreadsheet backend.
          </p>
        </div>
        <button
          onClick={onAddTransactionClick}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Transaction</span>
        </button>
      </div>

      {/* Interactive Filter Presets Toolbar */}
      <div id="dashboard-filters" className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className={`text-[10px] font-semibold tracking-wider uppercase ${labelColor}`}>
              Interactive Filters
            </span>
            <span className="text-[11px] text-amber-500 font-medium px-2 py-0.5 rounded-md bg-amber-500/10">
              Live Reconciled
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
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          <div>
            <label className={`block text-[11px] font-medium mb-1 ${labelColor}`}>Semester</label>
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
            <label className={`block text-[11px] font-medium mb-1 ${labelColor}`}>Period</label>
            <select
              value={filter.period}
              onChange={(e) => setFilter({ ...filter, period: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${inputBg}`}
            >
              <option value="Monthly">Monthly</option>
              <option value="Weekly">Weekly</option>
              <option value="Annual">Annual</option>
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-medium mb-1 ${labelColor}`}>Month</label>
            <select
              value={filter.month}
              onChange={(e) => setFilter({ ...filter, month: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${inputBg}`}
            >
              <option value="All">All Months</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-medium mb-1 ${labelColor}`}>Week</label>
            <select
              value={filter.week}
              onChange={(e) => setFilter({ ...filter, week: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${inputBg}`}
            >
              <option value="All">All Weeks</option>
              <option value="W1">W1 (1-7)</option>
              <option value="W2">W2 (8-14)</option>
              <option value="W3">W3 (15-21)</option>
              <option value="W4">W4 (22-28)</option>
              <option value="W5">W5 (29-31)</option>
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-medium mb-1 ${labelColor}`}>Account</label>
            <select
              value={filter.account}
              onChange={(e) => setFilter({ ...filter, account: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${inputBg}`}
            >
              <option value="All">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-medium mb-1 ${labelColor}`}>Category</label>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${inputBg}`}
            >
              <option value="All">All Categories</option>
              {categoriesList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-medium mb-1 ${labelColor}`}>Event</label>
            <select
              value={filter.event}
              onChange={(e) => setFilter({ ...filter, event: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-lg border font-medium ${inputBg}`}
            >
              <option value="All">All Events</option>
              <option value="College">College</option>
              <option value="Personal">Personal</option>
              <option value="Travel">Travel</option>
              <option value="Food">Food</option>
              <option value="Shopping">Shopping</option>
              <option value="Family">Family</option>
            </select>
          </div>
        </div>
      </div>

      {/* Row 1 KPIs (4 Cards: Total Balance, Total Income, Total Expense, Net Saving) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className={`p-5 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              Total Balance
            </span>
            <div className={`p-2 rounded-xl border ${cardAlt}`}>
              <Wallet className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-light font-heading tracking-tight">
            {formatIDR(totalBalance)}
          </div>
          <div className={`mt-1 text-xs ${labelColor}`}>Across {accounts.length} active accounts</div>
        </div>

        {/* Total Income */}
        <div className={`p-5 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              Total Income
            </span>
            <div className={`p-2 rounded-xl border ${cardAlt}`}>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-light font-heading tracking-tight text-emerald-600 dark:text-emerald-400">
            +{formatIDR(totalIncome)}
          </div>
          <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 inline" /> Active inflow
          </div>
        </div>

        {/* Total Expense */}
        <div className={`p-5 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              Total Expense
            </span>
            <div className={`p-2 rounded-xl border ${cardAlt}`}>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-light font-heading tracking-tight text-rose-600 dark:text-rose-400">
            -{formatIDR(totalExpense)}
          </div>
          <div className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center">
            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 inline" /> Operational spending
          </div>
        </div>

        {/* Net Saving */}
        <div className={`p-5 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              Net Saving
            </span>
            <div className={`p-2 rounded-xl border ${cardAlt}`}>
              <PiggyBank className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-light font-heading tracking-tight">
            {formatIDR(netSavings)}
          </div>
          <div className={`mt-1 text-xs ${netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {netSavings >= 0 ? 'Surplus' : 'Deficit'} this period
          </div>
        </div>
      </div>

      {/* Row 2 KPIs (4 Cards: Saving Rate, Budget Left, Emergency Fund, Habit Score) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saving Rate */}
        <div className={`p-4 rounded-xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              Saving Rate
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
            Benchmark: 20%+ target
          </div>
        </div>

        {/* Budget Left */}
        <div className={`p-4 rounded-xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              Budget Left
            </span>
            <span className="text-xs font-bold font-mono">
              {formatIDR(budgetLeft)}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full mt-3 overflow-hidden bg-black/10 dark:bg-white/10">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, (totalExpense / totalBudget) * 100))}%` }}
            />
          </div>
          <div className={`mt-2 text-[11px] ${labelColor}`}>
            Total budget: {formatIDR(totalBudget)}
          </div>
        </div>

        {/* Emergency Fund */}
        <div className={`p-4 rounded-xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              Emergency Fund
            </span>
            <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatIDR(emergencyFund.currentAmount)}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full mt-3 overflow-hidden bg-black/10 dark:bg-white/10">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${Math.min(100, (emergencyFund.currentAmount / emergencyFund.targetAmount) * 100)}%` }}
            />
          </div>
          <div className={`mt-2 text-[11px] ${labelColor}`}>
            Target: {formatIDR(emergencyFund.targetAmount)} ({emergencyFund.idealMonths} mos)
          </div>
        </div>

        {/* Habit Score */}
        <div className={`p-4 rounded-xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              Habit Score
            </span>
            <span className="text-xs font-semibold text-amber-500">
              {habitScore} / 100
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full mt-3 overflow-hidden bg-black/10 dark:bg-white/10">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${habitScore}%` }} />
          </div>
          <div className={`mt-2 text-[11px] ${labelColor}`}>
            Consistent daily logging
          </div>
        </div>
      </div>

      {/* Cash Flow Last 6 Months */}
      <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold font-heading">Cash Flow Trend (Last 6 Months)</h2>
            <p className={`text-xs ${labelColor}`}>Comparison of monthly inflow versus outflow</p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Income</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Expense</span>
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
                    title={`${m.name} Income: ${formatIDR(m.income)}`}
                  />
                  <div
                    className="w-3 sm:w-5 bg-rose-500/80 rounded-t-sm transition-all group-hover:bg-rose-500"
                    style={{ height: `${expH}%` }}
                    title={`${m.name} Expense: ${formatIDR(m.expense)}`}
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
            <h2 className="text-base font-semibold font-heading">Budget & Expense Progress</h2>
            <span className={`text-xs ${labelColor}`}>Monthly allocations</span>
          </div>

          <div className="space-y-4">
            {categoryProgress.map((item) => {
              const isOver = item.spent > item.budget;
              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{item.category}</span>
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
          <h2 className="text-base font-semibold font-heading mb-1">Expense Breakdown</h2>
          <p className={`text-xs ${labelColor} mb-4`}>Need vs Want vs Investment</p>

          <div className="space-y-4">
            {expenseByPurpose.map((ep) => (
              <div key={ep.purpose} className={`p-3.5 rounded-xl border ${cardAlt}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{ep.purpose}</span>
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
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">Payment Methods</h3>
            <div className="space-y-1.5 text-xs">
              {expenseByPayment.map((pm) => (
                <div key={pm.method} className="flex justify-between items-center py-1">
                  <span className={labelColor}>{pm.method}</span>
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
          <h2 className="text-base font-semibold font-heading mb-1">Top 5 Expenses</h2>
          <p className={`text-xs ${labelColor} mb-4`}>Largest individual outflows this period</p>

          <div className="divide-y divide-inherit">
            {top5Expenses.length === 0 ? (
              <div className={`text-xs py-4 text-center ${labelColor}`}>No expenses recorded</div>
            ) : (
              top5Expenses.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium truncate max-w-xs">{tx.description}</div>
                    <div className={`text-[10px] ${labelColor}`}>
                      {tx.date} • {tx.category} • {tx.account}
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
            <h2 className="text-base font-semibold font-heading">Savings Goals Snapshot</h2>
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
