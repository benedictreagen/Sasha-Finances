import React, { useState } from 'react';
import { SavingsGoal, EmergencyFundData, ThemeMode } from '../types';
import { formatIDR, formatPercent } from '../excelGenerator';
import { getThemeTokens } from '../theme';
import { Language, t } from '../i18n';
import { 
  Target, 
  ShieldAlert, 
  Plus, 
  Sparkles, 
  Calendar, 
  Check, 
  DollarSign, 
  Sliders,
  Edit2,
  Trash2,
  X,
  Info,
  ShieldCheck
} from 'lucide-react';

interface GoalsViewProps {
  goals: SavingsGoal[];
  onUpdateGoals: (goals: SavingsGoal[]) => void;
  emergencyFund: EmergencyFundData;
  onUpdateEmergencyFund: (ef: EmergencyFundData) => void;
  theme?: ThemeMode;
  lang?: Language;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onUpdateGoals,
  emergencyFund,
  onUpdateEmergencyFund,
  theme = 'dark',
  lang = 'id',
}) => {
  const tokens = getThemeTokens(theme);

  // Add Goal Modal State
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('5000000');
  const [newGoalSaved, setNewGoalSaved] = useState('500000');
  const [newGoalDate, setNewGoalDate] = useState('31/12/2026');

  // Edit Goal Modal State
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [editGoalName, setEditGoalName] = useState('');
  const [editGoalTarget, setEditGoalTarget] = useState('');
  const [editGoalSaved, setEditGoalSaved] = useState('');
  const [editGoalDate, setEditGoalDate] = useState('');

  // Deposit Modal State
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || '');
  const [depositAmount, setDepositAmount] = useState('500000');

  // Emergency Fund Modal / Editor State
  const [isEFModalOpen, setIsEFModalOpen] = useState(false);
  const [efMonths, setEfMonths] = useState(emergencyFund.idealMonths || 6);
  const [efExpense, setEfExpense] = useState(emergencyFund.monthlyEssentialExpense?.toString() || '4000000');
  const [efCurrentSaved, setEfCurrentSaved] = useState(emergencyFund.currentAmount?.toString() || '14950000');
  const [efIsManual, setEfIsManual] = useState(!!emergencyFund.isManualTarget);
  const [efManualTarget, setEfManualTarget] = useState(emergencyFund.targetAmount?.toString() || '24000000');

  const cardBg = tokens.cardBg;
  const cardAlt = tokens.cardAlt;
  const labelColor = tokens.labelColor;
  const inputBg = tokens.inputBg;

  // Overall calculations for Goals
  const totalTarget = goals.reduce((sum, g) => sum + g.targetBalance, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
  const overallProgress = totalTarget > 0 ? totalSaved / totalTarget : 0;

  // Emergency Fund calculations
  const efMonthlyExpenseNum = parseFloat(efExpense.replace(/[^0-9.-]+/g, '')) || 0;
  const efCurrentSavedNum = parseFloat(efCurrentSaved.replace(/[^0-9.-]+/g, '')) || 0;
  const efComputedAutoTarget = efMonths * efMonthlyExpenseNum;
  const efTarget = emergencyFund.isManualTarget 
    ? emergencyFund.targetAmount 
    : (emergencyFund.idealMonths * emergencyFund.monthlyEssentialExpense);
  const efProgress = efTarget > 0 ? emergencyFund.currentAmount / efTarget : 0;
  const efGap = Math.max(0, efTarget - emergencyFund.currentAmount);
  const currentMonthsCovered = emergencyFund.monthlyEssentialExpense > 0 
    ? (emergencyFund.currentAmount / emergencyFund.monthlyEssentialExpense).toFixed(1) 
    : '0';

  // Handlers for Goals
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(newGoalTarget.replace(/[^0-9.-]+/g, ''));
    const saved = parseFloat(newGoalSaved.replace(/[^0-9.-]+/g, '')) || 0;
    if (!newGoalName.trim() || isNaN(target) || target <= 0) return;

    const newGoal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      name: newGoalName.trim(),
      targetBalance: target,
      saved: saved,
      targetDate: newGoalDate.trim() || '31/12/2026',
    };

    onUpdateGoals([...goals, newGoal]);
    setNewGoalName('');
    setIsAddGoalModalOpen(false);
  };

  const handleOpenEditGoal = (g: SavingsGoal) => {
    setEditingGoal(g);
    setEditGoalName(g.name);
    setEditGoalTarget(g.targetBalance.toString());
    setEditGoalSaved(g.saved.toString());
    setEditGoalDate(g.targetDate);
  };

  const handleSaveEditGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;

    const target = parseFloat(editGoalTarget.replace(/[^0-9.-]+/g, ''));
    const saved = parseFloat(editGoalSaved.replace(/[^0-9.-]+/g, '')) || 0;
    if (!editGoalName.trim() || isNaN(target) || target <= 0) return;

    const updated = goals.map((item) => {
      if (item.id === editingGoal.id) {
        return {
          ...item,
          name: editGoalName.trim(),
          targetBalance: target,
          saved: saved,
          targetDate: editGoalDate.trim() || item.targetDate,
        };
      }
      return item;
    });

    onUpdateGoals(updated);
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    const confirmDelete = window.confirm(
      lang === 'id' 
        ? 'Apakah Anda yakin ingin menghapus target tabungan ini?' 
        : 'Are you sure you want to delete this savings goal?'
    );
    if (!confirmDelete) return;

    onUpdateGoals(goals.filter(g => g.id !== goalId));
    setEditingGoal(null);
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount.replace(/[^0-9.-]+/g, ''));
    if (isNaN(amt) || amt <= 0 || !selectedGoalId) return;

    const updated = goals.map((g) => {
      if (g.id === selectedGoalId) {
        return { ...g, saved: g.saved + amt };
      }
      return g;
    });

    onUpdateGoals(updated);
    setIsDepositModalOpen(false);
  };

  // Handlers for Emergency Fund
  const handleOpenEFModal = () => {
    setEfMonths(emergencyFund.idealMonths || 6);
    setEfExpense(emergencyFund.monthlyEssentialExpense?.toString() || '4000000');
    setEfCurrentSaved(emergencyFund.currentAmount?.toString() || '14950000');
    setEfIsManual(!!emergencyFund.isManualTarget);
    setEfManualTarget(emergencyFund.targetAmount?.toString() || (emergencyFund.idealMonths * emergencyFund.monthlyEssentialExpense).toString());
    setIsEFModalOpen(true);
  };

  const handleSaveEF = (e: React.FormEvent) => {
    e.preventDefault();
    const expenseNum = parseFloat(efExpense.replace(/[^0-9.-]+/g, '')) || 0;
    const currentNum = parseFloat(efCurrentSaved.replace(/[^0-9.-]+/g, '')) || 0;
    const manualTargetNum = parseFloat(efManualTarget.replace(/[^0-9.-]+/g, '')) || (efMonths * expenseNum);

    const calculatedTarget = efIsManual ? manualTargetNum : (efMonths * expenseNum);

    onUpdateEmergencyFund({
      monthlyEssentialExpense: expenseNum,
      idealMonths: efMonths,
      targetAmount: calculatedTarget,
      currentAmount: currentNum,
      isManualTarget: efIsManual,
    });

    setIsEFModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">{t('goalsTitle', lang)}</h1>
          <p className={`text-xs mt-1 ${labelColor}`}>
            {lang === 'id' 
              ? 'Kelola target impian finansial dan konfigurasi dana darurat terukur tanpa mengubah riwayat transaksi.' 
              : 'Manage savings milestones and configure your emergency fund buffer without altering transaction records.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsDepositModalOpen(true)}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl border font-semibold text-xs cursor-pointer transition-colors shadow-2xs ${cardAlt} hover:border-amber-500`}
          >
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span>{lang === 'id' ? '+ Tambah Setoran Tabungan' : '+ Contribute to Goal'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddGoalModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addGoalButton', lang)}</span>
          </button>
        </div>
      </div>

      {/* Aggregate Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
              {t('totalGoalsTarget', lang)}
            </span>
            <Target className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-heading mt-2">{formatIDR(totalTarget)}</div>
          <p className={`text-xs mt-1 ${labelColor}`}>
            {goals.length} {lang === 'id' ? 'target tabungan tercatat' : 'active savings goals'}
          </p>
        </div>

        <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
              {t('totalGoalsSaved', lang)}
            </span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-heading mt-2 text-emerald-600 dark:text-emerald-400">
            {formatIDR(totalSaved)}
          </div>
          <p className={`text-xs mt-1 ${labelColor}`}>
            {formatPercent(overallProgress)} {lang === 'id' ? 'dari total target terdanai' : 'of total target funded'}
          </p>
        </div>

        <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
              {lang === 'id' ? 'Kekurangan Dana Total' : 'Remaining To Save'}
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-heading mt-2">
            {formatIDR(Math.max(0, totalTarget - totalSaved))}
          </div>
          <p className={`text-xs mt-1 ${labelColor}`}>
            {lang === 'id' ? 'Perlu dialokasikan ke depan' : 'Total gap across all goals'}
          </p>
        </div>
      </div>

      {/* Savings Goals Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-heading flex items-center space-x-2">
            <Target className="w-5 h-5 text-amber-500" />
            <span>{lang === 'id' ? 'Target Tabungan Aktif' : 'Active Financial Targets'}</span>
          </h2>
          <span className={`text-xs ${labelColor}`}>
            {goals.length} {lang === 'id' ? 'Target Tercatat' : 'Goals Recorded'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((g) => {
            const pct = g.targetBalance > 0 ? g.saved / g.targetBalance : 0;
            const remaining = Math.max(0, g.targetBalance - g.saved);
            const isCompleted = g.saved >= g.targetBalance;

            return (
              <div 
                key={g.id} 
                className={`p-5 rounded-2xl border shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${cardBg}`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold font-heading text-base">{g.name}</h3>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <Calendar className="w-3 h-3 text-inherit opacity-60" />
                          <span className={`text-[10px] ${labelColor}`}>{g.targetDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {isCompleted ? (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {lang === 'id' ? 'Selesai' : 'Complete'}
                        </span>
                      ) : (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cardAlt} ${labelColor}`}>
                          {lang === 'id' ? 'Berjalan' : 'In Progress'}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenEditGoal(g)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${cardAlt} hover:border-amber-500 hover:text-amber-500`}
                        title={t('editGoal', lang)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold font-heading">{formatIDR(g.saved)}</span>
                      <span className={`text-xs ${labelColor}`}>{lang === 'id' ? 'Target' : 'Target'}: {formatIDR(g.targetBalance)}</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, pct * 100))}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs pt-1">
                      <span className="font-semibold">{formatPercent(pct)}</span>
                      <span className={labelColor}>
                        {isCompleted ? (lang === 'id' ? 'Target tercapai!' : 'Target achieved!') : `${formatIDR(remaining)} ${lang === 'id' ? 'lagi' : 'left'}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`mt-4 pt-3 border-t border-inherit flex items-center justify-between text-xs ${labelColor}`}>
                  <span>{lang === 'id' ? 'Batas Waktu' : 'Target Date'}: {g.targetDate}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGoalId(g.id);
                      setIsDepositModalOpen(true);
                    }}
                    className="text-amber-500 hover:underline font-medium text-xs cursor-pointer"
                  >
                    {lang === 'id' ? '+ Setor' : '+ Deposit'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Emergency Fund Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-emerald-500" />
            <div>
              <h2 className="text-lg font-semibold font-heading">
                {lang === 'id' ? 'Kalkulator & Parameter Dana Darurat' : 'Emergency Fund Calculator & Configuration'}
              </h2>
              <p className={`text-xs ${labelColor}`}>
                {lang === 'id' 
                  ? 'Konfigurasi target proteksi likuiditas tanpa membuat mutasi transaksi palsu.' 
                  : 'Configure buffer targets without generating fake transactions.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenEFModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t('configureEmergencyFund', lang)}</span>
          </button>
        </div>

        <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`p-4 rounded-xl border ${cardAlt}`}>
              <div className={`text-xs font-medium ${labelColor}`}>
                {t('efMonthlyExpenses', lang)}
              </div>
              <div className="text-xl font-bold font-heading mt-1">
                {formatIDR(emergencyFund.monthlyEssentialExpense)}
              </div>
              <div className={`text-[11px] mt-1 ${labelColor}`}>
                {lang === 'id' ? 'Biaya kebutuhan bertahan hidup' : 'Baseline survival cost'}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${cardAlt}`}>
              <div className={`text-xs font-medium ${labelColor}`}>
                {t('efTargetMonths', lang)}
              </div>
              <div className="text-xl font-bold font-heading mt-1">
                {emergencyFund.idealMonths} {lang === 'id' ? 'Bulan' : 'Months'}
              </div>
              <div className={`text-[11px] mt-1 ${labelColor}`}>
                {emergencyFund.isManualTarget 
                  ? (lang === 'id' ? 'Mode: Target Kustom Manual' : 'Mode: Manual Target') 
                  : `${emergencyFund.idealMonths} × ${formatIDR(emergencyFund.monthlyEssentialExpense)}`}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${cardAlt}`}>
              <div className={`text-xs font-medium ${labelColor}`}>
                {t('efTargetAmount', lang)}
              </div>
              <div className="text-xl font-bold font-heading mt-1 text-amber-500">
                {formatIDR(efTarget)}
              </div>
              <div className={`text-[11px] mt-1 ${labelColor}`}>
                {lang === 'id' ? 'Target dana darurat ideal' : 'Ideal liquidity buffer'}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${cardAlt}`}>
              <div className={`text-xs font-medium ${labelColor}`}>
                {t('efCurrentSaved', lang)}
              </div>
              <div className="text-xl font-bold font-heading mt-1 text-emerald-600 dark:text-emerald-400">
                {formatIDR(emergencyFund.currentAmount)}
              </div>
              <div className={`text-[11px] mt-1 ${labelColor}`}>
                {lang === 'id' ? `Menyediakan ${currentMonthsCovered} bulan cadangan` : `Provides ${currentMonthsCovered} months of runway`}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-inherit">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-medium mb-2 gap-1">
              <span className="flex items-center space-x-1.5">
                <span>{lang === 'id' ? 'Progres Jaring Pengaman Likuiditas' : 'Liquidity Safety Net Progress'}</span>
                <span className="text-amber-500 font-bold">({formatPercent(efProgress)})</span>
              </span>
              <span className={labelColor}>
                {lang === 'id' 
                  ? `Sisa kebutuhan: ${formatIDR(efGap)} (${currentMonthsCovered} dari ${emergencyFund.idealMonths} bulan)` 
                  : `Shortfall: ${formatIDR(efGap)} (${currentMonthsCovered} of ${emergencyFund.idealMonths} months)`}
              </span>
            </div>
            <div className="w-full h-3.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, efProgress * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border shadow-xl p-6 ${cardBg}`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-semibold font-heading">{t('editGoal', lang)}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingGoal(null)}
                className={`p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 ${labelColor}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditGoal} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                  {t('goalName', lang)}
                </label>
                <input
                  type="text"
                  required
                  value={editGoalName}
                  onChange={(e) => setEditGoalName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-medium ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                    {lang === 'id' ? 'Target (IDR)' : 'Target (IDR)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editGoalTarget}
                    onChange={(e) => setEditGoalTarget(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-medium ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                    {lang === 'id' ? 'Terkumpul Saat Ini' : 'Currently Saved'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editGoalSaved}
                    onChange={(e) => setEditGoalSaved(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-medium ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                  {lang === 'id' ? 'Batas Waktu (Target Date)' : 'Target Date'}
                </label>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={editGoalDate}
                  onChange={(e) => setEditGoalDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-medium ${inputBg}`}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => handleDeleteGoal(editingGoal.id)}
                  className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-medium cursor-pointer flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('delete', lang)}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingGoal(null)}
                    className={`px-4 py-2 text-xs font-medium rounded-xl hover:bg-black/5 dark:hover:bg-white/5 ${labelColor}`}
                  >
                    {t('cancel', lang)}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-black transition-colors"
                  >
                    {t('save', lang)}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configure Emergency Fund Modal */}
      {isEFModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl p-6 ${cardBg}`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold font-heading">{t('configureEmergencyFund', lang)}</h3>
                  <p className={`text-xs ${labelColor}`}>
                    {lang === 'id' ? 'Sesuaikan parameter dan target dana darurat' : 'Adjust buffer parameters and target amounts'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEFModalOpen(false)}
                className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${labelColor}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEF} className="mt-4 space-y-4">
              {/* Calculation Mode Toggle */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>
                  {lang === 'id' ? 'Metode Penentuan Target' : 'Target Calculation Mode'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEfIsManual(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-center cursor-pointer transition-colors ${
                      !efIsManual 
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500 font-semibold' 
                        : `${cardAlt} ${labelColor}`
                    }`}
                  >
                    {t('efAutoMode', lang)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEfIsManual(true)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-center cursor-pointer transition-colors ${
                      efIsManual 
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500 font-semibold' 
                        : `${cardAlt} ${labelColor}`
                    }`}
                  >
                    {t('efManualMode', lang)}
                  </button>
                </div>
              </div>

              {/* Monthly Essential Expenses */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                  {t('efMonthlyExpenses', lang)} (IDR)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100000"
                  value={efExpense}
                  onChange={(e) => setEfExpense(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm font-mono font-medium ${inputBg}`}
                />
                <p className={`text-[11px] ${labelColor} mt-1`}>
                  {lang === 'id' ? 'Biaya kebutuhan pokok dasar bulanan (makan, sewa/tempat tinggal, utilitas, transportasi wajib).' : 'Basic monthly survival expenses (food, shelter, utilities, essential transit).'}
                </p>
              </div>

              {/* Target Coverage Months */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className={`text-xs font-medium ${labelColor}`}>
                    {t('efTargetMonths', lang)}: <strong>{efMonths} {lang === 'id' ? 'Bulan' : 'Months'}</strong>
                  </label>
                  <span className="text-xs text-amber-500 font-semibold">
                    {!efIsManual ? formatIDR(efComputedAutoTarget) : ''}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={efMonths}
                  onChange={(e) => setEfMonths(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className={`flex justify-between text-[10px] mt-1 ${labelColor}`}>
                  <span>3 {lang === 'id' ? 'Bulan (Minimal)' : 'Months (Lean)'}</span>
                  <span>6 {lang === 'id' ? 'Bulan (Standar)' : 'Months (Standard)'}</span>
                  <span>12 {lang === 'id' ? 'Bulan (Aman)' : 'Months (Safe)'}</span>
                </div>
              </div>

              {/* Manual Target Amount if enabled */}
              {efIsManual && (
                <div>
                  <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                    {t('efTargetAmount', lang)} (IDR Manual)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={efManualTarget}
                    onChange={(e) => setEfManualTarget(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border text-sm font-mono font-medium ${inputBg}`}
                  />
                </div>
              )}

              {/* Current Amount Saved */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                  {t('efCurrentSaved', lang)} (IDR)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={efCurrentSaved}
                  onChange={(e) => setEfCurrentSaved(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm font-mono font-medium ${inputBg}`}
                />
                <p className={`text-[11px] ${labelColor} mt-1`}>
                  {lang === 'id' ? 'Jumlah saldo likuid yang saat ini dikhususkan sebagai dana darurat.' : 'Liquid fund balance currently designated as your safety reserve.'}
                </p>
              </div>

              {/* Live Preview Summary Box */}
              <div className={`p-4 rounded-xl border ${cardAlt} space-y-2`}>
                <div className="text-xs font-semibold flex items-center space-x-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>{lang === 'id' ? 'Hasil Perhitungan Langsung' : 'Live Derived Calculations'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className={labelColor}>{lang === 'id' ? 'Target Proteksi' : 'Target Buffer'}:</span>
                    <p className="font-semibold">{formatIDR(efIsManual ? parseFloat(efManualTarget) || 0 : efComputedAutoTarget)}</p>
                  </div>
                  <div>
                    <span className={labelColor}>{lang === 'id' ? 'Dana Terkumpul' : 'Liquid Saved'}:</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatIDR(efCurrentSavedNum)}</p>
                  </div>
                  <div>
                    <span className={labelColor}>{lang === 'id' ? 'Kekurangan Dana' : 'Shortfall'}:</span>
                    <p className="font-semibold">
                      {formatIDR(Math.max(0, (efIsManual ? parseFloat(efManualTarget) || 0 : efComputedAutoTarget) - efCurrentSavedNum))}
                    </p>
                  </div>
                  <div>
                    <span className={labelColor}>{lang === 'id' ? 'Bulan Tercukupi' : 'Months Runway'}:</span>
                    <p className="font-semibold text-amber-500">
                      {efMonthlyExpenseNum > 0 ? (efCurrentSavedNum / efMonthlyExpenseNum).toFixed(1) : '0'} {lang === 'id' ? 'Bulan' : 'Months'}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`flex items-start space-x-1.5 text-[11px] ${labelColor}`}>
                <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  {lang === 'id'
                    ? 'Perhitungan ini adalah konfigurasi parameter dan tidak akan mengubah riwayat transaksi atau membuat transaksi palsu.'
                    : 'These calculations are configuration values and will not alter transaction records or generate fake transactions.'}
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsEFModalOpen(false)}
                  className={`px-4 py-2 text-xs font-medium rounded-xl hover:bg-black/5 dark:hover:bg-white/5 ${labelColor}`}
                >
                  {t('cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-black transition-colors shadow-xs"
                >
                  {lang === 'id' ? 'Simpan Konfigurasi' : 'Apply Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {isAddGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border shadow-xl p-6 ${cardBg}`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <h3 className="text-base font-semibold font-heading">
                {lang === 'id' ? 'Buat Target Tabungan Baru' : 'Create New Savings Goal'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddGoalModalOpen(false)}
                className={`p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 ${labelColor}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddGoal} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                  {lang === 'id' ? 'Nama Target' : 'Goal Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'id' ? 'cth: Lensa Kamera Baru, Umroh, Dana Investasi...' : 'e.g. New Camera Lens, Umrah, Investment fund...'}
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-medium ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                    {lang === 'id' ? 'Target (IDR)' : 'Target (IDR)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-medium ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                    {lang === 'id' ? 'Terkumpul Saat Ini' : 'Currently Saved'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newGoalSaved}
                    onChange={(e) => setNewGoalSaved(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-medium ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                  {lang === 'id' ? 'Batas Waktu (Target Date)' : 'Target Date'}
                </label>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={newGoalDate}
                  onChange={(e) => setNewGoalDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-medium ${inputBg}`}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsAddGoalModalOpen(false)}
                  className={`px-4 py-2 text-xs font-medium rounded-xl hover:bg-black/5 dark:hover:bg-white/5 ${labelColor}`}
                >
                  {t('cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-black transition-colors"
                >
                  {lang === 'id' ? 'Simpan Target' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Deposit Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border shadow-xl p-6 ${cardBg}`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <h3 className="text-base font-semibold font-heading">
                {lang === 'id' ? 'Tambah Setoran Tabungan' : 'Contribute to Savings Goal'}
              </h3>
              <button
                type="button"
                onClick={() => setIsDepositModalOpen(false)}
                className={`p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 ${labelColor}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleDeposit} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                  {lang === 'id' ? 'Pilih Target' : 'Select Goal'}
                </label>
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-medium ${inputBg}`}
                >
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({lang === 'id' ? 'Saat ini' : 'Current'}: {formatIDR(g.saved)} / {formatIDR(g.targetBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                  {lang === 'id' ? 'Jumlah Setoran (IDR)' : 'Deposit Amount (IDR)'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-medium ${inputBg}`}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className={`px-4 py-2 text-xs font-medium rounded-xl hover:bg-black/5 dark:hover:bg-white/5 ${labelColor}`}
                >
                  {t('cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-black transition-colors"
                >
                  {lang === 'id' ? 'Konfirmasi Setoran' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
