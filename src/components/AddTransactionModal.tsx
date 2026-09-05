import React, { useState, useEffect } from 'react';
import { Transaction, ListsConfig, ThemeMode } from '../types';
import { getThemeTokens } from '../theme';
import { Language, t, formatControlledValue } from '../i18n';
import { X, Plus, Edit2 } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'income' | 'expense'>) => void;
  onEditTransaction?: (tx: Transaction) => void;
  initialTransaction?: Transaction | null;
  listsConfig: ListsConfig;
  theme?: ThemeMode;
  lang?: Language;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  onEditTransaction,
  initialTransaction,
  listsConfig,
  theme = 'dark',
  lang = 'id',
}) => {
  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;
  const isEditMode = !!initialTransaction;

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>('Expense');
  const [category, setCategory] = useState<string>(listsConfig.categories[0] || 'Food');
  const [account, setAccount] = useState<string>(listsConfig.accounts[0]?.name || 'Blu');
  const [toAccount, setToAccount] = useState<string>(listsConfig.accounts[1]?.name || 'Gopay');
  const [paymentMethod, setPaymentMethod] = useState<string>(listsConfig.paymentMethods[0] || 'QRIS');
  const [amount, setAmount] = useState<string>('25000');
  const [purpose, setPurpose] = useState<string>(listsConfig.purposes[0] || 'Need');
  const [event, setEvent] = useState<string>(listsConfig.events[0] || 'Personal');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialTransaction) {
      setDate(initialTransaction.date);
      setDescription(initialTransaction.description);
      setType(initialTransaction.type);
      setCategory(initialTransaction.category);
      setAccount(initialTransaction.account);
      setToAccount(initialTransaction.toAccount || listsConfig.accounts[1]?.name || 'Gopay');
      setPaymentMethod(initialTransaction.paymentMethod);
      setAmount(initialTransaction.amount.toString());
      setPurpose(initialTransaction.purpose);
      setEvent(initialTransaction.event);
      setNotes(initialTransaction.notes || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setType('Expense');
      setCategory(listsConfig.categories[0] || 'Food');
      setAccount(listsConfig.accounts[0]?.name || 'Blu');
      setToAccount(listsConfig.accounts[1]?.name || 'Gopay');
      setPaymentMethod(listsConfig.paymentMethods[0] || 'QRIS');
      setAmount('25000');
      setPurpose(listsConfig.purposes[0] || 'Need');
      setEvent(listsConfig.events[0] || 'Personal');
      setNotes('');
    }
  }, [initialTransaction, isOpen, listsConfig]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (isEditMode && initialTransaction && onEditTransaction) {
      onEditTransaction({
        ...initialTransaction,
        date,
        description: description.trim(),
        type,
        category,
        account,
        toAccount: type === 'Transfer' ? toAccount : undefined,
        paymentMethod,
        amount: parsedAmount,
        income: type === 'Income' ? parsedAmount : 0,
        expense: type === 'Expense' ? parsedAmount : 0,
        context: type === 'Transfer' ? `To: ${toAccount}` : (purpose ? `${purpose} expense` : ''),
        purpose,
        event,
        notes: notes.trim(),
      });
    } else {
      onAddTransaction({
        date,
        description: description.trim(),
        type,
        category,
        account,
        toAccount: type === 'Transfer' ? toAccount : undefined,
        paymentMethod,
        amount: parsedAmount,
        context: type === 'Transfer' ? `To: ${toAccount}` : (purpose ? `${purpose} expense` : ''),
        purpose,
        event,
        notes: notes.trim(),
      });
    }

    onClose();
  };

  const cardBg = tokens.cardBg;
  const inputBg = tokens.inputBg;
  const labelColor = tokens.labelColor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className={`w-full max-w-xl rounded-2xl border shadow-xl p-6 ${cardBg} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between pb-4 border-b border-inherit">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 font-medium">
              {isEditMode ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold font-heading">
                {isEditMode 
                  ? (lang === 'id' ? 'Edit Transaksi' : 'Edit Transaction') 
                  : (lang === 'id' ? 'Catat Transaksi Baru' : 'Record New Transaction')}
              </h2>
              <p className={`text-xs ${labelColor}`}>
                {lang === 'id' ? 'Tersimpan langsung ke Google Sheets permanen Anda' : 'Writes directly to your permanent Google Spreadsheet'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 ${labelColor}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>{t('date', lang)}</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>{t('amount', lang)} (IDR)</label>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>{t('description', lang)}</label>
            <input
              type="text"
              required
              placeholder={lang === 'id' ? 'cth: Makan siang bareng teman, Kursus, Gaji...' : 'e.g. Lunch with friends, Course payment, Salary...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>{t('type', lang)}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
              >
                {listsConfig.types.map((tVal) => (
                  <option key={tVal} value={tVal}>{formatControlledValue('type', tVal, lang)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>{t('category', lang)}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
              >
                {listsConfig.categories.map((c) => (
                  <option key={c} value={c}>{formatControlledValue('category', c, lang)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>
                {type === 'Transfer' ? (lang === 'id' ? 'Dari Akun' : 'From Account') : t('account', lang)}
              </label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
              >
                {listsConfig.accounts.map((a) => (
                  <option key={a.name} value={a.name}>{a.name} ({a.type})</option>
                ))}
              </select>
            </div>

            {type === 'Transfer' ? (
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>
                  {lang === 'id' ? 'Ke Akun Tujuan' : 'To Destination Account'}
                </label>
                <select
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
                >
                  {listsConfig.accounts
                    .filter((a) => a.name !== account)
                    .map((a) => (
                      <option key={a.name} value={a.name}>{a.name} ({a.type})</option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>{t('paymentMethod', lang)}</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
                >
                  {listsConfig.paymentMethods.map((pm) => (
                    <option key={pm} value={pm}>{formatControlledValue('paymentMethod', pm, lang)}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>{t('purpose', lang)}</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
              >
                {listsConfig.purposes.map((p) => (
                  <option key={p} value={p}>{formatControlledValue('purpose', p, lang)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>{t('event', lang)}</label>
              <select
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
              >
                {listsConfig.events.map((ev) => (
                  <option key={ev} value={ev}>{formatControlledValue('event', ev, lang)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${labelColor}`}>
              {t('notes', lang)} ({lang === 'id' ? 'Opsional' : 'Optional'})
            </label>
            <input
              type="text"
              placeholder={lang === 'id' ? 'cth: Split bill teman, promo diskon...' : 'e.g. Split bill with friends, promo discount applied...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-inherit">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 ${labelColor}`}
            >
              {t('cancel', lang)}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-black transition-colors cursor-pointer shadow-xs"
            >
              {isEditMode 
                ? (lang === 'id' ? 'Perbarui di Google Sheets' : 'Update in Google Sheet') 
                : (lang === 'id' ? 'Simpan ke Google Sheets' : 'Save to Google Sheet')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
