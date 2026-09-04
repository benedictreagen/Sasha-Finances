import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { Transaction, TransactionType, Category, AccountName, PaymentMethod, Purpose } from '../types';
import { formatIDR } from '../excelGenerator';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: Omit<Transaction, 'id' | 'income' | 'expense'>[]) => void;
  theme?: 'dark' | 'light';
}

interface ParsedRow {
  date: string;
  description: string;
  type: TransactionType;
  category: Category;
  account: AccountName;
  toAccount?: AccountName;
  paymentMethod: PaymentMethod;
  amount: number;
  purpose: Purpose;
  event: string;
  notes: string;
  isValid: boolean;
  errorMsg?: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  theme = 'dark',
}) => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  // Template CSV generator
  const handleDownloadTemplate = () => {
    const headers = 'Date,Description,Type,Category,Account,To Account,Payment Method,Amount,Purpose,Event,Notes';
    const sample1 = '2026-09-03,Campus Lunch & Drink,Expense,Food,Blu,,QRIS,25000,Need,College,Canteen lunch';
    const sample2 = '2026-09-04,Freelance Web Project Payout,Income,Other,Seabank,,Transfer,2500000,Need,Personal,Phase 1 completion';
    const sample3 = '2026-09-04,Transport Topup,Transfer,Transportation,Blu,Gopay,Transfer,150000,Need,Personal,Commuter funds';
    const csv = `${headers}\n${sample1}\n${sample2}\n${sample3}`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sashas_transactions_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV helper
  const parseCsvText = (text: string) => {
    setError(null);
    try {
      const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        setError('The CSV file appears to be empty or missing data rows.');
        setParsedRows([]);
        return;
      }

      // Detect delimiter (, or ;)
      const headerLine = lines[0];
      const delimiter = headerLine.includes(';') && !headerLine.includes(',') ? ';' : ',';

      // Parse headers
      const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

      // Helper to map index
      const getIdx = (candidates: string[]) => headers.findIndex(h => candidates.some(c => h.includes(c)));

      const dateIdx = getIdx(['date', 'tanggal']);
      const descIdx = getIdx(['desc', 'keterangan', 'uraian']);
      const typeIdx = getIdx(['type', 'tipe', 'jenis']);
      const catIdx = getIdx(['cat', 'kategori']);
      const accIdx = getIdx(['acc', 'account', 'rekening', 'sumber']);
      const toAccIdx = getIdx(['to acc', 'tujuan', 'toaccount']);
      const payIdx = getIdx(['payment', 'metode', 'method']);
      const amtIdx = getIdx(['amount', 'jumlah', 'nominal', 'total']);
      const purpIdx = getIdx(['purpose', 'tujuan/kebutuhan']);
      const evtIdx = getIdx(['event', 'acara', 'label']);
      const noteIdx = getIdx(['note', 'catatan']);

      if (descIdx === -1 || amtIdx === -1) {
        setError('CSV must at least contain "Description" and "Amount" columns.');
        return;
      }

      const rows: ParsedRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const rawLine = lines[i];
        // Split with care for quotes
        const cols = rawLine.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length === 0 || cols.every(c => c === '')) continue;

        const rawDate = dateIdx !== -1 ? cols[dateIdx] : '';
        const rawDesc = cols[descIdx] || 'Imported Transaction';
        const rawType = (typeIdx !== -1 ? cols[typeIdx] : 'Expense') as TransactionType;
        const rawCat = (catIdx !== -1 ? cols[catIdx] : 'Other') as Category;
        const rawAcc = (accIdx !== -1 ? cols[accIdx] : 'Blu') as AccountName;
        const rawToAcc = (toAccIdx !== -1 && cols[toAccIdx]) ? (cols[toAccIdx] as AccountName) : undefined;
        const rawPay = (payIdx !== -1 ? cols[payIdx] : 'QRIS') as PaymentMethod;
        const rawAmtStr = (amtIdx !== -1 ? cols[amtIdx] : '0').replace(/[^0-9.-]+/g, '');
        const rawAmt = Math.abs(parseFloat(rawAmtStr) || 0);
        const rawPurp = (purpIdx !== -1 ? cols[purpIdx] : 'Need') as Purpose;
        const rawEvt = evtIdx !== -1 ? cols[evtIdx] : 'Personal';
        const rawNote = noteIdx !== -1 ? cols[noteIdx] : 'Imported via CSV';

        // Normalize date to YYYY-MM-DD
        let formattedDate = new Date().toISOString().split('T')[0];
        if (rawDate) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
            formattedDate = rawDate;
          } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawDate)) {
            const [d, m, y] = rawDate.split('/');
            formattedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }
        }

        const validTypes: TransactionType[] = ['Opening Balance', 'Income', 'Expense', 'Transfer', 'Adjustment'];
        const validCategories: Category[] = ['Food', 'Transportation', 'Education', 'Organization', 'Health', 'Shopping', 'Entertainment', 'Other'];
        const validAccounts: AccountName[] = ['Cash', 'Blu', 'Blu Pocket', 'Bank Jateng', 'Seabank', 'Shopeepay', 'Gopay', 'Dana'];
        const validPayments: PaymentMethod[] = ['Cash', 'QRIS', 'Transfer', 'E-Wallet', 'Virtual Account'];
        const validPurposes: Purpose[] = ['Need', 'Want', 'Investment'];

        const type: TransactionType = validTypes.includes(rawType) ? rawType : 'Expense';
        const category: Category = validCategories.includes(rawCat) ? rawCat : 'Other';
        const account: AccountName = validAccounts.includes(rawAcc) ? rawAcc : 'Blu';
        const paymentMethod: PaymentMethod = validPayments.includes(rawPay) ? rawPay : 'QRIS';
        const purpose: Purpose = validPurposes.includes(rawPurp) ? rawPurp : 'Need';

        let isValid = true;
        let errorMsg = '';

        if (!rawDesc) {
          isValid = false;
          errorMsg = 'Missing description';
        } else if (rawAmt <= 0) {
          isValid = false;
          errorMsg = 'Amount must be greater than 0';
        }

        rows.push({
          date: formattedDate,
          description: rawDesc,
          type,
          category,
          account,
          toAccount: rawToAcc,
          paymentMethod,
          amount: rawAmt,
          purpose,
          event: rawEvt,
          notes: rawNote,
          isValid,
          errorMsg,
        });
      }

      setParsedRows(rows);
    } catch (e: unknown) {
      console.error(e);
      setError('Error parsing CSV file: ' + ((e as Error).message || 'Invalid format'));
      setParsedRows([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      parseCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setError('No valid rows found to import.');
      return;
    }

    const txsToImport = validRows.map(r => ({
      date: r.date,
      description: r.description,
      type: r.type,
      category: r.category,
      account: r.account,
      toAccount: r.toAccount,
      paymentMethod: r.paymentMethod,
      amount: r.amount,
      purpose: r.purpose,
      event: r.event,
      notes: r.notes,
      context: 'CSV Import',
    }));

    onImport(txsToImport);
    onClose();
  };

  const validCount = parsedRows.filter(r => r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
        isDark 
          ? 'bg-[#111116] border-[#1F1F24] text-[#E0E0E6]' 
          : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-[#1F1F24] bg-[#0A0A0C]' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#FF7043]/10 text-[#FF7043] border border-[#FF7043]/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-inherit">Import Transactions from CSV</h3>
              <p className="text-xs text-[#666670]">Batch-load financial entries into Sasha’s Transactions ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#666670] hover:text-inherit hover:bg-slate-500/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Format Instructions Banner */}
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#16161D] border-[#2D2D35]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 font-semibold text-inherit">
                <HelpCircle className="w-4 h-4 text-[#FF7043]" />
                <span>CSV Formatting & Column Mapping Guide</span>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#FF7043] text-white hover:bg-[#F4511E] transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample Template (.csv)</span>
              </button>
            </div>
            <p className="text-[#666670] leading-relaxed mb-3">
              Your CSV file should have a header row with column names. The system auto-detects English and Indonesian column titles. 
              Drop down values match the official <strong>Lists</strong> master lookup sheet.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#111116] border-[#1F1F24]' : 'bg-white border-slate-200'}`}>
                <span className="font-semibold text-[#FF7043]">Date</span>
                <p className="text-[#666670]">YYYY-MM-DD or DD/MM/YYYY</p>
              </div>
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#111116] border-[#1F1F24]' : 'bg-white border-slate-200'}`}>
                <span className="font-semibold text-[#FF7043]">Type</span>
                <p className="text-[#666670]">Income, Expense, Transfer</p>
              </div>
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#111116] border-[#1F1F24]' : 'bg-white border-slate-200'}`}>
                <span className="font-semibold text-[#FF7043]">Amount</span>
                <p className="text-[#666670]">Raw number (e.g. 25000)</p>
              </div>
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#111116] border-[#1F1F24]' : 'bg-white border-slate-200'}`}>
                <span className="font-semibold text-[#FF7043]">Account</span>
                <p className="text-[#666670]">Blu, Cash, Seabank, Gopay...</p>
              </div>
            </div>
          </div>

          {/* File Upload Zone */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,text/csv"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDark 
                  ? 'border-[#2D2D35] hover:border-[#FF7043] bg-[#16161D]/50 hover:bg-[#16161D]' 
                  : 'border-slate-300 hover:border-[#FF7043] bg-slate-50 hover:bg-slate-100/50'
              }`}
            >
              <UploadCloud className="w-8 h-8 text-[#FF7043] mx-auto mb-2" />
              <p className="font-semibold text-inherit text-sm">Click to select or drop your CSV file here</p>
              <p className="text-[#666670] text-xs mt-1">Supports UTF-8 comma or semicolon delimited (.csv)</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-[#F44336]/10 border border-[#F44336]/30 text-[#F44336]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-inherit">
                  Data Preview: {validCount} of {parsedRows.length} rows valid
                </span>
                <span className="text-[11px] text-[#666670]">
                  {parsedRows.length - validCount > 0 && `${parsedRows.length - validCount} row(s) contain errors and will be skipped`}
                </span>
              </div>

              <div className={`overflow-x-auto rounded-xl border max-h-60 ${
                isDark ? 'border-[#1F1F24]' : 'border-slate-200'
              }`}>
                <table className="w-full text-left text-xs">
                  <thead className={`sticky top-0 ${isDark ? 'bg-[#16161D] text-[#666670]' : 'bg-slate-100 text-slate-600'} font-semibold`}>
                    <tr>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Account</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F24]/30">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? '' : 'bg-rose-500/10'}>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center text-[#4CAF50]"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Valid</span>
                          ) : (
                            <span className="inline-flex items-center text-[#F44336]"><AlertCircle className="w-3.5 h-3.5 mr-1" /> {row.errorMsg}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono">{row.date}</td>
                        <td className="py-2 px-3 font-medium">{row.description}</td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-500/10 font-medium">
                            {row.type}
                          </span>
                        </td>
                        <td className="py-2 px-3">{row.category}</td>
                        <td className="py-2 px-3">{row.account}</td>
                        <td className="py-2 px-3 font-mono font-semibold">{formatIDR(row.amount)}</td>
                        <td className="py-2 px-3">{row.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-between px-6 py-4 border-t ${
          isDark ? 'border-[#1F1F24] bg-[#0A0A0C]' : 'border-slate-100 bg-slate-50'
        }`}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-[#666670] hover:text-inherit hover:bg-slate-500/10 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleApplyImport}
            disabled={validCount === 0}
            className="flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-[#FF7043] text-white hover:bg-[#F4511E] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            <span>Import {validCount} Transactions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
