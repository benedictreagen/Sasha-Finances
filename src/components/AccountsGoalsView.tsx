import React, { useState } from 'react';
import { AccountInfo, Category, SavingsGoal, EmergencyFundData, Transaction } from '../types';
import { formatIDR, formatPercent } from '../excelGenerator';
import { Landmark, PiggyBank, ShieldCheck, Plus, Edit2, Calendar } from 'lucide-react';

interface AccountsGoalsViewProps {
  accounts: AccountInfo[];
  budgets: Record<string, number>;
  goals: SavingsGoal[];
  emergencyFund: EmergencyFundData;
  transactions: Transaction[];
  onUpdateBudget: (category: string, newBudget: number) => void;
  onUpdateGoal: (goalId: string, saved: number) => void;
  onUpdateEmergencyFund: (target: number, current: number, idealMonths: number) => void;
}

export const AccountsGoalsView: React.FC<AccountsGoalsViewProps> = ({
  accounts,
  budgets,
  goals,
  emergencyFund,
  transactions,
  onUpdateBudget,
  onUpdateGoal,
  onUpdateEmergencyFund,
}) => {
  const [editingBudgetCategory, setEditingBudgetCategory] = useState<string | null>(null);
  const [tempBudgetAmount, setTempBudgetAmount] = useState<number>(0);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const handleStartEditBudget = (category: string, current: number) => {
    setEditingBudgetCategory(category);
    setTempBudgetAmount(current);
  };

  const handleSaveBudget = (category: string) => {
    onUpdateBudget(category, tempBudgetAmount);
    setEditingBudgetCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Account Reconciliation Table */}
      <div id="reconciliation-view" className="bg-[#111116] border border-[#1F1F24] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Accounts Reconciliation & Audit</h3>
            <p className="text-xs text-[#666670]">Opening Balance + Inflows - Outflows ± Internal Transfers</p>
          </div>
          <span className="text-xs font-semibold text-[#FF7043] bg-[#16161D] border border-[#2D2D35] px-2.5 py-1 rounded-full font-mono">
            Total Net: {formatIDR(totalBalance)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#16161D] border-b border-[#1F1F24] text-[#666670] font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Account</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Opening Balance</th>
                <th className="py-2.5 px-3 text-[#4CAF50]">Total Income</th>
                <th className="py-2.5 px-3 text-[#F44336]">Total Expense</th>
                <th className="py-2.5 px-3 text-[#FF7043]">Net Transfers</th>
                <th className="py-2.5 px-3 text-right">Current Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F24]/50 font-medium text-[#E0E0E6]">
              {accounts.map((acc) => {
                const incomeInflow = transactions
                  .filter((t) => t.account === acc.name && t.type === 'Income')
                  .reduce((sum, t) => sum + t.amount, 0);

                const expenseOutflow = transactions
                  .filter((t) => t.account === acc.name && t.type === 'Expense')
                  .reduce((sum, t) => sum + t.amount, 0);

                const transferIn = transactions
                  .filter((t) => t.type === 'Transfer' && t.toAccount === acc.name)
                  .reduce((sum, t) => sum + t.amount, 0);

                const transferOut = transactions
                  .filter((t) => t.type === 'Transfer' && t.account === acc.name)
                  .reduce((sum, t) => sum + t.amount, 0);

                const netTransfer = transferIn - transferOut;

                return (
                  <tr key={acc.name} className="hover:bg-[#16161D]/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">{acc.name}</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] bg-[#16161D] border border-[#2D2D35] text-[#666670] px-2 py-0.5 rounded font-medium">
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#666670] font-mono">{formatIDR(acc.openingBalance)}</td>
                    <td className="py-3 px-3 text-[#4CAF50] font-medium font-mono">{formatIDR(incomeInflow)}</td>
                    <td className="py-3 px-3 text-[#F44336] font-medium font-mono">{formatIDR(expenseOutflow)}</td>
                    <td className={`py-3 px-3 font-medium font-mono ${netTransfer >= 0 ? 'text-[#FF7043]' : 'text-[#666670]'}`}>
                      {netTransfer > 0 ? `+${formatIDR(netTransfer)}` : formatIDR(netTransfer)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white font-mono">{formatIDR(acc.balance)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Budget Configuration and Limits */}
      <div id="budget-settings-view" className="bg-[#111116] border border-[#1F1F24] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Monthly Budget Allocations</h3>
            <p className="text-xs text-[#666670]">Define budget ceiling for each category to ensure automated dashboard thresholds</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(budgets).map(([cat, rawAmt]) => {
            const amt = Number(rawAmt);
            const isEditing = editingBudgetCategory === cat;
            const spent = transactions
              .filter((t) => t.category === cat && t.type === 'Expense')
              .reduce((sum, t) => sum + t.expense, 0);
            const percent = amt > 0 ? spent / amt : 0;

            return (
              <div key={cat} className="p-3.5 bg-[#16161D] border border-[#2D2D35] rounded-lg text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between font-semibold text-white">
                    <span>{cat}</span>
                    <button
                      onClick={() => isEditing ? handleSaveBudget(cat) : handleStartEditBudget(cat, amt)}
                      className="text-[#FF7043] hover:text-[#FF7043]/80 cursor-pointer transition-colors"
                    >
                      {isEditing ? <span className="font-bold underline text-[11px]">Save</span> : <Edit2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="mt-2">
                      <input
                        type="number"
                        step="50000"
                        value={tempBudgetAmount}
                        onChange={(e) => setTempBudgetAmount(Number(e.target.value))}
                        className="w-full p-1.5 border border-[#FF7043] rounded bg-[#111116] font-bold text-white font-mono focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-white mt-2 font-mono">{formatIDR(amt)}</div>
                  )}
                  <div className="text-[11px] text-[#666670] mt-0.5">Spent: {formatIDR(spent)} ({formatPercent(percent)})</div>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-[#1F1F24] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${percent > 1 ? 'bg-[#F44336]' : percent > 0.8 ? 'bg-[#FFB300]' : 'bg-[#4CAF50]'}`}
                      style={{ width: `${Math.min(100, percent * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Savings Goals & Emergency Fund Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Savings Goals */}
        <div className="bg-[#111116] border border-[#1F1F24] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Savings Goals Management</h3>
              <p className="text-xs text-[#666670]">Track target amount and current accumulated savings</p>
            </div>
            <PiggyBank className="w-4 h-4 text-[#FF7043]" />
          </div>

          <div className="space-y-3">
            {goals.map((g) => (
              <div key={g.id} className="p-3 bg-[#16161D] border border-[#2D2D35] rounded-lg text-xs space-y-2">
                <div className="flex justify-between items-center font-bold text-white">
                  <span>{g.name}</span>
                  <span className="text-[#FF7043]">{formatPercent(g.saved / g.targetBalance)}</span>
                </div>
                <div className="flex justify-between text-[#666670] font-mono">
                  <span>Target: {formatIDR(g.targetBalance)}</span>
                  <span>Saved: {formatIDR(g.saved)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max={g.targetBalance}
                    step="100000"
                    value={g.saved}
                    onChange={(e) => onUpdateGoal(g.id, Number(e.target.value))}
                    className="w-full accent-[#FF7043] cursor-pointer"
                  />
                </div>
                <div className="text-[10px] text-[#666670] text-right">Target Date: {g.targetDate}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Fund Settings */}
        <div className="bg-[#111116] border border-[#1F1F24] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Emergency Fund Configuration</h3>
              <p className="text-xs text-[#666670]">Fine-tune target months and monthly essential baseline</p>
            </div>
            <ShieldCheck className="w-4 h-4 text-[#4CAF50]" />
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[#666670] font-medium mb-1">Target Emergency Amount (IDR)</label>
              <input
                type="number"
                step="500000"
                value={emergencyFund.targetAmount}
                onChange={(e) => onUpdateEmergencyFund(Number(e.target.value), emergencyFund.currentAmount, emergencyFund.idealMonths)}
                className="w-full p-2 border border-[#2D2D35] rounded-lg font-bold font-mono text-white bg-[#16161D] focus:border-[#FF7043] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#666670] font-medium mb-1">Current Emergency Reserve (IDR)</label>
              <input
                type="number"
                step="250000"
                value={emergencyFund.currentAmount}
                onChange={(e) => onUpdateEmergencyFund(emergencyFund.targetAmount, Number(e.target.value), emergencyFund.idealMonths)}
                className="w-full p-2 border border-[#2D2D35] rounded-lg font-bold font-mono text-white bg-[#16161D] focus:border-[#FF7043] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#666670] font-medium mb-1">Target Coverage Duration (Months)</label>
              <input
                type="number"
                min="1"
                max="24"
                value={emergencyFund.idealMonths}
                onChange={(e) => onUpdateEmergencyFund(emergencyFund.targetAmount, emergencyFund.currentAmount, Number(e.target.value))}
                className="w-full p-2 border border-[#2D2D35] rounded-lg font-bold font-mono text-white bg-[#16161D] focus:border-[#FF7043] focus:outline-none"
              />
            </div>

            <div className="p-3 bg-[#16161D] border border-[#FF7043]/30 rounded-lg text-[#E0E0E6]">
              <div className="font-semibold text-white">Calculated Coverage Status:</div>
              <div className="mt-1 text-xs text-[#666670]">
                You currently have <strong className="text-[#FF7043]">{(emergencyFund.currentAmount / emergencyFund.monthlyEssentialExpense).toFixed(1)} months</strong> of essential expense coverage (Benchmark: {emergencyFund.idealMonths} months).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
