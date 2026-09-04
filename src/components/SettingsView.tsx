import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { ListsConfig, ThemeMode, AccountInfo, GoogleConnectionState } from '../types';
import { formatIDR } from '../excelGenerator';
import { 
  Sun, 
  Moon, 
  Tag, 
  Landmark, 
  Layers, 
  FileSpreadsheet, 
  Download, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles,
  Info,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Unlink,
  Lock,
  AlertTriangle,
  Link2
} from 'lucide-react';

interface SettingsViewProps {
  theme: ThemeMode;
  onToggleTheme: (newTheme: ThemeMode) => void;
  listsConfig: ListsConfig;
  onUpdateListsConfig: (newConfig: ListsConfig) => void;
  onExportExcel: () => void;
  onResetData: () => void;
  
  // Google Sheets Bidirectional Sync Props
  connectionState: GoogleConnectionState;
  spreadsheetTitle?: string;
  googleUser: User | null;
  lastSynced: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  isSyncing: boolean;
  syncError: string | null;
  onCreatePermanentSheet: () => Promise<void>;
  onConnectGoogleSheets: () => Promise<void>;
  onRefreshSync: () => Promise<void>;
  onDisconnectGoogleSheets: () => void;
  onPushAllToGoogleSheets?: () => Promise<void>;
  onLinkSpreadsheetId: (idOrUrl: string) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onToggleTheme,
  listsConfig,
  onUpdateListsConfig,
  onExportExcel,
  onResetData,
  connectionState,
  spreadsheetTitle = 'Sasha Finance',
  googleUser,
  lastSynced,
  spreadsheetId,
  spreadsheetUrl,
  isSyncing,
  syncError,
  onCreatePermanentSheet,
  onConnectGoogleSheets,
  onRefreshSync,
  onDisconnectGoogleSheets,
  onPushAllToGoogleSheets,
  onLinkSpreadsheetId,
}) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'appearance' | 'categories' | 'accounts' | 'lists' | 'sync'>('sync');

  // Category addition state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySuccess, setCategorySuccess] = useState('');

  // Account addition state
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'Cash' | 'Bank' | 'E-Wallet'>('Bank');
  const [newAccountOpening, setNewAccountOpening] = useState('0');

  // New Event tag state
  const [newEventName, setNewEventName] = useState('');

  // Link existing spreadsheet input state
  const [inputSpreadsheetUrl, setInputSpreadsheetUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);

  const cardBg = isDark ? 'bg-[#252525] border-[#373737] text-[#EBEBEB]' : 'bg-[#FFFFFF] border-[#E9E9E7] text-[#37352F]';
  const cardAlt = isDark ? 'bg-[#202020] border-[#373737]' : 'bg-[#FBFBFA] border-[#E9E9E7]';
  const labelColor = isDark ? 'text-[#9B9A97]' : 'text-[#787774]';
  const inputBg = isDark ? 'bg-[#191919] border-[#373737] text-[#EBEBEB]' : 'bg-[#FBFBFA] border-[#E9E9E7] text-[#37352F]';

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name || listsConfig.categories.includes(name)) return;

    const updated = {
      ...listsConfig,
      categories: [...listsConfig.categories, name],
    };
    onUpdateListsConfig(updated);
    setNewCategoryName('');
    setCategorySuccess(`Added "${name}"`);
    setTimeout(() => setCategorySuccess(''), 3000);
  };

  const handleRemoveCategory = (catToRemove: string) => {
    if (listsConfig.categories.length <= 1) return;
    const updated = {
      ...listsConfig,
      categories: listsConfig.categories.filter((c) => c !== catToRemove),
    };
    onUpdateListsConfig(updated);
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newAccountName.trim();
    if (!name || listsConfig.accounts.some((a) => a.name === name)) return;

    const opening = parseFloat(newAccountOpening) || 0;
    const newAcc: AccountInfo = {
      name,
      type: newAccountType,
      openingBalance: opening,
      balance: opening,
    };

    const updated = {
      ...listsConfig,
      accounts: [...listsConfig.accounts, newAcc],
    };
    onUpdateListsConfig(updated);
    setNewAccountName('');
    setNewAccountOpening('0');
  };

  const handleRemoveAccount = (accNameToRemove: string) => {
    if (listsConfig.accounts.length <= 1) return;
    const updated = {
      ...listsConfig,
      accounts: listsConfig.accounts.filter((a) => a.name !== accNameToRemove),
    };
    onUpdateListsConfig(updated);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newEventName.trim();
    if (!name || listsConfig.events.includes(name)) return;

    const updated = {
      ...listsConfig,
      events: [...listsConfig.events, name],
    };
    onUpdateListsConfig(updated);
    setNewEventName('');
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSpreadsheetUrl.trim()) return;
    setLinkLoading(true);
    try {
      await onLinkSpreadsheetId(inputSpreadsheetUrl.trim());
      setInputSpreadsheetUrl('');
      setShowLinkInput(false);
    } finally {
      setLinkLoading(false);
    }
  };

  const handleConfirmPush = async () => {
    if (!onPushAllToGoogleSheets) return;
    const confirmed = window.confirm(
      'Push all current dashboard records, formulas, and dropdown categories to your Google Spreadsheet? This will update the sheets with the latest dashboard dataset.'
    );
    if (confirmed) {
      await onPushAllToGoogleSheets();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold font-heading">Settings & Customization</h1>
        <p className={`text-xs mt-1 ${labelColor}`}>
          Configure workspace theme, customize dropdown categories and accounts, and manage your permanent Google Sheet database.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-inherit">
        {[
          { id: 'sync', label: 'Google Sheets Database', icon: FileSpreadsheet },
          { id: 'appearance', label: 'Theme & Styling', icon: Sun },
          { id: 'categories', label: 'Editable Categories', icon: Tag },
          { id: 'accounts', label: 'Manage Accounts', icon: Landmark },
          { id: 'lists', label: 'Dropdown Lists', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                isActive
                  ? 'bg-amber-500 text-black font-semibold shadow-xs'
                  : `${cardAlt} ${labelColor} hover:text-inherit`
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Google Sheets Database (Primary Mechanism) */}
      {activeTab === 'sync' && (
        <div className="space-y-6 max-w-3xl">
          {/* Main Google Sheets Sync Card */}
          <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-inherit">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold font-heading">Google Sheets Database</h3>
                  <p className={`text-xs ${labelColor}`}>
                    Permanent single source of truth for all financial transactions and balances
                  </p>
                </div>
              </div>

              {/* Dynamic Status Badge */}
              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <span className="text-xs text-[#787774] dark:text-[#9B9A97]">Status:</span>
                {connectionState === 'connected' && (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Connected</span>
                  </span>
                )}
                {connectionState === 'not_connected' && (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/30">
                    <span className="w-2 h-2 rounded-full bg-zinc-400" />
                    <span>Not Connected</span>
                  </span>
                )}
                {connectionState === 'auth_required' && (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <Lock className="w-3 h-3 text-amber-500" />
                    <span>Authentication Required</span>
                  </span>
                )}
                {connectionState === 'permission_denied' && (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    <span>Permission Denied</span>
                  </span>
                )}
                {connectionState === 'unavailable' && (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                    <AlertCircle className="w-3 h-3 text-orange-500" />
                    <span>Spreadsheet Unavailable</span>
                  </span>
                )}
              </div>
            </div>

            {/* Architecture Statement */}
            <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="text-inherit font-semibold">Single Permanent Spreadsheet:</strong>{' '}
                <span className={labelColor}>
                  The dashboard reads and writes directly to one designated Google Spreadsheet in your Google Drive. Manual Excel upload/download is not required.
                </span>
              </div>
            </div>

            {/* Sync Error Alert */}
            {syncError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Sync Notice:</p>
                  <p className="mt-0.5">{syncError}</p>
                </div>
              </div>
            )}

            {/* ===================== STATE 1: CONNECTED ===================== */}
            {connectionState === 'connected' && (
              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-xl border border-inherit bg-black/5 dark:bg-white/5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <div>
                      <span className={labelColor}>Spreadsheet: </span>
                      <strong className="text-inherit font-semibold text-sm">
                        {spreadsheetTitle}
                      </strong>
                    </div>
                    <div>
                      <span className={labelColor}>Last synced: </span>
                      <span className="font-medium text-inherit">
                        {lastSynced ? lastSynced : 'Just now'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-inherit/40 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <div className="flex items-center space-x-2 truncate">
                      <span className={labelColor}>Account:</span>
                      <span className="font-medium text-inherit truncate">
                        {googleUser?.email || 'Google Account Connected'}
                      </span>
                    </div>
                    {spreadsheetUrl && (
                      <a
                        href={spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium shrink-0"
                      >
                        <span>Open Google Sheet</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Connected Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onRefreshSync}
                    disabled={isSyncing}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Refreshing...' : 'Refresh Sync'}</span>
                  </button>

                  {spreadsheetUrl && (
                    <a
                      href={spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Google Sheets</span>
                    </a>
                  )}

                  {onPushAllToGoogleSheets && (
                    <button
                      type="button"
                      onClick={handleConfirmPush}
                      disabled={isSyncing}
                      className={`inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${cardAlt} hover:text-inherit disabled:opacity-50`}
                      title="Sync all 8 sheets in Google Sheets with current dashboard"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Push All to Sheet</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onDisconnectGoogleSheets}
                    className="ml-auto inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-medium cursor-pointer transition-colors"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            )}

            {/* ===================== STATE 2: NOT CONNECTED ===================== */}
            {connectionState === 'not_connected' && (
              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-xl border border-inherit bg-black/5 dark:bg-white/5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-1 text-inherit">
                    Initial Setup Required
                  </h4>
                  <p className={`text-xs ${labelColor}`}>
                    To enable automatic cloud sync, connect a permanent Google Spreadsheet. You can either create a new "Sasha Finance" spreadsheet in your Google Drive or link an existing one.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onCreatePermanentSheet}
                    disabled={isSyncing}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-all shadow-xs disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Create "Sasha Finance" Sheet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLinkInput(!showLinkInput)}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${cardAlt} hover:text-inherit flex items-center space-x-1.5`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>{showLinkInput ? 'Cancel' : 'Link Existing Google Sheet'}</span>
                  </button>
                </div>

                {showLinkInput && (
                  <form onSubmit={handleLinkSubmit} className="mt-4 p-4 rounded-xl border border-inherit bg-black/5 dark:bg-white/5 space-y-3">
                    <label className="block text-xs font-medium">
                      Enter Existing Google Spreadsheet URL or ID:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="https://docs.google.com/spreadsheets/d/... or spreadsheetId"
                        value={inputSpreadsheetUrl}
                        onChange={(e) => setInputSpreadsheetUrl(e.target.value)}
                        className={`flex-1 px-3 py-2 rounded-xl border text-xs ${inputBg}`}
                      />
                      <button
                        type="submit"
                        disabled={linkLoading}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                      >
                        {linkLoading ? 'Verifying...' : 'Link Sheet'}
                      </button>
                    </div>
                    <p className={`text-[11px] ${labelColor}`}>
                      The dashboard will verify permissions and initialize the 8 financial sheets if they do not yet exist.
                    </p>
                  </form>
                )}
              </div>
            )}

            {/* ===================== STATE 3: AUTH REQUIRED ===================== */}
            {connectionState === 'auth_required' && (
              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs space-y-2">
                  <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-semibold">
                    <Lock className="w-4 h-4" />
                    <span>Google Authorization Needed</span>
                  </div>
                  <p className={labelColor}>
                    Your Google session has expired or requires sign-in to read and write to your permanent spreadsheet (ID: <code className="font-mono text-[11px]">{spreadsheetId}</code>).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onConnectGoogleSheets}
                    disabled={isSyncing}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-all shadow-xs disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Sign in with Google to Connect</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLinkInput(!showLinkInput)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${cardAlt} hover:text-inherit`}
                  >
                    {showLinkInput ? 'Cancel' : 'Change Spreadsheet ID'}
                  </button>
                </div>

                {showLinkInput && (
                  <form onSubmit={handleLinkSubmit} className="p-4 rounded-xl border border-inherit bg-black/5 dark:bg-white/5 space-y-3">
                    <label className="block text-xs font-medium">New Spreadsheet URL or ID:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        value={inputSpreadsheetUrl}
                        onChange={(e) => setInputSpreadsheetUrl(e.target.value)}
                        className={`flex-1 px-3 py-2 rounded-xl border text-xs ${inputBg}`}
                      />
                      <button
                        type="submit"
                        disabled={linkLoading}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded-xl"
                      >
                        {linkLoading ? 'Saving...' : 'Update ID'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ===================== STATE 4: PERMISSION DENIED ===================== */}
            {connectionState === 'permission_denied' && (
              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs space-y-2">
                  <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Google Sheets Permission Denied (403)</span>
                  </div>
                  <p className={labelColor}>
                    Google returned HTTP 403 Forbidden. The signed-in account ({googleUser?.email || 'current account'}) does not have Edit permissions for spreadsheet ID <code className="font-mono text-[11px]">{spreadsheetId}</code>, or Google Sheets API is not enabled in the Cloud Console.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onConnectGoogleSheets}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer"
                  >
                    <span>Sign In with Different Google Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLinkInput(true)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-medium ${cardAlt}`}
                  >
                    <span>Change Spreadsheet ID</span>
                  </button>

                  <button
                    type="button"
                    onClick={onDisconnectGoogleSheets}
                    className="ml-auto px-3 py-2 rounded-xl border border-rose-500/30 text-rose-500 text-xs hover:bg-rose-500/10"
                  >
                    Disconnect
                  </button>
                </div>

                {showLinkInput && (
                  <form onSubmit={handleLinkSubmit} className="p-4 rounded-xl border border-inherit bg-black/5 dark:bg-white/5 space-y-3">
                    <label className="block text-xs font-medium">New Spreadsheet URL or ID:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        value={inputSpreadsheetUrl}
                        onChange={(e) => setInputSpreadsheetUrl(e.target.value)}
                        className={`flex-1 px-3 py-2 rounded-xl border text-xs ${inputBg}`}
                      />
                      <button
                        type="submit"
                        disabled={linkLoading}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded-xl"
                      >
                        {linkLoading ? 'Saving...' : 'Update ID'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ===================== STATE 5: SPREADSHEET UNAVAILABLE ===================== */}
            {connectionState === 'unavailable' && (
              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 text-xs space-y-2">
                  <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400 font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    <span>Spreadsheet Unavailable (404 Not Found)</span>
                  </div>
                  <p className={labelColor}>
                    The Google Spreadsheet with ID <code className="font-mono text-[11px]">{spreadsheetId}</code> could not be found or has been deleted.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onCreatePermanentSheet}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Create New "Sasha Finance" Sheet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLinkInput(true)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-medium ${cardAlt}`}
                  >
                    <span>Link Different Sheet</span>
                  </button>

                  <button
                    type="button"
                    onClick={onDisconnectGoogleSheets}
                    className="ml-auto px-3 py-2 rounded-xl border border-rose-500/30 text-rose-500 text-xs hover:bg-rose-500/10"
                  >
                    Disconnect
                  </button>
                </div>

                {showLinkInput && (
                  <form onSubmit={handleLinkSubmit} className="p-4 rounded-xl border border-inherit bg-black/5 dark:bg-white/5 space-y-3">
                    <label className="block text-xs font-medium">New Spreadsheet URL or ID:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        value={inputSpreadsheetUrl}
                        onChange={(e) => setInputSpreadsheetUrl(e.target.value)}
                        className={`flex-1 px-3 py-2 rounded-xl border text-xs ${inputBg}`}
                      />
                      <button
                        type="submit"
                        disabled={linkLoading}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded-xl"
                      >
                        {linkLoading ? 'Saving...' : 'Link Sheet'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Secondary Optional Feature: Download Excel (.xlsx) Backup */}
          <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
            <div className="flex items-center space-x-2.5 mb-2">
              <Download className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-base font-heading">Download Excel Backup (.xlsx)</h3>
            </div>
            <p className={`text-xs ${labelColor} mb-4 leading-relaxed`}>
              Optional offline backup file. Generates a standalone copy with all 8 sheets and formulas. Manual file uploading is not required for daily sync.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onExportExcel}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Backup (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className={`p-5 rounded-2xl border ${cardBg}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-rose-500">Reset Local Demo Data</span>
                <p className={`text-[11px] ${labelColor} mt-0.5`}>Reverts local data back to initial template numbers</p>
              </div>
              <button
                type="button"
                onClick={onResetData}
                className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Appearance / Theme */}
      {activeTab === 'appearance' && (
        <div className="space-y-6 max-w-2xl">
          <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
            <h3 className="text-base font-semibold font-heading mb-1">Theme Mode</h3>
            <p className={`text-xs mb-5 ${labelColor}`}>
              Choose between Notion-inspired Light Mode and editorial Dark Mode.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Light Mode Card */}
              <div
                onClick={() => onToggleTheme('light')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  theme === 'light'
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-white text-[#37352F]'
                    : 'border-[#E9E9E7] bg-[#F7F6F3] text-[#787774] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-sm">Light Mode</span>
                  </div>
                  {theme === 'light' && <Check className="w-4 h-4 text-amber-500" />}
                </div>
                <p className="text-xs text-[#787774]">
                  Warm off-white (#F7F6F3) background, crisp white cards, dark charcoal text, and subtle dividers.
                </p>
              </div>

              {/* Dark Mode Card */}
              <div
                onClick={() => onToggleTheme('dark')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  theme === 'dark'
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-[#252525] text-[#EBEBEB]'
                    : 'border-[#373737] bg-[#191919] text-[#9B9A97] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Moon className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-sm">Dark Mode</span>
                  </div>
                  {theme === 'dark' && <Check className="w-4 h-4 text-amber-500" />}
                </div>
                <p className="text-xs text-[#9B9A97]">
                  Dark charcoal (#191919) background, refined charcoal cards, off-white text, and calm minimal contrast.
                </p>
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border ${cardBg}`}>
            <h4 className="text-sm font-semibold font-heading mb-1 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Typography Pairing</span>
            </h4>
            <p className={`text-xs ${labelColor}`}>
              The interface utilizes <strong>Inter</strong> for clean, high-legibility body numbers and labels, paired with <strong>Poppins</strong> for headings, creating an editorial Notion workspace feel.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-6 max-w-3xl">
          <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div>
                <h3 className="text-base font-semibold font-heading">Custom Categories</h3>
                <p className={`text-xs ${labelColor}`}>
                  Categories added here immediately populate transaction dropdowns and the spreadsheet Lists tab.
                </p>
              </div>
              <span className="text-xs text-amber-500 font-medium">{listsConfig.categories.length} Total</span>
            </div>

            {categorySuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{categorySuccess}</span>
              </div>
            )}

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="mt-4 flex gap-3">
              <input
                type="text"
                required
                placeholder="Enter new category name (e.g. Pets, Donations, Subscriptions)..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className={`flex-1 px-3.5 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </form>

            {/* Categories List */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {listsConfig.categories.map((cat) => (
                <div
                  key={cat}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium ${cardAlt}`}
                >
                  <span className="truncate">{cat}</span>
                  {listsConfig.categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat)}
                      className={`ml-2 p-1 rounded hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer ${labelColor}`}
                      title="Remove category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Accounts */}
      {activeTab === 'accounts' && (
        <div className="space-y-6 max-w-3xl">
          <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div>
                <h3 className="text-base font-semibold font-heading">Custom Accounts</h3>
                <p className={`text-xs ${labelColor}`}>
                  Accounts configured here synchronize to the Accounts tab and transaction dropdowns.
                </p>
              </div>
              <span className="text-xs text-amber-500 font-medium">{listsConfig.accounts.length} Active</span>
            </div>

            {/* Add Account Form */}
            <form onSubmit={handleAddAccount} className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                required
                placeholder="Account Name (e.g. Mandiri, ShopeePay)..."
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                className={`sm:col-span-2 px-3.5 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputBg}`}
              />
              <select
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value as any)}
                className={`px-3 py-2 rounded-xl border text-xs font-medium ${inputBg}`}
              >
                <option value="Bank">Bank</option>
                <option value="Cash">Cash</option>
                <option value="E-Wallet">E-Wallet</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Account</span>
              </button>
            </form>

            {/* Accounts List */}
            <div className="mt-5 space-y-2">
              {listsConfig.accounts.map((acc) => (
                <div
                  key={acc.name}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border ${cardAlt}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
                      {acc.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold">{acc.name}</h4>
                      <span className={`text-[11px] ${labelColor}`}>{acc.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="text-xs font-semibold">{formatIDR(acc.openingBalance)}</span>
                      <p className={`text-[10px] ${labelColor}`}>Opening Balance</p>
                    </div>
                    {listsConfig.accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAccount(acc.name)}
                        className={`p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer ${labelColor}`}
                        title="Delete account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Dropdown Lists & Event Tags */}
      {activeTab === 'lists' && (
        <div className="space-y-6 max-w-3xl">
          <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
            <h3 className="text-base font-semibold font-heading mb-1">Dropdown Validation Source</h3>
            <p className={`text-xs ${labelColor} mb-4`}>
              These values populate data validation dropdowns in the spreadsheet Lists sheet and dashboard forms.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${cardAlt}`}>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2">Transaction Types</h4>
                <div className="flex flex-wrap gap-1.5">
                  {listsConfig.types.map((t) => (
                    <span key={t} className="px-2 py-1 rounded-md text-xs border border-inherit font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${cardAlt}`}>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2">Payment Methods</h4>
                <div className="flex flex-wrap gap-1.5">
                  {listsConfig.paymentMethods.map((pm) => (
                    <span key={pm} className="px-2 py-1 rounded-md text-xs border border-inherit font-medium">
                      {pm}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${cardAlt}`}>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2">Purposes</h4>
                <div className="flex flex-wrap gap-1.5">
                  {listsConfig.purposes.map((p) => (
                    <span key={p} className="px-2 py-1 rounded-md text-xs border border-inherit font-medium">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${cardAlt}`}>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2">Event Tags</h4>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {listsConfig.events.map((ev) => (
                    <span key={ev} className="px-2 py-1 rounded-md text-xs border border-inherit font-medium">
                      {ev}
                    </span>
                  ))}
                </div>
                <form onSubmit={handleAddEvent} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add event tag..."
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    className={`flex-1 px-2.5 py-1 text-xs rounded-lg border ${inputBg}`}
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold rounded-lg"
                  >
                    + Tag
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
