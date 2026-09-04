import React, { useState } from 'react';
import { SavingsGoal, EmergencyFundData, ThemeMode } from '../types';
import { formatIDR, formatPercent } from '../excelGenerator';
import { getThemeTokens } from '../theme';
import { 
  Target, 
  ShieldAlert, 
  Plus, 
  Sparkles, 
  Calendar, 
  Check, 
  DollarSign, 
  Sliders
} from 'lucide-react';

interface GoalsViewProps {
  goals: SavingsGoal[];
  onUpdateGoals: (goals: SavingsGoal[]) => void;
  emergencyFund: EmergencyFundData;
  onUpdateEmergencyFund: (ef: EmergencyFundData) => void;
  theme?: ThemeMode;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onUpdateGoals,
  emergencyFund,
  onUpdateEmergencyFund,
  theme = 'dark',
}) => {
  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;

  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('5000000');
  const [newGoalSaved, setNewGoalSaved] = useState('500000');
  const [newGoalDate, setNewGoalDate] = useState('31/12/2026');

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || '');
  const [depositAmount, setDepositAmount] = useState('500000');

  // Emergency fund editing state
  const [isEditingEF, setIsEditingEF] = useState(false);
  const [efMonths, setEfMonths] = useState(emergencyFund.idealMonths);
  const [efExpense, setEfExpense] = useState(emergencyFund.monthlyEssentialExpense.toString());

  const cardBg = tokens.cardBg;
  const cardAlt = tokens.cardAlt;
  const labelColor = tokens.labelColor;
  const inputBg = tokens.inputBg;

  // Overall calculations
  const totalTarget = goals.reduce((sum, g) => sum + g.targetBalance, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
  const overallProgress = totalTarget > 0 ? totalSaved / totalTarget : 0;

  // Emergency Fund calculations
  const efTarget = emergencyFund.idealMonths * emergencyFund.monthlyEssentialExpense;
  const efProgress = efTarget > 0 ? emergencyFund.currentAmount / efTarget : 0;
  const currentMonthsCovered = emergencyFund.monthlyEssentialExpense > 0 
    ? (emergencyFund.currentAmount / emergencyFund.monthlyEssentialExpense).toFixed(1) 
    : '0';

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
      targetDate: newGoalDate.trim(),
    };

    onUpdateGoals([...goals, newGoal]);
    setNewGoalName('');
    setIsAddGoalModalOpen(false);
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

  const handleSaveEF = () => {
    const expenseNum = parseFloat(efExpense.replace(/[^0-9.-]+/g, '')) || emergencyFund.monthlyEssentialExpense;
    onUpdateEmergencyFund({
      ...emergencyFund,
      idealMonths: efMonths,
      monthlyEssentialExpense: expenseNum,
      targetAmount: efMonths * expenseNum,
    });
    setIsEditingEF(false);
  };

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Savings Goals & Emergency Fund</h1>
          <p className={`text-xs mt-1 ${labelColor}`}>
            Track financial targets and maintain your liquid emergency safety cushion.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsDepositModalOpen(true)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${cardAlt} hover:bg-black/5 dark:hover:bg-white/5`}
          >
            + Quick Contribution
          </button>
          <button
            onClick={() => setIsAddGoalModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Goal</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Banner */}
      <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>
              Total Savings Portfolio
            </span>
            <div className="text-3xl font-light mt-1 font-heading tracking-tight">{formatIDR(totalSaved)}</div>
            <div className={`text-xs mt-1 ${labelColor}`}>
              Targeting {formatIDR(totalTarget)} across {goals.length} structured goals
            </div>
          </div>

          <div className="w-full lg:w-96">
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span>Aggregate Milestone</span>
              <span className="font-semibold text-amber-500">{formatPercent(overallProgress)}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, overallProgress * 100))}%` }}
              />
            </div>
            <div className={`flex justify-between text-[11px] mt-1.5 ${labelColor}`}>
              <span>Funded: {formatIDR(totalSaved)}</span>
              <span>Gap: {formatIDR(Math.max(0, totalTarget - totalSaved))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Goals Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-heading flex items-center space-x-2">
            <Target className="w-5 h-5 text-amber-500" />
            <span>Active Financial Targets</span>
          </h2>
          <span className={`text-xs ${labelColor}`}>{goals.length} Goals Recorded</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((g) => {
            const pct = g.targetBalance > 0 ? g.saved / g.targetBalance : 0;
            const remaining = Math.max(0, g.targetBalance - g.saved);
            const isCompleted = g.saved >= g.targetBalance;

            return (
              <div key={g.id} className={`p-5 rounded-2xl border shadow-xs transition-all hover:shadow-md ${cardBg}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold font-heading text-base">{g.name}</h3>
                  </div>
                  {isCompleted ? (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Complete
                    </span>
                  ) : (
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${cardAlt} ${labelColor}`}>
                      In Progress
                    </span>
                  )}
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold font-heading">{formatIDR(g.saved)}</span>
                    <span className={`text-xs ${labelColor}`}>Target: {formatIDR(g.targetBalance)}</span>
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
                      {isCompleted ? 'Target achieved!' : `${formatIDR(remaining)} left`}
                    </span>
                  </div>
                </div>

                <div className={`mt-4 pt-3 border-t border-inherit flex items-center justify-between text-xs ${labelColor}`}>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Target Date: {g.targetDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Emergency Fund Calculator Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold font-heading">Emergency Fund Calculator</h2>
          </div>
          <button
            onClick={() => setIsEditingEF(!isEditingEF)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${cardAlt} cursor-pointer hover:bg-black/5 dark:hover:bg-white/5`}
          >
            <Sliders className="w-3.5 h-3.5 inline mr-1" />
            {isEditingEF ? 'Close Editor' : 'Adjust Formula'}
          </button>
        </div>

        <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
          {isEditingEF && (
            <div className={`p-4 rounded-xl border mb-6 ${cardAlt}`}>
              <h4 className="text-sm font-semibold font-heading mb-3">Adjust Benchmark Parameters</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                    Target Coverage: {efMonths} Months
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="12"
                    step="1"
                    value={efMonths}
                    onChange={(e) => setEfMonths(parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className={`flex justify-between text-[10px] mt-1 ${labelColor}`}>
                    <span>3 Months (Lean)</span>
                    <span>6 Months (Standard)</span>
                    <span>12 Months (Cautious)</span>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${labelColor}`}>
                    Monthly Essential Expenses (IDR)
                  </label>
                  <input
                    type="number"
                    value={efExpense}
                    onChange={(e) => setEfExpense(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm font-medium ${inputBg}`}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSaveEF}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer"
                >
                  Apply & Recalculate
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`p-4 rounded-xl border ${cardAlt}`}>
              <div className={`text-xs font-medium ${labelColor}`}>Monthly Essential Expenses</div>
              <div className="text-xl font-bold font-heading mt-1">
                {formatIDR(emergencyFund.monthlyEssentialExpense)}
              </div>
              <div className={`text-[11px] mt-1 ${labelColor}`}>Baseline survival cost</div>
            </div>

            <div className={`p-4 rounded-xl border ${cardAlt}`}>
              <div className={`text-xs font-medium ${labelColor}`}>Coverage Target</div>
              <div className="text-xl font-bold font-heading mt-1">
                {emergencyFund.idealMonths} Months
              </div>
              <div className={`text-[11px] mt-1 ${labelColor}`}>Total: {formatIDR(efTarget)}</div>
            </div>

            <div className={`p-4 rounded-xl border ${cardAlt}`}>
              <div className={`text-xs font-medium ${labelColor}`}>Current Liquid Fund</div>
              <div className="text-xl font-bold font-heading mt-1 text-emerald-600 dark:text-emerald-400">
                {formatIDR(emergencyFund.currentAmount)}
              </div>
              <div className={`text-[11px] mt-1 ${labelColor}`}>
                Provides {currentMonthsCovered} months of runway
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${cardAlt}`}>
              <div className={`text-xs font-medium ${labelColor}`}>Coverage Status</div>
              <div className="text-xl font-bold font-heading mt-1 text-amber-500">
                {formatPercent(efProgress)}
              </div>
              <div className={`text-[11px] mt-1 ${labelColor}`}>
                Shortfall: {formatIDR(Math.max(0, efTarget - emergencyFund.currentAmount))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span>Safety Net Progress</span>
              <span className="font-semibold">{currentMonthsCovered} / {emergencyFund.idealMonths} Months Funded</span>
            </div>
            <div className="w-full h-3 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, efProgress * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Goal Modal */}
      {isAddGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border shadow-xl p-6 ${cardBg}`}>
            <h3 className="text-base font-semibold font-heading pb-3 border-b border-inherit">
              Create New Savings Goal
            </h3>
            <form onSubmit={handleAddGoal} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${labelColor}`}>Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Camera Lens, Umrah, Investment fund..."
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-medium ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${labelColor}`}>Target (IDR)</label>
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
                  <label className={`block text-xs font-medium mb-1 ${labelColor}`}>Currently Saved</label>
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
                <label className={`block text-xs font-medium mb-1 ${labelColor}`}>Target Date</label>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-black transition-colors"
                >
                  Save Goal
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
            <h3 className="text-base font-semibold font-heading pb-3 border-b border-inherit">
              Contribute to Savings Goal
            </h3>
            <form onSubmit={handleDeposit} className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${labelColor}`}>Select Goal</label>
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-medium ${inputBg}`}
                >
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Current: {formatIDR(g.saved)} / {formatIDR(g.targetBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${labelColor}`}>Deposit Amount (IDR)</label>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-black transition-colors"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
