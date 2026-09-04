import React, { useState } from 'react';
import { 
  Repeat, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  Calendar, 
  ArrowRightCircle, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { 
  RecurringTransaction, 
  TransactionType, 
  Category, 
  AccountName, 
  PaymentMethod, 
  Purpose, 
  Frequency 
} from '../types';
import { formatIDR } from '../excelGenerator';
import { getNextScheduledDate } from '../recurringEngine';

interface RecurringViewProps {
  recurringRules: RecurringTransaction[];
  onAddRule: (rule: Omit<RecurringTransaction, 'id'>) => void;
  onToggleStatus: (id: string) => void;
  onDeleteRule: (id: string) => void;
  onSyncDueTransactions: () => void;
  theme?: 'dark' | 'light';
}

export const RecurringView: React.FC<RecurringViewProps> = ({
  recurringRules,
  onAddRule,
  onToggleStatus,
  onDeleteRule,
  onSyncDueTransactions,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const [showAddForm, setShowAddForm] = useState(false);
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('Expense');
  const [category, setCategory] = useState<Category>('Food');
  const [account, setAccount] = useState<AccountName>('Blu');
  const [toAccount, setToAccount] = useState<AccountName>('Cash');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [amount, setAmount] = useState<string>('');
  const [purpose, setPurpose] = useState<Purpose>('Need');
  const [event, setEvent] = useState<string>('Personal');
  const [frequency, setFrequency] = useState<Frequency>('Monthly');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    onAddRule({
      description: description.trim(),
      type,
      category,
      account,
      toAccount: type === 'Transfer' ? toAccount : undefined,
      paymentMethod,
      amount: parsedAmount,
      purpose,
      event,
      frequency,
      startDate,
      status: 'Active',
      notes: notes.trim(),
    });

    setDescription('');
    setAmount('');
    setNotes('');
    setShowAddForm(false);
  };

  // Metric summaries
  const totalMonthlyRecurringExpense = recurringRules
    .filter(r => r.status === 'Active' && r.type === 'Expense')
    .reduce((sum, r) => {
      let multiplier = 1;
      if (r.frequency === 'Weekly') multiplier = 4.33;
      else if (r.frequency === 'Bi-weekly') multiplier = 2.16;
      else if (r.frequency === 'Daily') multiplier = 30;
      else if (r.frequency === 'Yearly') multiplier = 1 / 12;
      return sum + (r.amount * multiplier);
    }, 0);

  const totalMonthlyRecurringIncome = recurringRules
    .filter(r => r.status === 'Active' && r.type === 'Income')
    .reduce((sum, r) => {
      let multiplier = 1;
      if (r.frequency === 'Weekly') multiplier = 4.33;
      else if (r.frequency === 'Bi-weekly') multiplier = 2.16;
      else if (r.frequency === 'Daily') multiplier = 30;
      else if (r.frequency === 'Yearly') multiplier = 1 / 12;
      return sum + (r.amount * multiplier);
    }, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner with Action Buttons */}
      <div className={`border rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isDark ? 'bg-[#111116] border-[#1F1F24]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-[#FF7043]/10 text-[#FF7043] border border-[#FF7043]/20">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-inherit">Recurring Transactions Engine</h2>
            <p className="text-xs text-[#666670] mt-0.5">
              Define scheduled income, recurring expenses, and fixed subscriptions. Automatic sync populates the Transactions ledger with zero duplication.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 w-full md:w-auto">
          <button
            id="btn-sync-recurring"
            onClick={onSyncDueTransactions}
            className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-[#FF7043] text-white hover:bg-[#F4511E] font-semibold text-xs transition-all shadow-xs cursor-pointer border border-[#FF7043]/30"
            title="Evaluate active recurrence rules up to current date and log non-duplicated transactions"
          >
            <ArrowRightCircle className="w-4 h-4" />
            <span>Sync Due to Transactions</span>
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs border transition-all cursor-pointer ${
              showAddForm
                ? 'bg-[#FF7043]/15 border-[#FF7043] text-[#FF7043]'
                : isDark
                  ? 'bg-[#16161D] border-[#2D2D35] text-white hover:bg-[#1F1F24]'
                  : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'New Rule'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-[#111116] border-[#1F1F24]' : 'bg-white border-slate-200'
        }`}>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#666670]">Active Recurring Rules</div>
          <div className="text-xl font-bold font-mono text-inherit mt-1.5">
            {recurringRules.filter(r => r.status === 'Active').length} <span className="text-xs font-normal text-[#666670]">of {recurringRules.length}</span>
          </div>
          <div className="text-[11px] text-[#666670] mt-1">Automatic occurrence tracking</div>
        </div>

        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-[#111116] border-[#1F1F24]' : 'bg-white border-slate-200'
        }`}>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#666670]">Est. Monthly Outflows</div>
          <div className="text-xl font-bold font-mono text-[#F44336] mt-1.5">
            {formatIDR(totalMonthlyRecurringExpense)}
          </div>
          <div className="text-[11px] text-[#666670] mt-1">Fixed rent, data, food, and bills</div>
        </div>

        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-[#111116] border-[#1F1F24]' : 'bg-white border-slate-200'
        }`}>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#666670]">Est. Monthly Inflows</div>
          <div className="text-xl font-bold font-mono text-[#4CAF50] mt-1.5">
            {formatIDR(totalMonthlyRecurringIncome)}
          </div>
          <div className="text-[11px] text-[#666670] mt-1">Stipends & consulting deposits</div>
        </div>
      </div>

      {/* Add New Rule Form (Expandable) */}
      {showAddForm && (
        <form 
          onSubmit={handleAddSubmit}
          className={`p-5 rounded-xl border space-y-4 shadow-sm animate-fade-in ${
            isDark ? 'bg-[#111116] border-[#1F1F24]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3 border-inherit/20">
            <h3 className="text-sm font-semibold text-inherit flex items-center space-x-2">
              <Plus className="w-4 h-4 text-[#FF7043]" />
              <span>Define New Recurring Transaction</span>
            </h3>
            <span className="text-[11px] text-[#666670]">All repetitive classification fields use standard dropdown lists</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-[#666670] font-medium mb-1">Description *</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Kost Rental, Spotify, Monthly Stipend"
                className={`w-full p-2 rounded-lg border font-medium focus:outline-none focus:border-[#FF7043] ${
                  isDark ? 'bg-[#16161D] border-[#2D2D35] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[#666670] font-medium mb-1">Amount (IDR) *</label>
              <input
                type="number"
                required
                min="1000"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 1500000"
                className={`w-full p-2 rounded-lg border font-bold font-mono focus:outline-none focus:border-[#FF7043] ${
                  isDark ? 'bg-[#16161D] border-[#2D2D35] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-[#666670] font-medium mb-1">Frequency *</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Frequency)}
                className={`w-full p-2 rounded-lg border font-medium focus:outline-none focus:border-[#FF7043] ${
                  isDark ? 'bg-[#16161D] border-[#2D2D35] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly (Every 7 Days)</option>
                <option value="Bi-weekly">Bi-weekly (Every 14 Days)</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-[#666670] font-medium mb-1">Type (Dropdown)</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className={`w-full p-2 rounded-lg border font-medium focus:outline-none focus:border-[#FF7043] ${
                  isDark ? 'bg-[#16161D] border-[#2D2D35] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
                <option value="Transfer">Transfer</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[#666670] font-medium mb-1">Category (Dropdown)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className={`w-full p-2 rounded-lg border font-medium focus:outline-none focus:border-[#FF7043] ${
                  isDark ? 'bg-[#16161D] border-[#2D2D35] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                {['Food', 'Transportation', 'Education', 'Organization', 'Health', 'Shopping', 'Entertainment', 'Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Account */}
            <div>
              <label className="block text-[#666670] font-medium mb-1">Account (Dropdown)</label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value as AccountName)}
                className={`w-full p-2 rounded-lg border font-medium focus:outline-none focus:border-[#FF7043] ${
                  isDark ? 'bg-[#16161D] border-[#2D2D35] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                {['Cash', 'Blu', 'Blu Pocket', 'Bank Jateng', 'Seabank', 'Shopeepay', 'Gopay', 'Dana'].map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[#666670] font-medium mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className={`w-full p-2 rounded-lg border font-medium focus:outline-none focus:border-[#FF7043] ${
                  isDark ? 'bg-[#16161D] border-[#2D2D35] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                {['Cash', 'QRIS', 'Transfer', 'E-Wallet', 'Virtual Account'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-[#666670] font-medium mb-1">Purpose</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as Purpose)}
                className={`w-full p-2 rounded-lg border font-medium focus:outline-none focus:border-[#FF7043] ${
                  isDark ? 'bg-[#16161D] border-[#2D2D35] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="Need">Need</option>
                <option value="Want">Want</option>
                <option value="Investment">Investment</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-[#666670] font-medium mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full p-2 rounded-lg border font-medium focus:outline-none focus:border-[#FF7043] ${
                  isDark ? 'bg-[#16161D] border-[#2D2D35] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            {/* Event */}
            <div>
              <label className="block text-[#666670] font-medium mb-1">Event / Label</label>
              <input
                type="text"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="e.g. College, Personal"
                className={`w-full p-2 rounded-lg border font-medium focus:outline-none focus:border-[#FF7043] ${
                  isDark ? 'bg-[#16161D] border-[#2D2D35] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[#666670] font-medium mb-1">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Recurring reminder notes"
                className={`w-full p-2 rounded-lg border font-medium focus:outline-none focus:border-[#FF7043] ${
                  isDark ? 'bg-[#16161D] border-[#2D2D35] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-[#666670] hover:text-inherit"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#FF7043] text-white hover:bg-[#F4511E] shadow-xs cursor-pointer"
            >
              Save Recurring Rule
            </button>
          </div>
        </form>
      )}

      {/* Recurring Rules Ledger Table */}
      <div className={`border rounded-xl p-5 shadow-xs ${
        isDark ? 'bg-[#111116] border-[#1F1F24]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-inherit">Defined Recurring Items ({recurringRules.length})</h3>
            <p className="text-xs text-[#666670]">Rules configured for scheduled ledger population</p>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-[#666670]">
            <HelpCircle className="w-3.5 h-3.5 text-[#FF7043]" />
            <span>Click Sync anytime to generate transactions up to today</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b text-[11px] uppercase tracking-wider font-semibold ${
              isDark ? 'bg-[#16161D] border-[#1F1F24] text-[#666670]' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              <tr>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Frequency</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Account</th>
                <th className="py-2.5 px-3">Next Due</th>
                <th className="py-2.5 px-3">Last Generated</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F24]/30 font-medium">
              {recurringRules.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#666670]">
                    No recurring transaction rules defined yet. Click "New Rule" above to create one.
                  </td>
                </tr>
              ) : (
                recurringRules.map((rule) => {
                  const nextDue = getNextScheduledDate(rule);
                  return (
                    <tr 
                      key={rule.id} 
                      className={`transition-colors ${
                        isDark ? 'hover:bg-[#16161D]/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onToggleStatus(rule.id)}
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer border ${
                            rule.status === 'Active'
                              ? 'bg-[#4CAF50]/15 text-[#4CAF50] border-[#4CAF50]/30'
                              : 'bg-slate-500/15 text-[#666670] border-slate-500/30'
                          }`}
                          title={`Click to ${rule.status === 'Active' ? 'pause' : 'activate'} this rule`}
                        >
                          {rule.status === 'Active' ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                          <span>{rule.status}</span>
                        </button>
                      </td>
                      <td className="py-3 px-3 font-semibold text-inherit">
                        <div>{rule.description}</div>
                        {rule.notes && <div className="text-[10px] text-[#666670] font-normal">{rule.notes}</div>}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          rule.type === 'Income'
                            ? 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20'
                            : rule.type === 'Expense'
                              ? 'bg-[#F44336]/10 text-[#F44336] border-[#F44336]/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {rule.type}
                        </span>
                      </td>
                      <td className="py-3 px-3">{rule.category}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-[#FF7043]">{rule.frequency}</span>
                      </td>
                      <td className={`py-3 px-3 font-bold font-mono ${
                        rule.type === 'Income' ? 'text-[#4CAF50]' : 'text-[#F44336]'
                      }`}>
                        {formatIDR(rule.amount)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-inherit">{rule.account}</span>
                        {rule.toAccount && <span className="text-[#666670]"> → {rule.toAccount}</span>}
                      </td>
                      <td className="py-3 px-3 font-mono text-inherit">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-[#666670]" />
                          <span>{nextDue}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#666670]">
                        {rule.lastGeneratedDate || 'Never'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onDeleteRule(rule.id)}
                          className="p-1.5 rounded text-[#666670] hover:text-[#F44336] hover:bg-[#F44336]/10 transition-colors cursor-pointer"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
