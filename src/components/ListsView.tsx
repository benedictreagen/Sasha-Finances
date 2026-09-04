import React from 'react';
import { Database, CheckCircle2 } from 'lucide-react';

export const ListsView: React.FC = () => {
  const listsData = [
    {
      title: 'Type (Transaction Types)',
      items: ['Opening Balance', 'Income', 'Expense', 'Transfer', 'Adjustment'],
      description: 'Defines the behavioral accounting formula and balance impact.',
    },
    {
      title: 'Category',
      items: ['Food', 'Transportation', 'Education', 'Organization', 'Health', 'Shopping', 'Entertainment', 'Other'],
      description: '8 standard expense groupings tied to monthly budget allocations.',
    },
    {
      title: 'Account',
      items: ['Cash', 'Blu', 'Blu Pocket', 'Bank Jateng', 'Seabank', 'Shopeepay', 'Gopay', 'Dana'],
      description: 'Liquid cash, digital bank, and e-wallet operational holdings.',
    },
    {
      title: 'Payment Methods',
      items: ['Cash', 'QRIS', 'Transfer', 'E-Wallet', 'Virtual Account'],
      description: 'Execution channels used for personal daily transactions.',
    },
    {
      title: 'Purpose',
      items: ['Need', 'Want', 'Investment'],
      description: 'Behavioral intention classification for lifestyle analysis.',
    },
    {
      title: 'Event',
      items: ['College', 'Personal', 'Travel', 'Food', 'Shopping', 'Family', 'Organization', 'Other'],
      description: 'Activity context tags for custom filter queries.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#111116] border border-[#1F1F24] rounded-xl p-5 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#16161D] border border-[#2D2D35] rounded-lg text-[#FF7043]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Workbook Lists & Master Schema</h3>
            <p className="text-xs text-[#666670]">Master lookup tables used for Excel Data Validation dropdowns across all worksheets</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {listsData.map((list) => (
          <div key={list.title} className="bg-[#111116] border border-[#1F1F24] rounded-xl p-4 shadow-xs">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-1">{list.title}</h4>
            <p className="text-[11px] text-[#666670] mb-3">{list.description}</p>
            <div className="space-y-1.5">
              {list.items.map((item) => (
                <div key={item} className="flex items-center space-x-2 text-xs text-[#E0E0E6] p-1.5 bg-[#16161D] rounded-lg border border-[#2D2D35]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#FF7043] shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
