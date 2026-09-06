import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  SAMPLE_TRANSACTIONS, 
  INITIAL_BUDGETS, 
  INITIAL_GOALS, 
  INITIAL_EMERGENCY_FUND,
  DEFAULT_LISTS_CONFIG,
  INITIAL_DEPOSITS
} from './data';
import { 
  Transaction, 
  AccountInfo, 
  SavingsGoal, 
  EmergencyFundData, 
  FilterState,
  ListsConfig,
  ThemeMode,
  GoogleConnectionState,
  Deposit
} from './types';
import { 
  generateSashasWorkbook, 
  downloadBlob, 
  parseExcelTransactions 
} from './excelGenerator';
import { 
  initAuth, 
  googleSignIn, 
  logout 
} from './auth';
import { 
  createPermanentGoogleSheet,
  fetchTransactionsFromGoogleSheet, 
  appendTransactionToGoogleSheet,
  updateTransactionInGoogleSheet,
  deleteTransactionFromGoogleSheet,
  writeTransactionsToGoogleSheet, 
  writeAllDataToGoogleSheet, 
  verifySpreadsheetAccess, 
  getSpreadsheetMetadata,
  extractSpreadsheetId, 
  GoogleSyncError,
  SPREADSHEET_ID_STORAGE_KEY, 
  LAST_SYNCED_STORAGE_KEY,
  fetchDepositsFromGoogleSheet,
  writeDepositsToGoogleSheet
} from './googleSheetsService';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { AccountsView } from './components/AccountsView';
import { DepositsView } from './components/DepositsView';
import { GoalsView } from './components/GoalsView';
import { SettingsView } from './components/SettingsView';
import { AuthGate } from './components/AuthGate';
import { AddTransactionModal } from './components/AddTransactionModal';
import { Language, t } from './i18n';
import { BannerConfig, loadBannerConfig, saveBannerConfig } from './banner';
import { 
  getStoredTheme, 
  setStoredTheme, 
  applyGlobalTheme, 
  getThemeTokens, 
  THEMES 
} from './theme';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Wallet, 
  Target, 
  Settings, 
  Download, 
  Sun, 
  Moon, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Plus, 
  FileSpreadsheet,
  AlertTriangle,
  Palette,
  Globe,
  Landmark
} from 'lucide-react';

type TabType = 'Dashboard' | 'Transactions' | 'Accounts' | 'Deposits' | 'Goals' | 'Settings';

function getTabFromUrl(): TabType {
  try {
    if (typeof window === 'undefined') return 'Dashboard';
    const hash = window.location.hash.toLowerCase().trim();
    if (hash.includes('transaction')) return 'Transactions';
    if (hash.includes('account')) return 'Accounts';
    if (hash.includes('deposit')) return 'Deposits';
    if (hash.includes('goal')) return 'Goals';
    if (hash.includes('setting')) return 'Settings';
    if (hash.includes('dashboard')) return 'Dashboard';

    const path = window.location.pathname.toLowerCase();
    if (path.includes('/transactions')) return 'Transactions';
    if (path.includes('/accounts')) return 'Accounts';
    if (path.includes('/deposits')) return 'Deposits';
    if (path.includes('/goals')) return 'Goals';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/dashboard')) return 'Dashboard';
  } catch {
    // Fallback
  }
  return 'Dashboard';
}

