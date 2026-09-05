import { Transaction, AccountInfo, SavingsGoal, EmergencyFundData, ListsConfig, GoogleConnectionState, Deposit } from './types';
import { DEFAULT_LISTS_CONFIG } from './data';

export interface GoogleSyncResult {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
}

export const PERMANENT_SPREADSHEET_ID_KEY = 'sashas_permanent_spreadsheet_id';
export const SPREADSHEET_ID_STORAGE_KEY = PERMANENT_SPREADSHEET_ID_KEY;
export const PERMANENT_SPREADSHEET_TITLE_KEY = 'sashas_permanent_spreadsheet_title';
export const LAST_SYNCED_STORAGE_KEY = 'sashas_last_synced';

export class GoogleSyncError extends Error {
  code: 'AUTH_REQUIRED' | 'PERMISSION_DENIED' | 'UNAVAILABLE' | 'NETWORK_ERROR' | 'UNKNOWN';
  status?: number;

  get type() {
    if (this.code === 'AUTH_REQUIRED') return 'AUTH_EXPIRED';
    if (this.code === 'PERMISSION_DENIED') return 'PERMISSION_DENIED';
    if (this.code === 'UNAVAILABLE') return 'NOT_FOUND';
    if (this.code === 'NETWORK_ERROR') return 'NETWORK_ERROR';
    return 'UNKNOWN';
  }

  constructor(message: string, code: 'AUTH_REQUIRED' | 'PERMISSION_DENIED' | 'UNAVAILABLE' | 'NETWORK_ERROR' | 'UNKNOWN', status?: number) {
    super(message);
    this.name = 'GoogleSyncError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Extract Google Spreadsheet ID from either a full URL or a raw ID string
 */
export function extractSpreadsheetId(urlOrId: string): string {
  const trimmed = urlOrId.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Parses HTTP response error and creates a typed GoogleSyncError
 */
async function handleApiError(res: Response, defaultMessage: string): Promise<never> {
  let errorDetail = defaultMessage;
  try {
    const errorJson = await res.json();
    if (errorJson?.error?.message) {
      errorDetail = errorJson.error.message;
    }
  } catch {
    // If not json
  }

  if (res.status === 401) {
    throw new GoogleSyncError(
      `Authentication required: ${errorDetail}`,
      'AUTH_REQUIRED',
      401
    );
  }
  if (res.status === 403) {
    throw new GoogleSyncError(
      `Permission denied: ${errorDetail}. Ensure your Google account has edit permissions and the Google Sheets API is enabled.`,
      'PERMISSION_DENIED',
      403
    );
  }
  if (res.status === 404 || res.status === 410) {
    throw new GoogleSyncError(
      `Spreadsheet unavailable: Could not locate spreadsheet (${errorDetail}).`,
      'UNAVAILABLE',
      res.status
    );
  }

  throw new GoogleSyncError(
    `${defaultMessage} (${res.status}): ${errorDetail}`,
    'UNKNOWN',
    res.status
  );
}

/**
 * Verifies spreadsheet exists and is accessible
 */
export async function verifySpreadsheetAccess(
  accessToken: string,
  spreadsheetId: string
): Promise<boolean> {
  try {
    await getSpreadsheetMetadata(accessToken, spreadsheetId);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Verifies spreadsheet exists, is accessible, and returns its title and sheets list
 */
export async function getSpreadsheetMetadata(
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheetTitles: string[] }> {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      await handleApiError(res, 'Failed to inspect Google Spreadsheet');
    }

    const data = await res.json();
    const title = data.properties?.title || 'Sasha Finance';
    const sheetTitles = (data.sheets || []).map((s: any) => s.properties?.title || '');
    return { title, sheetTitles };
  } catch (err: any) {
    if (err instanceof GoogleSyncError) throw err;
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      throw new GoogleSyncError('Network error: Unable to reach Google Sheets API', 'NETWORK_ERROR');
    }
    throw new GoogleSyncError(err.message || 'Error communicating with Google Sheets', 'UNKNOWN');
  }
}

/**
 * Ensures that the required 8 sheets exist in the spreadsheet
 */
export async function ensureSpreadsheetTabs(
  accessToken: string,
  spreadsheetId: string,
  existingSheetTitles: string[]
): Promise<void> {
  const REQUIRED_SHEETS = [
    'Dashboard',
    'Transactions',
    'Accounts',
    'Savings Goals',
    'Emergency Fund',
    'Lists',
    'Monthly Summary',
    'Weekly Summary',
    'Deposits',
  ];

  const missingSheets = REQUIRED_SHEETS.filter(
    (name) => !existingSheetTitles.includes(name)
  );

  if (missingSheets.length === 0) {
    return;
  }

  const requests = missingSheets.map((title) => ({
    addSheet: {
      properties: {
        title,
      },
    },
  }));

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests,
    }),
  });

  if (!res.ok) {
    await handleApiError(res, 'Failed to initialize spreadsheet tabs');
  }
}

