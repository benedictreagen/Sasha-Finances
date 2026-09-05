export type TransactionType = 'Opening Balance' | 'Income' | 'Expense' | 'Transfer' | 'Adjustment' | string;

export type StandardCategory = 
  | 'Food'
  | 'Transportation'
  | 'Education'
  | 'Organization'
  | 'Health'
  | 'Shopping'
  | 'Entertainment'
  | 'Other';

export type Category = StandardCategory | string;

export type StandardAccountName = 
  | 'Cash'
  | 'Blu'
  | 'Blu Pocket'
  | 'Bank Jateng'
  | 'Seabank'
  | 'Shopeepay'
  | 'Gopay'
  | 'Dana';

export type AccountName = StandardAccountName | string;

export type AccountType = 'Cash' | 'Bank' | 'E-Wallet';

export type PaymentMethod = 
  | 'Cash'
  | 'QRIS'
  | 'Transfer'
  | 'E-Wallet'
  | 'Virtual Account'
  | string;

export type Purpose = 'Need' | 'Want' | 'Investment' | string;

export type EventType = 
  | 'College'
  | 'Personal'
  | 'Travel'
  | 'Food'
  | 'Shopping'
  | 'Family'
  | 'Organization'
  | 'Other'
  | string;

export interface ListsConfig {
  types: string[];
  categories: string[];
  accounts: AccountInfo[];
  paymentMethods: string[];
  purposes: string[];
  events: string[];
  depositPlatforms?: string[];
}

export type DepositStatus = 'Active' | 'Matured' | 'Withdrawn' | 'Reinvested';

export interface Deposit {
  id: string;
  platform: string;
  name: string;
  principal: number;
  interestRate: number; // Percentage p.a. (e.g., 4.5 for 4.5%)
  startDate: string; // YYYY-MM-DD
  maturityDate: string; // YYYY-MM-DD
  estimatedInterest: number;
  status: DepositStatus;
  sourceAccount?: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  type: TransactionType;
  category: Category;
  account: AccountName;
  toAccount?: AccountName; // for Transfers
  paymentMethod: PaymentMethod;
  amount: number;
  income: number;
  expense: number;
  context: string;
  purpose: Purpose;
  event: string; // Comma separated or single string
  notes: string;
  recurringRuleId?: string; // Links to recurring transaction rule if generated
}

export type Frequency = 'Daily' | 'Weekly' | 'Bi-weekly' | 'Monthly' | 'Yearly';

export interface RecurringTransaction {
  id: string;
  description: string;
  type: TransactionType;
  category: Category;
  account: AccountName;
  toAccount?: AccountName;
  paymentMethod: PaymentMethod;
  amount: number;
  purpose: Purpose;
  event: string;
  frequency: Frequency;
  startDate: string; // YYYY-MM-DD
  lastGeneratedDate?: string; // YYYY-MM-DD
  status: 'Active' | 'Paused';
  notes?: string;
}

export type ThemeMode = 
  | 'light' 
  | 'dark' 
  | 'cherry-blossom' 
  | 'spring' 
  | 'winter' 
  | 'berry' 
  | 'cloud';

export interface AccountInfo {
  name: AccountName;
  type: AccountType;
  openingBalance: number;
  balance: number;
}

export interface BudgetCategory {
  category: Category;
  budget: number;
  spent: number;
  left: number;
  percentUsed: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetBalance: number;
  saved: number;
  targetDate: string;
}

export interface EmergencyFundData {
  targetAmount: number;
  currentAmount: number;
  idealMonths: number;
  monthlyEssentialExpense: number;
}

export interface FilterState {
  semester: string;
  period: string;
  month: string; // 'All' | '01' | ... | '12'
  week: string;  // 'All' | 'W1' | 'W2' | 'W3' | 'W4' | 'W5'
  account: string; // 'All' | AccountName
  category: string; // 'All' | Category
  event: string; // 'All' | EventType
}

export type GoogleConnectionState = 
  | 'connected'
  | 'not_connected'
  | 'auth_required'
  | 'permission_denied'
  | 'unavailable';

export interface SpreadsheetInfo {
  id: string;
  title: string;
  url: string;
  sheets: string[];
}
