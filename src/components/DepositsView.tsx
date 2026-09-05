import React, { useState, useMemo } from 'react';
import { Deposit, DepositStatus, AccountInfo, ThemeMode, ListsConfig } from '../types';
import { formatIDR, formatPercent } from '../excelGenerator';
import { Language, t, formatControlledValue } from '../i18n';
import { getThemeTokens } from '../theme';
import {
  Landmark,
  PiggyBank,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Search,
  ArrowUpDown,
  ArrowRight,
  Percent,
  Wallet,
  ArrowDownToLine,
  RefreshCw,
  Info,
  ChevronRight,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface DepositsViewProps {
  deposits: Deposit[];
  accounts: AccountInfo[];
  listsConfig: ListsConfig;
  theme?: ThemeMode;
  lang: Language;
  onAddDeposit: (deposit: Deposit, fundFromAccount?: string) => Promise<void> | void;
  onEditDeposit: (deposit: Deposit) => Promise<void> | void;
  onDeleteDeposit: (id: string) => Promise<void> | void;
  onWithdrawDeposit: (depositId: string, destinationAccount: string, actualInterest: number) => Promise<void> | void;
  onOpenPlatformSettings?: () => void;
}

export const DepositsView: React.FC<DepositsViewProps> = ({
  deposits,
  accounts,
  listsConfig,
  theme = 'dark',
  lang,
  onAddDeposit,
  onEditDeposit,
  onDeleteDeposit,
  onWithdrawDeposit,
  onOpenPlatformSettings,
}) => {
  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;
  const cardBg = tokens.cardBg;
  const cardAlt = tokens.cardAlt;
  const labelColor = tokens.labelColor;
  const inputBg = tokens.inputBg;
  const tableHeaderBg = tokens.tableHeaderBg;
  const rowHoverBg = tokens.rowHoverBg;

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'maturity-asc' | 'maturity-desc' | 'principal-desc' | 'principal-asc'>('maturity-asc');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
  const [withdrawingDeposit, setWithdrawingDeposit] = useState<Deposit | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states for Add/Edit
  const [formPlatform, setFormPlatform] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formPrincipal, setFormPrincipal] = useState<number>(1000000);
  const [formRate, setFormRate] = useState<number>(5.0);
  const [formStartDate, setFormStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formMaturityDate, setFormMaturityDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });
  const [formStatus, setFormStatus] = useState<DepositStatus>('Active');
  const [formFundFromAccount, setFormFundFromAccount] = useState<boolean>(false);
  const [formSourceAccount, setFormSourceAccount] = useState<string>(accounts[0]?.name || 'Blu');
  const [formNotes, setFormNotes] = useState<string>('');

  // Form states for Withdraw
  const [withdrawDestination, setWithdrawDestination] = useState<string>(accounts[0]?.name || 'Blu');
  const [withdrawInterest, setWithdrawInterest] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Available platforms
  const platformList = useMemo(() => {
    const fromConfig = listsConfig.depositPlatforms || [];
    const fromExisting = deposits.map((d) => d.platform).filter(Boolean);
    const combined = Array.from(new Set([...fromConfig, ...fromExisting]));
    return combined.length > 0 ? combined : ['Seabank', 'Bank Jago', 'Blu by BCA', 'BCA', 'Bank Mandiri', 'Bibit'];
  }, [listsConfig.depositPlatforms, deposits]);

  // Calculations for Overview
  const activeDepositsList = useMemo(() => deposits.filter((d) => d.status === 'Active'), [deposits]);
  const totalDeposits = useMemo(() => activeDepositsList.reduce((sum, d) => sum + d.principal, 0), [activeDepositsList]);
  const totalPrincipal = useMemo(() => deposits.reduce((sum, d) => sum + d.principal, 0), [deposits]);
  const totalEstimatedInterest = useMemo(() => activeDepositsList.reduce((sum, d) => sum + (d.estimatedInterest || 0), 0), [activeDepositsList]);

  // Check maturing soon (within 30 days or active & due)
  const today = useMemo(() => new Date(), []);
  
  const getDaysRemaining = (maturityDateStr: string) => {
    try {
      const maturity = new Date(maturityDateStr).getTime();
      const now = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      if (isNaN(maturity)) return null;
      return Math.ceil((maturity - now) / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const maturingSoonDeposits = useMemo(() => {
    return activeDepositsList.filter((d) => {
      const days = getDaysRemaining(d.maturityDate);
      return days !== null && days <= 30;
    });
  }, [activeDepositsList, today]);

  // Platform breakdown
  const platformBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    activeDepositsList.forEach((d) => {
      const curr = map.get(d.platform) || { count: 0, total: 0 };
      curr.count += 1;
      curr.total += d.principal;
      map.set(d.platform, curr);
    });
    return Array.from(map.entries()).map(([platform, data]) => ({
      platform,
      count: data.count,
      total: data.total,
      percent: totalDeposits > 0 ? data.total / totalDeposits : 0,
    })).sort((a, b) => b.total - a.total);
  }, [activeDepositsList, totalDeposits]);

  // Helper to calculate interest live
  const calculateLiveInterest = (principal: number, rate: number, start: string, maturity: string) => {
    if (!principal || !rate || !start || !maturity) return 0;
    try {
      const s = new Date(start).getTime();
      const m = new Date(maturity).getTime();
      if (isNaN(s) || isNaN(m) || m <= s) return 0;
      const days = Math.round((m - s) / (1000 * 60 * 60 * 24));
      return Math.round(principal * (rate / 100) * (days / 365));
    } catch {
      return 0;
    }
  };

  // Open add modal
  const handleOpenAdd = () => {
    setFormPlatform(platformList[0] || 'Seabank');
    setFormName('');
    setFormPrincipal(2000000);
    setFormRate(5.5);
    const start = new Date().toISOString().split('T')[0];
    const mat = new Date();
    mat.setMonth(mat.getMonth() + 3);
    setFormStartDate(start);
    setFormMaturityDate(mat.toISOString().split('T')[0]);
    setFormStatus('Active');
    setFormFundFromAccount(false);
    setFormSourceAccount(accounts[0]?.name || 'Blu');
    setFormNotes('');
    setEditingDeposit(null);
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (dep: Deposit) => {
    setEditingDeposit(dep);
    setFormPlatform(dep.platform);
    setFormName(dep.name);
    setFormPrincipal(dep.principal);
    setFormRate(dep.interestRate);
    setFormStartDate(dep.startDate);
    setFormMaturityDate(dep.maturityDate);
    setFormStatus(dep.status);
    setFormFundFromAccount(false);
    setFormSourceAccount(dep.sourceAccount || accounts[0]?.name || 'Blu');
    setFormNotes(dep.notes || '');
    setIsAddModalOpen(true);
  };

  // Open withdraw modal
  const handleOpenWithdraw = (dep: Deposit) => {
    setWithdrawingDeposit(dep);
    setWithdrawDestination(dep.sourceAccount || accounts[0]?.name || 'Blu');
    setWithdrawInterest(dep.estimatedInterest || 0);
  };

  // Submit Add / Edit
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPlatform.trim() || !formName.trim() || formPrincipal <= 0) return;

    setIsSubmitting(true);
    try {
      const estimated = calculateLiveInterest(formPrincipal, formRate, formStartDate, formMaturityDate);
      if (editingDeposit) {
        const updated: Deposit = {
          ...editingDeposit,
          platform: formPlatform.trim(),
          name: formName.trim(),
          principal: formPrincipal,
          interestRate: formRate,
          startDate: formStartDate,
          maturityDate: formMaturityDate,
          estimatedInterest: estimated,
          status: formStatus,
          notes: formNotes.trim(),
        };
        await onEditDeposit(updated);
      } else {
        const newDep: Deposit = {
          id: `dep-${Date.now()}`,
          platform: formPlatform.trim(),
          name: formName.trim(),
          principal: formPrincipal,
          interestRate: formRate,
          startDate: formStartDate,
          maturityDate: formMaturityDate,
          estimatedInterest: estimated,
          status: formStatus,
          sourceAccount: formFundFromAccount ? formSourceAccount : undefined,
          notes: formNotes.trim(),
        };
        await onAddDeposit(newDep, formFundFromAccount ? formSourceAccount : undefined);
      }
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Withdraw
  const handleConfirmWithdraw = async () => {
    if (!withdrawingDeposit || !withdrawDestination) return;
    setIsSubmitting(true);
    try {
      await onWithdrawDeposit(withdrawingDeposit.id, withdrawDestination, withdrawInterest);
      setWithdrawingDeposit(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered & Sorted deposit list
  const filteredDeposits = useMemo(() => {
    return deposits.filter((d) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const match =
          d.name.toLowerCase().includes(q) ||
          d.platform.toLowerCase().includes(q) ||
          (d.notes && d.notes.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Filter Platform
      if (filterPlatform !== 'All' && d.platform !== filterPlatform) {
        return false;
      }

      // Filter Status
      if (filterStatus === 'MaturingSoon') {
        const days = getDaysRemaining(d.maturityDate);
        return d.status === 'Active' && days !== null && days <= 30;
      } else if (filterStatus !== 'All' && d.status !== filterStatus) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'maturity-asc') {
        return new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime();
      }
      if (sortBy === 'maturity-desc') {
        return new Date(b.maturityDate).getTime() - new Date(a.maturityDate).getTime();
      }
      if (sortBy === 'principal-desc') {
        return b.principal - a.principal;
      }
      if (sortBy === 'principal-asc') {
        return a.principal - b.principal;
      }
      return 0;
    });
  }, [deposits, search, filterPlatform, filterStatus, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center space-x-2.5">
            <Landmark className="w-6 h-6 text-amber-500" />
            <span>{t('depositsTitle', lang)}</span>
          </h1>
          <p className={`text-xs mt-1 ${labelColor}`}>
            {t('depositsSubtitle', lang)}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenPlatformSettings && (
            <button
              type="button"
              onClick={onOpenPlatformSettings}
              className={`px-3.5 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${cardAlt} hover:text-inherit flex items-center space-x-1.5`}
              title={t('platformManagement', lang)}
            >
              <Building className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">{t('tabPlatforms', lang)}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addDeposit', lang)}</span>
          </button>
        </div>
      </div>

      {/* Maturing Soon Alert Notice (if any) */}
      {maturingSoonDeposits.length > 0 && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500 text-black shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                {t('maturingSoon', lang)} ({maturingSoonDeposits.length})
              </h4>
              <p className={`text-xs ${labelColor} mt-0.5`}>
                {maturingSoonDeposits.map((d) => {
                  const days = getDaysRemaining(d.maturityDate);
                  return `${d.platform} - ${d.name} (${days !== null && days >= 0 ? `${days} ${t('daysLeft', lang)}` : t('maturedAlready', lang)})`;
                }).join(' • ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFilterStatus('MaturingSoon')}
            className="px-3 py-1.5 rounded-xl border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-medium cursor-pointer self-start sm:self-center transition-colors whitespace-nowrap"
          >
            {t('filterStatus', lang)}: {t('maturingSoon', lang)}
          </button>
        </div>
      )}

      {/* 1. DEPOSITS OVERVIEW: Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Deposits (Active Principal) */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              {t('totalDeposits', lang)}
            </span>
            <div className={`p-1.5 rounded-xl border ${cardAlt}`}>
              <PiggyBank className="w-3.5 h-3.5 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 text-xl font-light font-heading tracking-tight text-amber-600 dark:text-amber-400">
            {formatIDR(totalDeposits)}
          </div>
          <div className={`mt-1 text-[11px] ${labelColor}`}>
            {t('totalDepositsDesc', lang)}
          </div>
        </div>

        {/* Total Principal Across All */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              {t('totalPrincipal', lang)}
            </span>
            <div className={`p-1.5 rounded-xl border ${cardAlt}`}>
              <Wallet className="w-3.5 h-3.5 text-blue-500" />
            </div>
          </div>
          <div className="mt-2 text-xl font-light font-heading tracking-tight">
            {formatIDR(totalPrincipal)}
          </div>
          <div className={`mt-1 text-[11px] ${labelColor}`}>
            {deposits.length} {lang === 'id' ? 'total catatan' : 'records total'}
          </div>
        </div>

        {/* Estimated Interest */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              {t('estimatedInterest', lang)}
            </span>
            <div className={`p-1.5 rounded-xl border ${cardAlt}`}>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2 text-xl font-light font-heading tracking-tight text-emerald-600 dark:text-emerald-400">
            +{formatIDR(totalEstimatedInterest)}
          </div>
          <div className={`mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1`}>
            <span>{t('estimatedOnly', lang)}</span>
            <span className={labelColor}>• {t('estimatedInterestDesc', lang)}</span>
          </div>
        </div>

        {/* Number of Active Deposits */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              {t('activeDeposits', lang)}
            </span>
            <div className={`p-1.5 rounded-xl border ${cardAlt}`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2 text-xl font-light font-heading tracking-tight">
            {activeDepositsList.length}
          </div>
          <div className={`mt-1 text-[11px] ${labelColor}`}>
            {deposits.length - activeDepositsList.length > 0 
              ? `${deposits.length - activeDepositsList.length} ${lang === 'id' ? 'selesai / dicairkan' : 'matured / closed'}`
              : lang === 'id' ? 'Semua simpanan aktif' : 'All deposits active'}
          </div>
        </div>

        {/* Deposits Maturing Soon */}
        <div className={`p-4 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>
              {t('maturingSoon', lang)}
            </span>
            <div className={`p-1.5 rounded-xl border ${cardAlt}`}>
              <Clock className="w-3.5 h-3.5 text-orange-500" />
            </div>
          </div>
          <div className={`mt-2 text-xl font-light font-heading tracking-tight ${maturingSoonDeposits.length > 0 ? 'text-orange-500' : ''}`}>
            {maturingSoonDeposits.length}
          </div>
          <div className={`mt-1 text-[11px] ${labelColor}`}>
            {t('maturingSoonDesc', lang)}
          </div>
        </div>
      </div>

      {/* Total Deposits by Platform Breakdown */}
      {platformBreakdown.length > 0 && (
        <div className={`p-5 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center space-x-2">
              <Landmark className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider font-heading">
                {t('depositsByPlatform', lang)}
              </h3>
            </div>
            <span className={`text-xs ${labelColor}`}>
              {platformBreakdown.length} {lang === 'id' ? 'platform terdaftar' : 'registered platforms'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {platformBreakdown.map((item) => (
              <div
                key={item.platform}
                onClick={() => setFilterPlatform(item.platform === filterPlatform ? 'All' : item.platform)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  filterPlatform === item.platform
                    ? 'border-amber-500 bg-amber-500/10'
                    : `${cardAlt} hover:border-amber-500/40`
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-inherit truncate">{item.platform}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 font-medium">
                    {item.count} {lang === 'id' ? 'deposito' : 'active'}
                  </span>
                </div>
                <div className="text-sm font-semibold font-heading text-amber-600 dark:text-amber-400">
                  {formatIDR(item.total)}
                </div>
                <div className="mt-2 w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round(item.percent * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. DEPOSIT TABLE CONTROLS (Search, Filter, Sort) */}
      <div className={`p-4 rounded-2xl border shadow-xs space-y-3 ${cardBg}`}>
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${labelColor}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchDeposits', lang)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border ${inputBg}`}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Platform */}
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className={`px-3 py-2 text-xs rounded-xl border ${inputBg}`}
            >
              <option value="All">{t('allPlatforms', lang)}</option>
              {platformList.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-3 py-2 text-xs rounded-xl border ${inputBg}`}
            >
              <option value="All">{t('allStatuses', lang)}</option>
              <option value="Active">{t('statusActive', lang)}</option>
              <option value="MaturingSoon">{t('maturingSoon', lang)} (≤30 {lang === 'id' ? 'hari' : 'days'})</option>
              <option value="Matured">{t('statusMatured', lang)}</option>
              <option value="Withdrawn">{t('statusWithdrawn', lang)}</option>
              <option value="Reinvested">{t('statusReinvested', lang)}</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-3 py-2 text-xs rounded-xl border ${inputBg}`}
            >
              <option value="maturity-asc">{t('sortMaturityDate', lang)} (Terdekat / Asc)</option>
              <option value="maturity-desc">{t('sortMaturityDate', lang)} (Terjauh / Desc)</option>
              <option value="principal-desc">{t('sortPrincipal', lang)} (Terbesar / Desc)</option>
              <option value="principal-asc">{t('sortPrincipal', lang)} (Terkecil / Asc)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. DEPOSIT TABLE */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b ${tableHeaderBg} text-[11px] uppercase tracking-wider font-semibold`}>
                <th className="py-3 px-4">{t('platform', lang)}</th>
                <th className="py-3 px-4">{t('depositName', lang)}</th>
                <th className="py-3 px-4 text-right">{t('principal', lang)}</th>
                <th className="py-3 px-3 text-center">{t('interestRate', lang)}</th>
                <th className="py-3 px-4">{t('startDate', lang)}</th>
                <th className="py-3 px-4">{t('maturityDate', lang)}</th>
                <th className="py-3 px-4 text-right">{t('estimatedInterest', lang)}</th>
                <th className="py-3 px-3 text-center">{t('status', lang)}</th>
                <th className="py-3 px-4">{t('notes', lang)}</th>
                <th className="py-3 px-4 text-right">{t('actions', lang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit">
              {filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Landmark className={`w-8 h-8 ${labelColor} opacity-40`} />
                      <p className="text-sm font-medium">{t('noDeposits', lang)}</p>
                      <p className={`text-xs ${labelColor}`}>{t('noDepositsDesc', lang)}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((dep) => {
                  const daysRemaining = getDaysRemaining(dep.maturityDate);
                  const isMaturingSoon = dep.status === 'Active' && daysRemaining !== null && daysRemaining <= 30;

                  // Status badge styling
                  let statusBadgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
                  if (dep.status === 'Matured') {
                    statusBadgeClass = 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30';
                  } else if (dep.status === 'Withdrawn') {
                    statusBadgeClass = 'bg-neutral-500/10 text-neutral-500 border-neutral-500/30';
                  } else if (dep.status === 'Reinvested') {
                    statusBadgeClass = 'bg-blue-500/10 text-blue-500 border-blue-500/30';
                  }

                  return (
                    <tr key={dep.id} className={`transition-colors ${rowHoverBg}`}>
                      {/* Platform */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg border text-[11px] font-semibold bg-black/5 dark:bg-white/5 border-inherit">
                          {dep.platform}
                        </span>
                      </td>

                      {/* Deposit Name */}
                      <td className="py-3.5 px-4 font-semibold text-inherit">
                        <div className="truncate max-w-[200px]" title={dep.name}>
                          {dep.name}
                        </div>
                        {dep.sourceAccount && (
                          <div className={`text-[10px] font-normal ${labelColor}`}>
                            {t('sourceAccount', lang)}: {dep.sourceAccount}
                          </div>
                        )}
                      </td>

                      {/* Principal */}
                      <td className="py-3.5 px-4 text-right font-semibold font-heading text-inherit whitespace-nowrap">
                        {formatIDR(dep.principal)}
                      </td>

                      {/* Interest Rate */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold font-mono text-[11px]">
                          <span>{dep.interestRate}%</span>
                        </span>
                      </td>

                      {/* Start Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-inherit">
                        {dep.startDate}
                      </td>

                      {/* Maturity Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-[11px] text-inherit">
                          {dep.maturityDate}
                        </div>
                        {isMaturingSoon && (
                          <div className="mt-0.5 inline-flex items-center text-[10px] font-semibold text-orange-500 animate-pulse">
                            <Clock className="w-3 h-3 mr-0.5 inline" />
                            {daysRemaining !== null && daysRemaining >= 0
                              ? `${daysRemaining} ${t('daysLeft', lang)}`
                              : t('maturedAlready', lang)}
                          </div>
                        )}
                      </td>

                      {/* Estimated Interest */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400 font-heading">
                          +{formatIDR(dep.estimatedInterest)}
                        </div>
                        <div className={`text-[9px] uppercase tracking-wider ${labelColor}`}>
                          {t('estimatedOnly', lang)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusBadgeClass}`}>
                          {formatControlledValue('depositStatus', dep.status, lang)}
                        </span>
                      </td>

                      {/* Notes */}
                      <td className={`py-3.5 px-4 text-xs ${labelColor} max-w-[160px] truncate`} title={dep.notes || ''}>
                        {dep.notes || '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {dep.status === 'Active' && (
                            <button
                              type="button"
                              onClick={() => handleOpenWithdraw(dep)}
                              title={t('withdrawDeposit', lang)}
                              className="p-1.5 rounded-lg border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                            >
                              <ArrowDownToLine className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(dep)}
                            title={t('editDeposit', lang)}
                            className="p-1.5 rounded-lg border border-inherit text-inherit hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingId(dep.id)}
                            title={t('deleteDeposit', lang)}
                            className="p-1.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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

      {/* MODAL: Add / Edit Deposit */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto ${cardBg}`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <h3 className="text-base font-bold font-heading flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-amber-500" />
                <span>{editingDeposit ? t('editDeposit', lang) : t('addDeposit', lang)}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className={`p-1.5 rounded-lg border text-xs cursor-pointer ${cardAlt}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDeposit} className="space-y-4">
              {/* Platform */}
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t('platform', lang)} <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    required
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-xl border text-xs ${inputBg}`}
                  >
                    {platformList.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Deposit Name */}
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t('depositName', lang)} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deposito 1 Bulan, Deposito Berjangka"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${inputBg}`}
                />
              </div>

              {/* Principal Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold">
                    {t('principal', lang)} (IDR) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
                    {formatIDR(formPrincipal)}
                  </span>
                </div>
                <input
                  type="number"
                  min="10000"
                  step="10000"
                  required
                  value={formPrincipal || ''}
                  onChange={(e) => setFormPrincipal(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${inputBg}`}
                />
              </div>

              {/* Interest Rate */}
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t('interestRatePa', lang)} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.01"
                  required
                  value={formRate || ''}
                  onChange={(e) => setFormRate(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${inputBg}`}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">{t('startDate', lang)}</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">{t('maturityDate', lang)}</label>
                  <input
                    type="date"
                    required
                    value={formMaturityDate}
                    onChange={(e) => setFormMaturityDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${inputBg}`}
                  />
                </div>
              </div>

              {/* Live Estimated Interest Preview Card */}
              {formPrincipal > 0 && formRate > 0 && formStartDate && formMaturityDate && (
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{t('estimatedInterest', lang)}:</span>
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-heading">
                      +{formatIDR(calculateLiveInterest(formPrincipal, formRate, formStartDate, formMaturityDate))}
                    </span>
                  </div>
                  <p className={`text-[10px] ${labelColor}`}>
                    {t('estimatedInterestFormula', lang)}
                  </p>
                </div>
              )}

              {/* Status (only if editing) */}
              {editingDeposit && (
                <div>
                  <label className="block text-xs font-semibold mb-1">{t('status', lang)}</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as DepositStatus)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${inputBg}`}
                  >
                    <option value="Active">{t('statusActive', lang)}</option>
                    <option value="Matured">{t('statusMatured', lang)}</option>
                    <option value="Withdrawn">{t('statusWithdrawn', lang)}</option>
                    <option value="Reinvested">{t('statusReinvested', lang)}</option>
                  </select>
                </div>
              )}

              {/* Transfer Funding Logic (For new deposits) */}
              {!editingDeposit && (
                <div className="p-3.5 rounded-xl border border-inherit bg-black/5 dark:bg-white/5 space-y-2.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="fundFromAccount"
                      checked={formFundFromAccount}
                      onChange={(e) => setFormFundFromAccount(e.target.checked)}
                      className="rounded border-inherit text-amber-500 cursor-pointer"
                    />
                    <label htmlFor="fundFromAccount" className="text-xs font-semibold cursor-pointer">
                      {t('fundFromAccount', lang)}
                    </label>
                  </div>
                  <p className={`text-[11px] ${labelColor} pl-6`}>
                    {t('fundAccountDesc', lang)}
                  </p>

                  {formFundFromAccount && (
                    <div className="pl-6 pt-1">
                      <label className="block text-[11px] font-medium mb-1">
                        {t('selectSourceAccount', lang)}:
                      </label>
                      <select
                        value={formSourceAccount}
                        onChange={(e) => setFormSourceAccount(e.target.value)}
                        className={`w-full px-3 py-1.5 rounded-xl border text-xs ${inputBg}`}
                      >
                        {accounts.map((acc) => (
                          <option key={acc.name} value={acc.name}>
                            {acc.name} ({formatIDR(acc.balance)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold mb-1">{t('notes', lang)}</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan, jangka waktu, atau instruksi pencairan..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${inputBg}`}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border text-xs font-medium cursor-pointer ${cardAlt}`}
                >
                  {lang === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (lang === 'id' ? 'Menyimpan...' : 'Saving...') : lang === 'id' ? 'Simpan Deposito' : 'Save Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Withdraw Deposit to Account */}
      {withdrawingDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl border shadow-xl p-6 space-y-4 ${cardBg}`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <h3 className="text-base font-bold font-heading flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                <ArrowDownToLine className="w-5 h-5" />
                <span>{t('withdrawDeposit', lang)}</span>
              </h3>
              <button
                type="button"
                onClick={() => setWithdrawingDeposit(null)}
                className={`p-1.5 rounded-lg border text-xs cursor-pointer ${cardAlt}`}
              >
                ✕
              </button>
            </div>

            <p className={`text-xs ${labelColor}`}>
              {t('withdrawDesc', lang)}
            </p>

            <div className="p-3.5 rounded-xl border border-inherit bg-black/5 dark:bg-white/5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className={labelColor}>{t('platform', lang)}:</span>
                <span className="font-semibold">{withdrawingDeposit.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className={labelColor}>{t('depositName', lang)}:</span>
                <span className="font-semibold">{withdrawingDeposit.name}</span>
              </div>
              <div className="flex justify-between">
                <span className={labelColor}>{t('principal', lang)}:</span>
                <span className="font-bold text-inherit">{formatIDR(withdrawingDeposit.principal)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t('destinationAccount', lang)} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={withdrawDestination}
                  onChange={(e) => setWithdrawDestination(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${inputBg}`}
                >
                  {accounts.map((acc) => (
                    <option key={acc.name} value={acc.name}>
                      {acc.name} ({formatIDR(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  {t('actualInterestReceived', lang)} (IDR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={withdrawInterest || ''}
                  onChange={(e) => setWithdrawInterest(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${inputBg}`}
                />
              </div>

              <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-[11px] text-blue-600 dark:text-blue-400 leading-relaxed">
                <Info className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                {t('interestIncomeNotice', lang)}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-inherit">
              <button
                type="button"
                onClick={() => setWithdrawingDeposit(null)}
                className={`px-4 py-2 rounded-xl border text-xs font-medium cursor-pointer ${cardAlt}`}
              >
                {lang === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmWithdraw}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (lang === 'id' ? 'Memproses...' : 'Processing...') : lang === 'id' ? 'Konfirmasi Pencairan' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-sm rounded-2xl border shadow-xl p-5 space-y-3 ${cardBg}`}>
            <h3 className="text-sm font-bold font-heading text-rose-500 flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>{t('deleteDeposit', lang)}</span>
            </h3>
            <p className={`text-xs ${labelColor}`}>
              {lang === 'id'
                ? 'Yakin ingin menghapus catatan deposito ini dari daftar? Riwayat transaksi buku kas yang sudah ada tidak akan terpengaruh.'
                : 'Are you sure you want to delete this deposit record? Existing transaction log records will not be altered.'}
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer ${cardAlt}`}
              >
                {lang === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteDeposit(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer"
              >
                {lang === 'id' ? 'Hapus' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
