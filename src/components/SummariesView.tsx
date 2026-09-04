import React from 'react';
import { Transaction } from '../types';
import { formatIDR, formatPercent } from '../excelGenerator';
import { Calendar, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface SummariesViewProps {
  transactions: Transaction[];
}

export const SummariesView: React.FC<SummariesViewProps> = ({ transactions }) => {
  const months = [
    { name: 'January', num: '01' },
    { name: 'February', num: '02' },
    { name: 'March', num: '03' },
    { name: 'April', num: '04' },
    { name: 'May', num: '05' },
    { name: 'June', num: '06' },
    { name: 'July', num: '07' },
    { name: 'August', num: '08' },
    { name: 'September', num: '09' },
    { name: 'October', num: '10' },
    { name: 'November', num: '11' },
    { name: 'December', num: '12' },
  ];

  const monthlyData = months.map((m) => {
    const monthTx = transactions.filter((t) => t.date.split('-')[1] === m.num);
    const income = monthTx.reduce((sum, t) => sum + t.income, 0);
    const expense = monthTx.reduce((sum, t) => sum + t.expense, 0);
    const net = income - expense;
    const savingRate = income > 0 ? net / income : 0;
    return {
      month: m.name,
      num: m.num,
      income,
      expense,
      net,
      savingRate,
    };
  });

  const weeks = [
    { week: 'W1', range: '01/09/2026 - 07/09/2026', start: '2026-09-01', end: '2026-09-07' },
    { week: 'W2', range: '08/09/2026 - 14/09/2026', start: '2026-09-08', end: '2026-09-14' },
    { week: 'W3', range: '15/09/2026 - 21/09/2026', start: '2026-09-15', end: '2026-09-21' },
    { week: 'W4', range: '22/09/2026 - 28/09/2026', start: '2026-09-22', end: '2026-09-28' },
    { week: 'W5', range: '29/09/2026 - 30/09/2026', start: '2026-09-29', end: '2026-09-30' },
  ];

  const weeklyData = weeks.map((w) => {
    const weekTx = transactions.filter((t) => t.date >= w.start && t.date <= w.end);
    const income = weekTx.reduce((sum, t) => sum + t.income, 0);
    const expense = weekTx.reduce((sum, t) => sum + t.expense, 0);
    const net = income - expense;
    return {
      week: w.week,
      range: w.range,
      income,
      expense,
      net,
    };
  });

  return (
    <div className="space-y-6">
      {/* Monthly Summary Section */}
      <div id="monthly-summary-section" className="bg-[#111116] border border-[#1F1F24] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">2026 Monthly Cash Flow Summary</h3>
            <p className="text-xs text-[#666670]">Auto-aggregated by transaction timestamps across all 12 months</p>
          </div>
          <BarChart3 className="w-4 h-4 text-[#FF7043]" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#16161D] border-b border-[#1F1F24] text-[#666670] font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3 text-[#4CAF50]">Income</th>
                <th className="py-2.5 px-3 text-[#F44336]">Expense</th>
                <th className="py-2.5 px-3">Cash Flow (Net)</th>
                <th className="py-2.5 px-3 text-right">Savings Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F24]/50 font-medium text-[#E0E0E6]">
              {monthlyData.map((m) => (
                <tr key={m.month} className="hover:bg-[#16161D]/50 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-white">{m.month}</td>
                  <td className="py-2.5 px-3 text-[#4CAF50] font-mono">{m.income > 0 ? formatIDR(m.income) : 'Rp 0'}</td>
                  <td className="py-2.5 px-3 text-[#F44336] font-mono">{m.expense > 0 ? formatIDR(m.expense) : 'Rp 0'}</td>
                  <td className={`py-2.5 px-3 font-bold font-mono ${m.net >= 0 ? 'text-[#FF7043]' : 'text-[#F44336]'}`}>
                    {formatIDR(m.net)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-[#E0E0E6]">{formatPercent(m.savingRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly Summary Section */}
      <div id="weekly-summary-section" className="bg-[#111116] border border-[#1F1F24] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Weekly Expense Summary (September 2026)</h3>
            <p className="text-xs text-[#666670]">Structured breakdown by week of month W1 - W5</p>
          </div>
          <Calendar className="w-4 h-4 text-[#FF7043]" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#16161D] border-b border-[#1F1F24] text-[#666670] font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Week</th>
                <th className="py-2.5 px-3">Date Range</th>
                <th className="py-2.5 px-3 text-[#4CAF50]">Income</th>
                <th className="py-2.5 px-3 text-[#F44336]">Expense</th>
                <th className="py-2.5 px-3 text-right">Cash Flow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F24]/50 font-medium text-[#E0E0E6]">
              {weeklyData.map((w) => (
                <tr key={w.week} className="hover:bg-[#16161D]/50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-[#FF7043]">{w.week}</td>
                  <td className="py-2.5 px-3 text-[#666670]">{w.range}</td>
                  <td className="py-2.5 px-3 text-[#4CAF50] font-mono">{w.income > 0 ? formatIDR(w.income) : 'Rp 0'}</td>
                  <td className="py-2.5 px-3 text-[#F44336] font-mono">{w.expense > 0 ? formatIDR(w.expense) : 'Rp 0'}</td>
                  <td className={`py-2.5 px-3 text-right font-bold font-mono ${w.net >= 0 ? 'text-[#FF7043]' : 'text-[#F44336]'}`}>
                    {formatIDR(w.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