/**
 * Creates the ONE permanent "Sasha Finance" Google Spreadsheet
 */
export async function createPermanentGoogleSheet(
  accessToken: string,
  title: string = 'Sasha Finance'
): Promise<GoogleSyncResult> {
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        { properties: { title: 'Dashboard' } },
        { properties: { title: 'Transactions' } },
        { properties: { title: 'Accounts' } },
        { properties: { title: 'Savings Goals' } },
        { properties: { title: 'Emergency Fund' } },
        { properties: { title: 'Lists' } },
        { properties: { title: 'Monthly Summary' } },
        { properties: { title: 'Weekly Summary' } },
        { properties: { title: 'Deposits' } },
      ],
    }),
  });

  if (!createRes.ok) {
    await handleApiError(createRes, `Failed to create permanent Google Spreadsheet "${title}"`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetTitle = sheetData.properties?.title || title;

  return {
    spreadsheetId,
    spreadsheetTitle,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

/**
 * Fetches transactions directly from Google Sheets Transactions sheet (A3:M2000)
 */
export async function fetchTransactionsFromGoogleSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Transaction[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transactions!A3:M2000`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    await handleApiError(res, 'Failed to fetch transactions from Google Sheet');
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  const parsedTransactions: Transaction[] = [];

  rows.forEach((row, idx) => {
    // Column layout:
    // 0: Date, 1: Description, 2: Type, 3: Category, 4: Account, 5: Payment Method,
    // 6: Amount, 7: Income, 8: Expense, 9: Context, 10: Purpose, 11: Event, 12: Notes
    if (!row || row.length === 0 || !row[0] || !row[1]) {
      return; // Skip empty rows
    }

    const date = String(row[0]).trim();
    const description = String(row[1]).trim();
    const type = (String(row[2] || 'Expense').trim()) as Transaction['type'];
    const category = String(row[3] || 'Other').trim();
    const account = (String(row[4] || 'Cash').trim()) as Transaction['account'];
    const paymentMethod = (String(row[5] || 'Cash').trim()) as Transaction['paymentMethod'];
    
    // Clean amount
    const rawAmt = typeof row[6] === 'number' ? row[6] : parseFloat(String(row[6] || '0').replace(/[^0-9.-]+/g, '')) || 0;
    const amount = Math.abs(rawAmt);

    const context = row[9] ? String(row[9]).trim() : '';
    const purpose = (String(row[10] || 'Need').trim()) as Transaction['purpose'];
    const event = String(row[11] || 'Personal').trim();
    const notes = row[12] ? String(row[12]).trim() : '';

    // Check if transfer has toAccount in context (e.g. "To: BCA")
    let toAccount: Transaction['account'] | undefined = undefined;
    if (type === 'Transfer' && context) {
      const match = context.match(/To:\s*([^,\s]+)/i);
      if (match && match[1]) {
        toAccount = match[1] as any;
      }
    }

    parsedTransactions.push({
      id: `tx-sheet-${idx + 3}-${date}`,
      date,
      description,
      type,
      category,
      account,
      toAccount,
      paymentMethod,
      amount,
      income: type === 'Income' ? amount : 0,
      expense: type === 'Expense' ? amount : 0,
      context,
      purpose,
      event,
      notes,
    });
  });

  return parsedTransactions;
}

/**
 * Appends a new single transaction row directly to the permanent Google Sheet
 */
export async function appendTransactionToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  tx: Transaction
): Promise<void> {
  const rowValues = [
    tx.date,
    tx.description,
    tx.type,
    tx.category,
    tx.account,
    tx.paymentMethod,
    tx.amount,
    tx.type === 'Income' ? tx.amount : 0,
    tx.type === 'Expense' ? tx.amount : 0,
    tx.context || (tx.type === 'Transfer' && tx.toAccount ? `To: ${tx.toAccount}` : ''),
    tx.purpose,
    tx.event,
    tx.notes || '',
  ];

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transactions!A3:M:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!appendRes.ok) {
    await handleApiError(appendRes, 'Failed to append transaction to Google Sheet');
  }
}

/**
 * Updates a transaction row in the permanent Google Sheet
 */
export async function updateTransactionInGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  tx: Transaction
): Promise<void> {
  // Read current transactions to find matching row
  const current = await fetchTransactionsFromGoogleSheet(accessToken, spreadsheetId);
  const updatedList = current.map((item) => (item.id === tx.id ? tx : item));
  await writeTransactionsToGoogleSheet(accessToken, spreadsheetId, updatedList);
}

/**
 * Deletes a transaction row from the permanent Google Sheet
 */
export async function deleteTransactionFromGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  txId: string
): Promise<void> {
  const current = await fetchTransactionsFromGoogleSheet(accessToken, spreadsheetId);
  const updatedList = current.filter((item) => item.id !== txId);
  await writeTransactionsToGoogleSheet(accessToken, spreadsheetId, updatedList);
}

/**
 * Writes the transactions into Transactions!A3:M, keeping the single permanent sheet up to date
 */
export async function writeTransactionsToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  transactions: Transaction[]
): Promise<void> {
  // 1. Clear previous transactions range to eliminate stale deleted rows
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transactions!A3:M2000:clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (transactions.length === 0) return;

  // 2. Prepare transaction rows with precise 13 columns
  const txRows = transactions.map((tx, idx) => {
    const r = idx + 3;
    return [
      tx.date,
      tx.description,
      tx.type,
      tx.category,
      tx.account,
      tx.paymentMethod,
      tx.amount,
      `=IF(C${r}="Income",G${r},0)`,
      `=IF(C${r}="Expense",G${r},0)`,
      tx.context || (tx.type === 'Transfer' && tx.toAccount ? `To: ${tx.toAccount}` : ''),
      tx.purpose,
      tx.event,
      tx.notes || '',
    ];
  });

  // 3. Write rows
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transactions!A3:M${transactions.length + 2}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: txRows,
      }),
    }
  );

  if (!updateRes.ok) {
    await handleApiError(updateRes, 'Failed to write transactions to Google Sheets');
  }
}

/**
 * Fetches deposits directly from Google Sheets Deposits sheet (A2:K200)
 */
export async function fetchDepositsFromGoogleSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Deposit[]> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Deposits!A2:K200`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      if (res.status === 400 || res.status === 404) {
        return [];
      }
      await handleApiError(res, 'Failed to fetch deposits from Google Sheet');
    }

    const data = await res.json();
    const rows: any[][] = data.values || [];

    const parsedDeposits: Deposit[] = [];

    rows.forEach((row, idx) => {
      if (!row || row.length === 0 || !row[1] || !row[2]) {
        return;
      }

      const id = String(row[0] || `dep-${idx + 1}`).trim();
      const platform = String(row[1]).trim();
      const name = String(row[2]).trim();
      const rawPrincipal = typeof row[3] === 'number' ? row[3] : parseFloat(String(row[3] || '0').replace(/[^0-9.-]+/g, '')) || 0;
      const principal = Math.abs(rawPrincipal);
      const rawRate = typeof row[4] === 'number' ? row[4] : parseFloat(String(row[4] || '0').replace(/[^0-9.-]+/g, '')) || 0;
      const interestRate = Math.abs(rawRate);
      const startDate = String(row[5] || '').trim();
      const maturityDate = String(row[6] || '').trim();
      const rawEstInterest = typeof row[7] === 'number' ? row[7] : parseFloat(String(row[7] || '0').replace(/[^0-9.-]+/g, '')) || 0;
      const estimatedInterest = Math.abs(rawEstInterest);
      const rawStatus = String(row[8] || 'Active').trim();
      const validStatuses: Deposit['status'][] = ['Active', 'Matured', 'Withdrawn', 'Reinvested'];
      const status: Deposit['status'] = validStatuses.includes(rawStatus as any) ? (rawStatus as any) : 'Active';
      const sourceAccount = row[9] ? String(row[9]).trim() : undefined;
      const notes = row[10] ? String(row[10]).trim() : '';

      parsedDeposits.push({
        id,
        platform,
        name,
        principal,
        interestRate,
        startDate,
        maturityDate,
        estimatedInterest,
        status,
        sourceAccount,
        notes,
      });
    });

    return parsedDeposits;
  } catch (err) {
    console.warn('Could not read deposits from Google Sheet:', err);
    return [];
  }
}

/**
 * Writes the deposits list into Deposits!A1:K, keeping Google Sheets up to date
 */
export async function writeDepositsToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  deposits: Deposit[]
): Promise<void> {
  try {
    const meta = await getSpreadsheetMetadata(accessToken, spreadsheetId);
    await ensureSpreadsheetTabs(accessToken, spreadsheetId, meta.sheetTitles);
  } catch {
    // proceed
  }

  // Clear previous deposits range
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Deposits!A1:K200:clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const headerRow = [
    'Deposit ID',
    'Platform',
    'Deposit Name',
    'Principal',
    'Interest Rate (%)',
    'Start Date',
    'Maturity Date',
    'Estimated Interest',
    'Status',
    'Source Account',
    'Notes',
  ];

  const dataRows = deposits.map((d) => [
    d.id,
    d.platform,
    d.name,
    d.principal,
    d.interestRate,
    d.startDate,
    d.maturityDate,
    d.estimatedInterest,
    d.status,
    d.sourceAccount || '',
    d.notes || '',
  ]);

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Deposits!A1:K${dataRows.length + 1}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [headerRow, ...dataRows],
      }),
    }
  );

  if (!updateRes.ok) {
    await handleApiError(updateRes, 'Failed to write deposits to Google Sheets');
  }
}