export default function App() {
  // Navigation: Exactly 5 views: Dashboard, Transactions, Accounts, Goals, Settings
  const [activeTab, setActiveTab] = useState<TabType>(() => getTabFromUrl());

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    const route = tab.toLowerCase();
    const targetHash = `#/${route}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  };

  useEffect(() => {
    const handleUrlChange = () => {
      const detected = getTabFromUrl();
      setActiveTab(detected);
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);

    if (!window.location.hash) {
      window.location.hash = '#/dashboard';
    }

    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Theme state
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());

  // Authentication State for app lock
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Dynamic Lists Configuration
  const [listsConfig, setListsConfig] = useState<ListsConfig>(() => {
    try {
      const saved = localStorage.getItem('sashas_lists_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        const safeAccounts = Array.isArray(parsed?.accounts)
          ? parsed.accounts.map((a: any) => {
              if (typeof a === 'string') {
                return { name: a, type: 'Bank' as const, openingBalance: 0, balance: 0 };
              }
              return {
                name: a?.name || 'Account',
                type: (a?.type || 'Bank') as any,
                openingBalance: typeof a?.openingBalance === 'number' ? a.openingBalance : 0,
                balance: typeof a?.balance === 'number' ? a.balance : 0,
              };
            })
          : DEFAULT_LISTS_CONFIG.accounts;

        return {
          types: Array.isArray(parsed?.types) ? parsed.types : DEFAULT_LISTS_CONFIG.types,
          categories: Array.isArray(parsed?.categories) ? parsed.categories : DEFAULT_LISTS_CONFIG.categories,
          accounts: safeAccounts,
          paymentMethods: Array.isArray(parsed?.paymentMethods) ? parsed.paymentMethods : DEFAULT_LISTS_CONFIG.paymentMethods,
          purposes: Array.isArray(parsed?.purposes) ? parsed.purposes : DEFAULT_LISTS_CONFIG.purposes,
          events: Array.isArray(parsed?.events) ? parsed.events : DEFAULT_LISTS_CONFIG.events,
        };
      }
      return DEFAULT_LISTS_CONFIG;
    } catch {
      return DEFAULT_LISTS_CONFIG;
    }
  });

  // Core Data state
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('sashas_transactions');
      return saved ? JSON.parse(saved) : SAMPLE_TRANSACTIONS;
    } catch {
      return SAMPLE_TRANSACTIONS;
    }
  });

  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('sashas_budgets');
      return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem('sashas_goals');
      return saved ? JSON.parse(saved) : INITIAL_GOALS;
    } catch {
      return INITIAL_GOALS;
    }
  });

  const [emergencyFund, setEmergencyFund] = useState<EmergencyFundData>(() => {
    try {
      const saved = localStorage.getItem('sashas_emergency');
      return saved ? JSON.parse(saved) : INITIAL_EMERGENCY_FUND;
    } catch {
      return INITIAL_EMERGENCY_FUND;
    }
  });

  // Dedicated Deposits State
  const [deposits, setDeposits] = useState<Deposit[]>(() => {
    try {
      const saved = localStorage.getItem('sashas_deposits');
      return saved ? JSON.parse(saved) : INITIAL_DEPOSITS;
    } catch {
      return INITIAL_DEPOSITS;
    }
  });

  // Google Sheets Cloud Sync State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SPREADSHEET_ID_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>('Sasha Finance');
  const [lastSynced, setLastSynced] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LAST_SYNCED_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Connection State: 'not_connected' | 'auth_required' | 'connected' | 'permission_denied' | 'unavailable'
  const [connectionState, setConnectionState] = useState<GoogleConnectionState>(() => {
    if (!spreadsheetId) return 'not_connected';
    return 'auth_required';
  });

  const spreadsheetUrl = spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : null;

  // Filter State for Dashboard
  const [filter, setFilter] = useState<FilterState>({
    semester: 'Semester 2 (2026)',
    period: 'Monthly',
    month: 'All',
    week: 'All',
    account: 'All',
    category: 'All',
    event: 'All',
  });

  // Language State (Bahasa Indonesia & English)
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('sashas_language');
      if (saved === 'en' || saved === 'id') return saved;
    } catch {}
    return 'id'; // default Bahasa Indonesia
  });

  const handleSelectLanguage = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem('sashas_language', newLang);
    } catch {}
    showToast(newLang === 'id' ? 'Bahasa diubah ke Bahasa Indonesia.' : 'Language switched to English.');
  };

  // Notion-style Dashboard Cover Banner State
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>(() => loadBannerConfig());

  const handleChangeBannerConfig = (newConfig: BannerConfig) => {
    setBannerConfig(newConfig);
    saveBannerConfig(newConfig);
  };

  // Settings initial tab tracker
  const [settingsInitialTab, setSettingsInitialTab] = useState<'appearance' | 'banner' | 'language' | 'categories' | 'accounts' | 'platforms' | 'lists' | 'sync'>('sync');

  // Quick Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const updateLastSyncedTime = () => {
    const now = new Date();
    const timeStr = `${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}, ${now.toLocaleDateString()}`;
    setLastSynced(timeStr);
    try {
      localStorage.setItem(LAST_SYNCED_STORAGE_KEY, timeStr);
    } catch {}
  };

  // Reconciled Live Accounts
  const liveAccounts: AccountInfo[] = (listsConfig?.accounts || []).map((acc) => {
    const accName = typeof acc === 'string' ? acc : acc?.name || 'Account';
    const accType = typeof acc === 'string' ? 'Bank' : acc?.type || 'Bank';
    let currentBalance = typeof acc?.openingBalance === 'number' ? acc.openingBalance : 0;

    (transactions || []).forEach((tx) => {
      if (tx.account === accName) {
        if (tx.type === 'Income') currentBalance += tx.amount;
        else if (tx.type === 'Expense') currentBalance -= tx.amount;
        else if (tx.type === 'Transfer') currentBalance -= tx.amount;
        else if (tx.type === 'Adjustment') currentBalance += tx.amount;
      }

      const destAccount = tx.toAccount || (tx.type === 'Transfer' && tx.context?.match(/To:\s*([^,\s]+)/i)?.[1]);
      if (tx.type === 'Transfer' && destAccount === accName) {
        currentBalance += tx.amount;
      }
    });

    return {
      name: accName,
      type: accType as any,
      openingBalance: typeof acc?.openingBalance === 'number' ? acc.openingBalance : 0,
      balance: currentBalance,
    };
  });

  // Verify access and perform initial pull if spreadsheetId exists
  const checkSpreadsheetConnection = useCallback(async (token: string, sheetId: string) => {
    try {
      setIsSyncing(true);
      const meta = await getSpreadsheetMetadata(token, sheetId);
      setSpreadsheetTitle(meta.title || 'Sasha Finance');
      setConnectionState('connected');
      setSyncError(null);

      // Pull latest transactions
      const fetched = await fetchTransactionsFromGoogleSheet(token, sheetId);
      if (fetched.length > 0) {
        setTransactions(fetched);
      }

      // Pull latest deposits
      const fetchedDeposits = await fetchDepositsFromGoogleSheet(token, sheetId);
      if (fetchedDeposits.length > 0) {
        setDeposits(fetchedDeposits);
      }
      updateLastSyncedTime();
    } catch (err: any) {
      console.warn('Initial spreadsheet check failed:', err);
      if (err instanceof GoogleSyncError) {
        if (err.type === 'AUTH_EXPIRED') setConnectionState('auth_required');
        else if (err.type === 'PERMISSION_DENIED') setConnectionState('permission_denied');
        else if (err.type === 'NOT_FOUND') setConnectionState('unavailable');
        setSyncError(err.message);
      } else {
        setSyncError(err.message || 'Failed to connect to Google Sheets');
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Listen to Google Auth session changes
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        if (spreadsheetId && token) {
          checkSpreadsheetConnection(token, spreadsheetId);
        } else if (!spreadsheetId) {
          setConnectionState('not_connected');
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        if (spreadsheetId) {
          setConnectionState('auth_required');
        } else {
          setConnectionState('not_connected');
        }
      }
    );
    return () => unsubscribe();
  }, [spreadsheetId, checkSpreadsheetConnection]);

  // Synchronize state changes to localStorage cache safely
  useEffect(() => {
    try {
      localStorage.setItem('sashas_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.warn('Could not save transactions to localStorage', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('sashas_lists_config', JSON.stringify(listsConfig));
    } catch (e) {
      console.warn('Could not save listsConfig to localStorage', e);
    }
  }, [listsConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('sashas_budgets', JSON.stringify(budgets));
    } catch (e) {
      console.warn('Could not save budgets to localStorage', e);
    }
  }, [budgets]);

  useEffect(() => {
    try {
      localStorage.setItem('sashas_goals', JSON.stringify(goals));
    } catch (e) {
      console.warn('Could not save goals to localStorage', e);
    }
  }, [goals]);

  useEffect(() => {
    try {
      localStorage.setItem('sashas_emergency', JSON.stringify(emergencyFund));
    } catch (e) {
      console.warn('Could not save emergencyFund to localStorage', e);
    }
  }, [emergencyFund]);

  useEffect(() => {
    try {
      localStorage.setItem('sashas_deposits', JSON.stringify(deposits));
    } catch (e) {
      console.warn('Could not save deposits to localStorage', e);
    }
  }, [deposits]);

  useEffect(() => {
    setStoredTheme(theme);
    applyGlobalTheme(theme);
  }, [theme]);

  const toggleTheme = (newTheme?: ThemeMode) => {
    if (newTheme) {
      setTheme(newTheme);
      return;
    }
    const themeCycle: ThemeMode[] = ['light', 'dark', 'cherry-blossom', 'spring', 'winter', 'berry', 'cloud'];
    const currentIndex = themeCycle.indexOf(theme);
    const nextTheme = themeCycle[(currentIndex + 1) % themeCycle.length];
    setTheme(nextTheme);
  };

  // Connect / Sign In with Google Sheets
  const handleConnectGoogleSheets = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await googleSignIn();
      if (!res) {
        setIsSyncing(false);
        return;
      }
      const { user, accessToken } = res;
      setGoogleUser(user);
      setGoogleToken(accessToken);

      // If user already has a spreadsheet ID saved, verify it
      if (spreadsheetId) {
        await checkSpreadsheetConnection(accessToken, spreadsheetId);
        showToast('Authenticated and reconnected to your permanent spreadsheet!');
      } else {
        // No spreadsheet linked yet
        setConnectionState('not_connected');
        showToast('Google account connected. Select or create your permanent spreadsheet.');
      }
    } catch (err: any) {
      console.error('Google Sheets sign-in error:', err);
      const msg = err.message || 'Failed to authenticate Google Sheets';
      setSyncError(msg);
      showToast(`Google Sheets error: ${msg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Create New Permanent Google Sheet
  const handleCreatePermanentSheet = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      let token = googleToken;
      if (!token) {
        const res = await googleSignIn();
        if (!res) {
          setIsSyncing(false);
          return;
        }
        token = res.accessToken;
        setGoogleUser(res.user);
        setGoogleToken(token);
      }

      showToast('Creating permanent "Sasha Finance" Google Sheet...');
      const created = await createPermanentGoogleSheet(token, 'Sasha Finance');
      const newId = created.spreadsheetId;

      setSpreadsheetId(newId);
      setSpreadsheetTitle('Sasha Finance');
      localStorage.setItem(SPREADSHEET_ID_STORAGE_KEY, newId);

      // Write initial datasets and formulas to the 9 sheets
      showToast('Initializing financial tabs, formulas, and dropdowns...');
      await writeAllDataToGoogleSheet(
        token,
        newId,
        transactions,
        liveAccounts,
        budgets,
        goals,
        emergencyFund,
        listsConfig,
        deposits
      );

      setConnectionState('connected');
      updateLastSyncedTime();
      showToast('Created permanent "Sasha Finance" Google Sheet successfully!');
    } catch (err: any) {
      console.error('Create permanent sheet error:', err);
      const msg = err.message || 'Failed to create permanent Google Sheet';
      setSyncError(msg);
      showToast(`Creation error: ${msg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Refresh Sync: Read updated transactions directly from Google Sheets
  const handleRefreshSync = async () => {
    let token = googleToken;
    let sheetId = spreadsheetId;

    if (!token || !sheetId) {
      await handleConnectGoogleSheets();
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    try {
      const fetched = await fetchTransactionsFromGoogleSheet(token, sheetId);
      if (fetched.length > 0) {
        setTransactions(fetched);
        showToast(`Retrieved ${fetched.length} transactions from Google Sheets!`);
      } else {
        showToast('Google Sheets accessed: 0 transactions found.');
      }

      const fetchedDeposits = await fetchDepositsFromGoogleSheet(token, sheetId);
      if (fetchedDeposits.length > 0) {
        setDeposits(fetchedDeposits);
      }
      setConnectionState('connected');
      updateLastSyncedTime();
    } catch (err: any) {
      console.error('Refresh sync error:', err);
      if (err instanceof GoogleSyncError) {
        if (err.type === 'AUTH_EXPIRED') {
          setConnectionState('auth_required');
          setSyncError('Google session expired. Please sign in again.');
        } else if (err.type === 'PERMISSION_DENIED') {
          setConnectionState('permission_denied');
          setSyncError('Permission denied (403). Make sure your account has edit permissions.');
        } else if (err.type === 'NOT_FOUND') {
          setConnectionState('unavailable');
          setSyncError('Spreadsheet not found (404). Please verify spreadsheet ID.');
        } else {
          setSyncError(err.message);
        }
      } else {
        setSyncError(err.message || 'Failed to fetch from Google Sheets');
      }
      showToast(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Link Existing Google Sheet ID / URL
  const handleLinkSpreadsheetId = async (idOrUrl: string) => {
    const cleanId = extractSpreadsheetId(idOrUrl);
    if (!cleanId) {
      showToast('Invalid Google Spreadsheet URL or ID.');
      return;
    }

    let token = googleToken;
    if (!token) {
      const res = await googleSignIn();
      if (!res) return;
      token = res.accessToken;
      setGoogleUser(res.user);
      setGoogleToken(token);
    }

    setIsSyncing(true);
    setSyncError(null);
    try {
      const meta = await getSpreadsheetMetadata(token, cleanId);
      setSpreadsheetId(cleanId);
      setSpreadsheetTitle(meta.title || 'Linked Google Sheet');
      localStorage.setItem(SPREADSHEET_ID_STORAGE_KEY, cleanId);

      // Attempt to load transactions from this sheet
      const fetched = await fetchTransactionsFromGoogleSheet(token, cleanId);
      if (fetched.length > 0) {
        setTransactions(fetched);
        showToast(`Linked "${meta.title}" and loaded ${fetched.length} transactions!`);
      } else {
        // Push initial data if empty
        await writeAllDataToGoogleSheet(
          token,
          cleanId,
          transactions,
          liveAccounts,
          budgets,
          goals,
          emergencyFund,
          listsConfig
        );
        showToast(`Linked "${meta.title}" and initialized financial tabs!`);
      }

      setConnectionState('connected');
      updateLastSyncedTime();
    } catch (err: any) {
      console.error('Link spreadsheet error:', err);
      if (err instanceof GoogleSyncError) {
        if (err.type === 'PERMISSION_DENIED') setConnectionState('permission_denied');
        else if (err.type === 'NOT_FOUND') setConnectionState('unavailable');
        setSyncError(err.message);
      } else {
        setSyncError(err.message || 'Could not link spreadsheet');
      }
      showToast(`Link error: ${err.message}`);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Push all sheets to Google Sheets
  const handlePushAllToGoogleSheets = async () => {
    if (!googleToken || !spreadsheetId) {
      await handleConnectGoogleSheets();
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    try {
      await writeAllDataToGoogleSheet(
        googleToken,
        spreadsheetId,
        transactions,
        liveAccounts,
        budgets,
        goals,
        emergencyFund,
        listsConfig,
        deposits
      );
      updateLastSyncedTime();
      showToast('All sheets including Deposits synchronized with Google Sheets!');
    } catch (err: any) {
      console.error('Push all error:', err);
      const msg = err.message || 'Failed to update Google Sheets';
      setSyncError(msg);
      showToast(`Update error: ${msg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Disconnect from Google Sheets
  const handleDisconnectGoogleSheets = async () => {
    await logout();
    setGoogleUser(null);
    setGoogleToken(null);
    setSpreadsheetId(null);
    setLastSynced(null);
    setConnectionState('not_connected');
    setSyncError(null);
    localStorage.removeItem(SPREADSHEET_ID_STORAGE_KEY);
    localStorage.removeItem(LAST_SYNCED_STORAGE_KEY);
    showToast('Disconnected from Google Sheets.');
  };

  // Transaction Actions: Add, Edit, Delete with direct Google Sheets write
  const handleAddTransaction = (newTxData: Omit<Transaction, 'id' | 'income' | 'expense'>) => {
    const isIncome = newTxData.type === 'Income';
    const isExpense = newTxData.type === 'Expense';

    const newTx: Transaction = {
      ...newTxData,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      income: isIncome ? newTxData.amount : 0,
      expense: isExpense ? newTxData.amount : 0,
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);

    // Write directly into the same Google Spreadsheet
    if (googleToken && spreadsheetId && connectionState === 'connected') {
      appendTransactionToGoogleSheet(googleToken, spreadsheetId, newTx)
        .then(() => {
          updateLastSyncedTime();
          showToast(`Transaction saved & written to Google Sheet.`);
        })
        .catch((err) => {
          console.warn('Direct row append failed, fallback to full write:', err);
          writeTransactionsToGoogleSheet(googleToken!, spreadsheetId!, updated)
            .then(() => updateLastSyncedTime())
            .catch((e) => console.error('Full fallback write failed:', e));
        });
    } else {
      showToast(`Transaction "${newTx.description}" saved.`);
    }
  };

  const handleEditTransaction = (updatedTx: Transaction) => {
    const updated = transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t));
    setTransactions(updated);

    // Write updated row directly into the same Google Spreadsheet
    if (googleToken && spreadsheetId && connectionState === 'connected') {
      updateTransactionInGoogleSheet(googleToken, spreadsheetId, updatedTx)
        .then(() => {
          updateLastSyncedTime();
          showToast('Transaction updated in Google Sheet.');
        })
        .catch((err) => {
          console.warn('Row update failed, syncing full transactions table:', err);
          writeTransactionsToGoogleSheet(googleToken!, spreadsheetId!, updated)
            .then(() => updateLastSyncedTime())
            .catch((e) => console.error('Full transactions sync failed:', e));
        });
    } else {
      showToast('Transaction updated.');
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);

    // Delete row directly from the same Google Spreadsheet
    if (googleToken && spreadsheetId && connectionState === 'connected') {
      deleteTransactionFromGoogleSheet(googleToken, spreadsheetId, id)
        .then(() => {
          updateLastSyncedTime();
          showToast('Transaction deleted from Google Sheet.');
        })
        .catch((err) => {
          console.warn('Row delete failed, syncing full transactions table:', err);
          writeTransactionsToGoogleSheet(googleToken!, spreadsheetId!, updated)
            .then(() => updateLastSyncedTime())
            .catch((e) => console.error('Full transactions sync failed:', e));
        });
    } else {
      showToast('Transaction removed.');
    }
  };

  // Optional offline backup: Export to Excel (.xlsx)
  const handleExportExcel = async () => {
    try {
      const buffer = await generateSashasWorkbook(
        transactions,
        liveAccounts,
        budgets,
        goals,
        emergencyFund,
        listsConfig,
        deposits
      );
      downloadBlob(buffer, `Sashas_Finance_Dashboard_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('Downloaded offline Excel backup (.xlsx).');
    } catch (err) {
      console.error('Failed to export Excel workbook:', err);
      showToast('Export failed. Please check console.');
    }
  };

  // Reset demo data
  const handleResetData = () => {
    if (window.confirm('Reset all transactions, deposits, and goals to default template numbers?')) {
      setTransactions(SAMPLE_TRANSACTIONS);
      setListsConfig(DEFAULT_LISTS_CONFIG);
      setBudgets(INITIAL_BUDGETS);
      setGoals(INITIAL_GOALS);
      setEmergencyFund(INITIAL_EMERGENCY_FUND);
      setDeposits(INITIAL_DEPOSITS);
      showToast('Dashboard reset to default template state.');
    }
  };

  // Deposits CRUD Operations
  const handleAddDeposit = (newDepData: Deposit, fundFromAccount?: string) => {
    const newDep: Deposit = {
      ...newDepData,
      id: newDepData.id || `dep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    const updated = [newDep, ...deposits];
    setDeposits(updated);

    if (fundFromAccount) {
      handleAddTransaction({
        date: newDepData.startDate || new Date().toISOString().split('T')[0],
        description: `Penempatan Deposito ${newDepData.platform} - ${newDepData.name}`,
        type: 'Transfer',
        amount: newDepData.principal,
        account: fundFromAccount,
        paymentMethod: 'Transfer',
        category: 'Investasi',
        purpose: 'Investment',
        event: 'Deposito',
        context: 'Personal',
        notes: `Penempatan Deposito: ${newDepData.platform} - ${newDepData.name}`,
      });
    }

    if (googleToken && spreadsheetId && connectionState === 'connected') {
      writeDepositsToGoogleSheet(googleToken, spreadsheetId, updated)
        .then(() => {
          updateLastSyncedTime();
          showToast(t('depositCreatedToast', lang));
        })
        .catch((err) => {
          console.warn('Sync deposits failed:', err);
        });
    } else {
      showToast(t('depositCreatedToast', lang));
    }
  };

  const handleWithdrawDeposit = (depositId: string, destinationAccount: string, actualInterest: number) => {
    const target = deposits.find((d) => d.id === depositId);
    if (!target) return;

    const updated = deposits.map((d) =>
      d.id === depositId
        ? {
            ...d,
            status: 'Withdrawn' as const,
            notes: d.notes ? `${d.notes} (Dicairkan ke ${destinationAccount})` : `Dicairkan ke ${destinationAccount}`,
          }
        : d
    );
    setDeposits(updated);

    const todayStr = new Date().toISOString().split('T')[0];
    // 1. Record Principal Return as Transfer (keep savings rate accurate)
    handleAddTransaction({
      date: todayStr,
      description: `Pencairan Pokok Deposito ${target.platform} - ${target.name}`,
      type: 'Transfer',
      amount: target.principal,
      account: destinationAccount,
      paymentMethod: 'Transfer',
      category: 'Investasi',
      purpose: 'Investment',
      event: 'Deposito',
      context: 'Personal',
      notes: `Pencairan Pokok Deposito: ${target.platform} - ${target.name}`,
    });

    // 2. Record Actual Interest Received as Income
    if (actualInterest > 0) {
      handleAddTransaction({
        date: todayStr,
        description: `Bunga Deposito ${target.platform} - ${target.name}`,
        type: 'Income',
        amount: actualInterest,
        account: destinationAccount,
        paymentMethod: 'Transfer',
        category: 'Investasi',
        purpose: 'Investment',
        event: 'Bunga Deposito',
        context: 'Personal',
        notes: `Bunga Deposito: ${target.platform} - ${target.name}`,
      });
    }

    if (googleToken && spreadsheetId && connectionState === 'connected') {
      writeDepositsToGoogleSheet(googleToken, spreadsheetId, updated)
        .then(() => {
          updateLastSyncedTime();
          showToast(t('toastDepositWithdrawn', lang));
        })
        .catch((err) => {
          console.warn('Sync deposits failed:', err);
        });
    } else {
      showToast(t('toastDepositWithdrawn', lang));
    }
  };

  const handleEditDeposit = (updatedDep: Deposit) => {
    const updated = deposits.map((d) => (d.id === updatedDep.id ? updatedDep : d));
    setDeposits(updated);

    if (googleToken && spreadsheetId && connectionState === 'connected') {
      writeDepositsToGoogleSheet(googleToken, spreadsheetId, updated)
        .then(() => {
          updateLastSyncedTime();
          showToast(t('depositUpdatedToast', lang));
        })
        .catch((err) => {
          console.warn('Sync deposits failed:', err);
        });
    } else {
      showToast(t('depositUpdatedToast', lang));
    }
  };

  const handleDeleteDeposit = (id: string) => {
    const updated = deposits.filter((d) => d.id !== id);
    setDeposits(updated);

    if (googleToken && spreadsheetId && connectionState === 'connected') {
      writeDepositsToGoogleSheet(googleToken, spreadsheetId, updated)
        .then(() => {
          updateLastSyncedTime();
          showToast(t('depositDeletedToast', lang));
        })
        .catch((err) => {
          console.warn('Sync deposits failed:', err);
        });
    } else {
      showToast(t('depositDeletedToast', lang));
    }
  };

  const handleRenamePlatformInDeposits = (oldName: string, newName: string) => {
    const updated = deposits.map((d) => (d.platform === oldName ? { ...d, platform: newName } : d));
    setDeposits(updated);

    if (googleToken && spreadsheetId && connectionState === 'connected') {
      writeDepositsToGoogleSheet(googleToken, spreadsheetId, updated)
        .then(() => updateLastSyncedTime())
        .catch((err) => console.warn('Sync renamed platform deposits failed:', err));
    }
  };

  // Theme token classes
  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;
  const appBg = tokens.appBg;
  const navBg = tokens.navBg;
  const labelColor = tokens.labelColor;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${appBg}`}>
      {/* Navigation Header */}
      <header className={`sticky top-0 z-40 border-b shadow-2xs backdrop-blur-md ${navBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15">
            {/* Logo / App Name */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold font-heading text-sm shadow-xs">
                S
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight font-heading leading-tight">
                  Sasha’s Finance Dashboard
                </h1>
                <span className={`text-[10px] hidden sm:block ${labelColor}`}>
                  Permanent Google Sheet Database Single Source of Truth
                </span>
              </div>
            </div>

            {/* Middle Nav Tabs */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center space-x-1">
                {[
                  { id: 'Dashboard', label: t('navDashboard', lang), icon: LayoutDashboard },
                  { id: 'Transactions', label: t('navTransactions', lang), icon: ArrowLeftRight },
                  { id: 'Accounts', label: t('navAccounts', lang), icon: Wallet },
                  { id: 'Deposits', label: t('navDeposits', lang), icon: Landmark },
                  { id: 'Goals', label: t('navGoals', lang), icon: Target },
                  { id: 'Settings', label: t('navSettings', lang), icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id as any)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-amber-500 text-black font-semibold shadow-2xs'
                          : `${labelColor} hover:text-inherit hover:bg-black/5 dark:hover:bg-white/5`
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Right Action Controls */}
            <div className="flex items-center space-x-2">
              {/* Quick Add Button */}
              {isAuthenticated && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Entry</span>
                </button>
              )}

              {/* Google Sheets Sync Status Quick Pill */}
              {connectionState === 'connected' ? (
                <button
                  onClick={handleRefreshSync}
                  disabled={isSyncing}
                  title={`Google Sheet Connected: ${spreadsheetTitle}. Last synced: ${lastSynced || 'Just now'}. Click to refresh.`}
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    isSyncing ? 'opacity-70' : ''
                  } border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10`}
                >
                  <FileSpreadsheet className={`w-3.5 h-3.5 text-emerald-500 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline text-[11px] font-semibold">{isSyncing ? 'Syncing...' : 'Sheet Synced'}</span>
                </button>
              ) : connectionState === 'auth_required' ? (
                <button
                  onClick={handleConnectGoogleSheets}
                  title="Session expired or sign-in needed to sync."
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="hidden sm:inline text-[11px]">Sign In to Sync</span>
                </button>
              ) : (
                <button
                  onClick={() => handleSelectTab('Settings')}
                  title="Google Sheets not connected yet. Open Settings to connect."
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="hidden sm:inline text-[11px]">Connect Sheet</span>
                </button>
              )}

              {/* Language Switcher Quick Pill */}
              <button
                onClick={() => handleSelectLanguage(lang === 'id' ? 'en' : 'id')}
                title={lang === 'id' ? 'Ganti bahasa ke English' : 'Switch language to Bahasa Indonesia'}
                className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors flex items-center space-x-1 ${navBg} hover:bg-black/5 dark:hover:bg-white/5 font-semibold`}
              >
                <Globe className="w-4 h-4 text-amber-500" />
                <span className="text-[11px] font-bold text-amber-500">
                  {lang.toUpperCase()}
                </span>
              </button>

              {/* Download Excel Backup (.xlsx) */}
              <button
                onClick={handleExportExcel}
                title="Download optional .xlsx backup"
                className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors ${navBg} hover:bg-black/5 dark:hover:bg-white/5`}
              >
                <Download className="w-4 h-4 text-amber-500" />
              </button>

              {/* Theme Cycle Button */}
              <button
                onClick={() => toggleTheme()}
                title={`Current Theme: ${THEMES.find((t) => t.id === theme)?.name || theme}. Click to cycle themes.`}
                className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors flex items-center space-x-1.5 ${navBg} hover:bg-black/5 dark:hover:bg-white/5`}
              >
                <Palette className={`w-4 h-4 ${tokens.accentText}`} />
                <span className="text-[11px] font-semibold hidden xl:inline">
                  {THEMES.find((t) => t.id === theme)?.name}
                </span>
              </button>

              {/* Security Lock Toggle */}
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    localStorage.removeItem('sashas_auth_unlocked');
                    setIsAuthenticated(false);
                    showToast('Workbook locked.');
                  } else {
                    setIsAuthenticated(true);
                  }
                }}
                title={isAuthenticated ? 'Lock workspace' : 'Authenticate'}
                className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                  isAuthenticated
                    ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                    : 'border-amber-500/30 text-amber-500 bg-amber-500/5'
                }`}
              >
                {isAuthenticated ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Tabs */}
          {isAuthenticated && (
            <div className="flex md:hidden overflow-x-auto py-2 border-t border-inherit space-x-1 scrollbar-none">
              {[
                { id: 'Dashboard', label: t('navDashboard', lang), icon: LayoutDashboard },
                { id: 'Transactions', label: t('navTransactions', lang), icon: ArrowLeftRight },
                { id: 'Accounts', label: t('navAccounts', lang), icon: Wallet },
                { id: 'Deposits', label: t('navDeposits', lang), icon: Landmark },
                { id: 'Goals', label: t('navGoals', lang), icon: Target },
                { id: 'Settings', label: t('navSettings', lang), icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id as any)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap ${
                      isActive
                        ? 'bg-amber-500 text-black font-semibold'
                        : `${labelColor}`
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          <AuthGate
            theme={theme}
            onLogin={() => {
              setIsAuthenticated(true);
              localStorage.setItem('sashas_auth_unlocked', 'true');
              showToast('Access granted. Welcome back, Sasha!');
            }}
          />
        ) : (
          <>
            {activeTab === 'Dashboard' && (
              <DashboardView
                transactions={transactions}
                accounts={liveAccounts}
                budgets={budgets}
                goals={goals}
                emergencyFund={emergencyFund}
                filter={filter}
                setFilter={setFilter}
                onAddTransactionClick={() => setIsAddModalOpen(true)}
                theme={theme}
                bannerConfig={bannerConfig}
                lang={lang}
                onOpenBannerSettings={() => {
                  setSettingsInitialTab('banner');
                  handleSelectTab('Settings');
                }}
                deposits={deposits}
                onNavigateToDeposits={() => handleSelectTab('Deposits')}
              />
            )}

            {activeTab === 'Transactions' && (
              <TransactionsView
                transactions={transactions}
                onAddTransaction={handleAddTransaction}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                listsConfig={listsConfig}
                onExportExcel={handleExportExcel}
                theme={theme}
                connectionState={connectionState}
                spreadsheetTitle={spreadsheetTitle}
                isSyncing={isSyncing}
                onRefreshSync={handleRefreshSync}
                onConnectGoogleSheets={handleConnectGoogleSheets}
                spreadsheetUrl={spreadsheetUrl}
                lang={lang}
              />
            )}

            {activeTab === 'Accounts' && (
              <AccountsView
                accounts={liveAccounts}
                transactions={transactions}
                listsConfig={listsConfig}
                onAddTransaction={handleAddTransaction}
                theme={theme}
                lang={lang}
              />
            )}

            {activeTab === 'Deposits' && (
              <DepositsView
                deposits={deposits}
                onAddDeposit={handleAddDeposit}
                onEditDeposit={handleEditDeposit}
                onDeleteDeposit={handleDeleteDeposit}
                onWithdrawDeposit={handleWithdrawDeposit}
                accounts={liveAccounts}
                listsConfig={listsConfig}
                theme={theme}
                lang={lang}
                onOpenPlatformSettings={() => {
                  setSettingsInitialTab('platforms');
                  handleSelectTab('Settings');
                }}
              />
            )}

            {activeTab === 'Goals' && (
              <GoalsView
                goals={goals}
                onUpdateGoals={setGoals}
                emergencyFund={emergencyFund}
                onUpdateEmergencyFund={setEmergencyFund}
                theme={theme}
                lang={lang}
              />
            )}

            {activeTab === 'Settings' && (
              <SettingsView
                theme={theme}
                onToggleTheme={toggleTheme}
                listsConfig={listsConfig}
                onUpdateListsConfig={setListsConfig}
                onExportExcel={handleExportExcel}
                onResetData={handleResetData}
                connectionState={connectionState}
                spreadsheetTitle={spreadsheetTitle}
                googleUser={googleUser}
                lastSynced={lastSynced}
                spreadsheetId={spreadsheetId}
                spreadsheetUrl={spreadsheetUrl}
                isSyncing={isSyncing}
                syncError={syncError}
                onCreatePermanentSheet={handleCreatePermanentSheet}
                onConnectGoogleSheets={handleConnectGoogleSheets}
                onRefreshSync={handleRefreshSync}
                onDisconnectGoogleSheets={handleDisconnectGoogleSheets}
                onPushAllToGoogleSheets={handlePushAllToGoogleSheets}
                onLinkSpreadsheetId={handleLinkSpreadsheetId}
                lang={lang}
                onSelectLanguage={handleSelectLanguage}
                bannerConfig={bannerConfig}
                onChangeBannerConfig={handleChangeBannerConfig}
                initialTab={settingsInitialTab}
                deposits={deposits}
                onRenamePlatformInDeposits={handleRenamePlatformInDeposits}
              />
            )}
          </>
        )}
      </main>

      {/* Global Quick Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={handleAddTransaction}
        listsConfig={listsConfig}
        theme={theme}
        lang={lang}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-2xl bg-black/85 text-white dark:bg-white/95 dark:text-black shadow-2xl border border-white/10 dark:border-black/10 text-xs font-medium backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