/**
 * Fully populates or synchronizes all sheets in the Google Spreadsheet
 */
export async function writeAllDataToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  transactions: Transaction[],
  accounts: AccountInfo[],
  budgets: Record<string, number>,
  goals: SavingsGoal[],
  emergencyFund: EmergencyFundData,
  listsConfig: ListsConfig = DEFAULT_LISTS_CONFIG,
  deposits: Deposit[] = []
): Promise<void> {
  // Ensure tabs exist including Deposits
  try {
    const meta = await getSpreadsheetMetadata(accessToken, spreadsheetId);
    await ensureSpreadsheetTabs(accessToken, spreadsheetId, meta.sheetTitles);
  } catch {
    // proceed
  }
  // Lists
  const typesList = listsConfig.types || ['Opening Balance', 'Income', 'Expense', 'Transfer', 'Adjustment'];
  const catsList = listsConfig.categories || ['Food', 'Transportation', 'Education', 'Organization', 'Health', 'Shopping', 'Entertainment', 'Other'];
  const acctsList = accounts.map(a => a.name);
  const paymentsList = listsConfig.paymentMethods || ['Cash', 'QRIS', 'Transfer', 'E-Wallet', 'Virtual Account'];
  const purposesList = listsConfig.purposes || ['Need', 'Want', 'Investment'];
  const eventsList = listsConfig.events || ['College', 'Personal', 'Travel', 'Food', 'Shopping', 'Family', 'Organization', 'Other'];

  const maxLen = Math.max(typesList.length, catsList.length, acctsList.length, paymentsList.length, purposesList.length, eventsList.length);
  const listsRows = [];
  for (let i = 0; i < maxLen; i++) {
    listsRows.push([
      typesList[i] || '',
      catsList[i] || '',
      acctsList[i] || '',
      paymentsList[i] || '',
      purposesList[i] || '',
      eventsList[i] || '',
    ]);
  }
  const listsValues = [
    ['Type', 'Category', 'Account', 'Payment Method', 'Purpose', 'Event'],
    ...listsRows,
  ];

  // Transactions: Exact 13 columns mandated
  const txValues = [
    ['Date', 'Description', 'Type', 'Category', 'Account', 'Payment Method', 'Amount', 'Income', 'Expense', 'Context', 'Purpose', 'Event', 'Notes'],
    ...transactions.map((tx, idx) => {
      const r = idx + 3;
      return [
        tx.date,
        tx.description,
        tx.type,
        tx.category,
        tx.account,
        tx.paymentMethod,
        tx.amount,
        `=IF(C${r}="Income",G${r},0)`,
        `=IF(C${r}="Expense",G${r},0)`,
        tx.context || (tx.type === 'Transfer' && tx.toAccount ? `To: ${tx.toAccount}` : ''),
        tx.purpose,
        tx.event,
        tx.notes || '',
      ];
    }),
  ];

  // Accounts
  const acctValues = [
    ['Account', 'Type', 'Opening Balance', 'Income / Inflow', 'Expense / Outflow', 'Net Transfers', 'Current Balance'],
    ...accounts.map((acc, idx) => {
      const r = idx + 3;
      return [
        acc.name,
        acc.type,
        acc.openingBalance,
        `=SUMIFS(Transactions!$H$3:$H$1000, Transactions!$E$3:$E$1000, A${r})`,
        `=SUMIFS(Transactions!$I$3:$I$1000, Transactions!$E$3:$E$1000, A${r})`,
        `=SUMIFS(Transactions!$G$3:$G$1000, Transactions!$J$3:$J$1000, "*"&A${r}&"*", Transactions!$C$3:$C$1000, "Transfer") - SUMIFS(Transactions!$G$3:$G$1000, Transactions!$E$3:$E$1000, A${r}, Transactions!$C$3:$C$1000, "Transfer")`,
        `=C${r}+D${r}-E${r}+F${r}`,
      ];
    }),
    ['TOTAL BALANCE', '', `=SUM(C3:C${2 + accounts.length})`, `=SUM(D3:D${2 + accounts.length})`, `=SUM(E3:E${2 + accounts.length})`, `=SUM(F3:F${2 + accounts.length})`, `=SUM(G3:G${2 + accounts.length})`],
  ];

  // Savings Goals
  const goalsValues = [
    ['Goal ID', 'Goal Name', 'Target Balance', 'Current Saved', 'Target Date', 'Progress'],
    ...goals.map((g, idx) => {
      const r = idx + 2;
      return [
        g.id,
        g.name,
        g.targetBalance,
        g.saved,
        g.targetDate,
        `=IF(C${r}>0, D${r}/C${r}, 0)`,
      ];
    }),
  ];

  // Emergency Fund
  const efValues = [
    ['Parameter', 'Value', 'Unit / Note', 'Formula / Reference'],
    ['Monthly Essential Expense', emergencyFund.monthlyEssentialExpense, 'Rupiah', 'Average Necessary Expenses'],
    ['Target Months Coverage', emergencyFund.idealMonths, 'Months', 'Benchmark: 6 Months'],
    ['Target Amount', '=B2*B3', 'Rupiah', 'Manual / Target Formula'],
    ['Current Amount', emergencyFund.currentAmount, 'Rupiah', 'Linked to Savings'],
    ['Fund Gap (Remaining)', '=B4-B5', 'Rupiah', '= Target - Current Saved'],
    ['Coverage Progress %', '=IF(B4>0, B5/B4, 0)', 'Percentage', '= Current / Target'],
  ];

  // Monthly Summary
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthValues = [
    ['Month', 'Income', 'Expense', 'Cash Flow (Net)', 'Savings Rate'],
    ...months.map((m, idx) => {
      const r = idx + 2;
      const mNum = idx + 1;
      return [
        m,
        `=SUMIFS(Transactions!$H$3:$H$1000, Transactions!$A$3:$A$1000, ">="&DATE(2026,${mNum},1), Transactions!$A$3:$A$1000, "<="&EOMONTH(DATE(2026,${mNum},1),0))`,
        `=SUMIFS(Transactions!$I$3:$I$1000, Transactions!$A$3:$A$1000, ">="&DATE(2026,${mNum},1), Transactions!$A$3:$A$1000, "<="&EOMONTH(DATE(2026,${mNum},1),0))`,
        `=B${r}-C${r}`,
        `=IF(B${r}>0, D${r}/B${r}, 0)`,
      ];
    }),
  ];

  // Weekly Summary
  const weekValues = [
    ['Week', 'Date Range', 'Income', 'Expense', 'Cash Flow'],
    ['W1', '01/09/2026 - 07/09/2026', '=SUMIFS(Transactions!$H$3:$H$1000, Transactions!$A$3:$A$1000, ">=2026-09-01", Transactions!$A$3:$A$1000, "<=2026-09-07")', '=SUMIFS(Transactions!$I$3:$I$1000, Transactions!$A$3:$A$1000, ">=2026-09-01", Transactions!$A$3:$A$1000, "<=2026-09-07")', '=C2-D2'],
    ['W2', '08/09/2026 - 14/09/2026', '=SUMIFS(Transactions!$H$3:$H$1000, Transactions!$A$3:$A$1000, ">=2026-09-08", Transactions!$A$3:$A$1000, "<=2026-09-14")', '=SUMIFS(Transactions!$I$3:$I$1000, Transactions!$A$3:$A$1000, ">=2026-09-08", Transactions!$A$3:$A$1000, "<=2026-09-14")', '=C3-D3'],
    ['W3', '15/09/2026 - 21/09/2026', '=SUMIFS(Transactions!$H$3:$H$1000, Transactions!$A$3:$A$1000, ">=2026-09-15", Transactions!$A$3:$A$1000, "<=2026-09-21")', '=SUMIFS(Transactions!$I$3:$I$1000, Transactions!$A$3:$A$1000, ">=2026-09-15", Transactions!$A$3:$A$1000, "<=2026-09-21")', '=C4-D4'],
    ['W4', '22/09/2026 - 28/09/2026', '=SUMIFS(Transactions!$H$3:$H$1000, Transactions!$A$3:$A$1000, ">=2026-09-22", Transactions!$A$3:$A$1000, "<=2026-09-28")', '=SUMIFS(Transactions!$I$3:$I$1000, Transactions!$A$3:$A$1000, ">=2026-09-22", Transactions!$A$3:$A$1000, "<=2026-09-28")', '=C5-D5'],
    ['W5', '29/09/2026 - 30/09/2026', '=SUMIFS(Transactions!$H$3:$H$1000, Transactions!$A$3:$A$1000, ">=2026-09-29", Transactions!$A$3:$A$1000, "<=2026-09-30")', '=SUMIFS(Transactions!$I$3:$I$1000, Transactions!$A$3:$A$1000, ">=2026-09-29", Transactions!$A$3:$A$1000, "<=2026-09-30")', '=C6-D6'],
  ];

  // Dashboard Overview
  const dashValues = [
    ["Sasha’s Finance Dashboard", "", "", "", "", ""],
    ["TOTAL BALANCE", `=Accounts!G${3 + accounts.length}`, "SAVING RATE", '=IF(D4>0, H4/D4, 0)', "", ""],
    ["TOTAL INCOME", '=SUM(Transactions!$H$3:$H$1000)', "BUDGET LEFT", '=SUM(C14:C21)-F4', "", ""],
    ["TOTAL EXPENSE", '=SUM(Transactions!$I$3:$I$1000)', "EMERGENCY FUND", "='Emergency Fund'!B5", "", ""],
    ["SAVING (NET)", '=B3-B4', "HABIT SCORE", "95%", "", ""],
    ["", "", "", "", "", ""],
    ["BUDGET PROGRESS", "", "", "", "", ""],
    ["Category", "Budget", "Spent", "Left", "% Used", "Status"],
    ...Object.entries(budgets).map(([cat, amt], idx) => {
      const r = idx + 9;
      return [
        cat,
        amt,
        `=SUMIFS(Transactions!$I$3:$I$1000, Transactions!$D$3:$D$1000, A${r})`,
        `=B${r}-C${r}`,
        `=IF(B${r}>0, C${r}/B${r}, 0)`,
        `=IF(E${r}>1, "Exceeded", IF(E${r}>0.9, "High Usage", IF(E${r}>0.7, "Warning", "Healthy")))`,
      ];
    }),
  ];

  // Deposits values
  const depositsValues = [
    ['Deposit ID', 'Platform', 'Deposit Name', 'Principal', 'Interest Rate (%)', 'Start Date', 'Maturity Date', 'Estimated Interest', 'Status', 'Source Account', 'Notes'],
    ...deposits.map((d) => [
      d.id,
      d.platform,
      d.name,
      d.principal,
      d.interestRate,
      d.startDate,
      d.maturityDate,
      d.estimatedInterest,
      d.status,
      d.sourceAccount || '',
      d.notes || '',
    ]),
  ];

  // Batch Update Values
  const dataPayload = [
    { range: 'Lists!A1', values: listsValues },
    { range: 'Transactions!A2', values: txValues },
    { range: 'Accounts!A2', values: acctValues },
    { range: 'Savings Goals!A1', values: goalsValues },
    { range: 'Emergency Fund!A1', values: efValues },
    { range: 'Monthly Summary!A1', values: monthValues },
    { range: 'Weekly Summary!A1', values: weekValues },
    { range: 'Dashboard!A1', values: dashValues },
    { range: 'Deposits!A1', values: depositsValues },
  ];

  const batchRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: dataPayload,
    }),
  });

  if (!batchRes.ok) {
    await handleApiError(batchRes, 'Failed to update Google Spreadsheet data');
  }
}
