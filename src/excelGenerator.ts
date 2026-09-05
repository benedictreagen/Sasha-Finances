import ExcelJS from 'exceljs';
import { Transaction, AccountInfo, SavingsGoal, EmergencyFundData, ListsConfig, Deposit } from './types';
import { DEFAULT_LISTS_CONFIG } from './data';

// Format helpers
export const formatIDR = (val: number): string => {
  return 'Rp ' + Math.round(val).toLocaleString('id-ID');
};

export const formatPercent = (val: number): string => {
  return (val * 100).toFixed(1) + '%';
};

export async function generateSashasWorkbook(
  transactions: Transaction[],
  accounts: AccountInfo[],
  budgets: Record<string, number>,
  goals: SavingsGoal[],
  emergencyFund: EmergencyFundData,
  listsConfig: ListsConfig = DEFAULT_LISTS_CONFIG,
  deposits: Deposit[] = []
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sasha's Finance System";
  workbook.lastModifiedBy = "Sasha's Finance Dashboard";
  workbook.created = new Date();
  workbook.modified = new Date();

  // Notion-inspired subtle styling
  const fontHeader: Partial<ExcelJS.Font> = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontTitle: Partial<ExcelJS.Font> = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FF1F2937' } };
  const fontSub: Partial<ExcelJS.Font> = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF6B7280' } };
  const fontData: Partial<ExcelJS.Font> = { name: 'Calibri', size: 10 };

  const fillNavy: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D3748' } };
  const fillAccent: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } }; // Warm amber
  const fillCard: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
  const fillHighlight: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

  const idrFormat = '"Rp "#,##0;[Red]-"Rp "#,##0;"Rp "0';
  const pctFormat = '0.0%';

  const typesList = listsConfig.types || ['Opening Balance', 'Income', 'Expense', 'Transfer', 'Adjustment'];
  const catsList = listsConfig.categories || ['Food', 'Transportation', 'Education', 'Organization', 'Health', 'Shopping', 'Entertainment', 'Other'];
  const acctsList = accounts.map(a => a.name);
  const paymentsList = listsConfig.paymentMethods || ['Cash', 'QRIS', 'Transfer', 'E-Wallet', 'Virtual Account'];
  const purposesList = listsConfig.purposes || ['Need', 'Want', 'Investment'];
  const eventsList = listsConfig.events || ['College', 'Personal', 'Travel', 'Food', 'Shopping', 'Family', 'Organization', 'Other'];

  // ----------------------------------------------------
  // 1. DASHBOARD SHEET (Tab 1: Main Overview)
  // ----------------------------------------------------
  const wsDash = workbook.addWorksheet('Dashboard');
  wsDash.views = [{ showGridLines: true }];

  wsDash.mergeCells('B2:K2');
  const titleCell = wsDash.getCell('B2');
  titleCell.value = "Sasha’s Finance Dashboard";
  titleCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FF1F2937' } };
  titleCell.alignment = { vertical: 'middle' };

  wsDash.mergeCells('B3:K3');
  const subtitleCell = wsDash.getCell('B3');
  subtitleCell.value = 'Personal Finance System • Synchronized with Web Dashboard';
  subtitleCell.font = fontSub;

  // Filters representation in Excel
  wsDash.mergeCells('B5:K5');
  wsDash.getCell('B5').value = 'FILTER PRESETS';
  wsDash.getCell('B5').font = fontHeader;
  wsDash.getCell('B5').fill = fillNavy;

  wsDash.getRow(6).values = ['', 'Semester', 'Period', 'Month', 'Week', 'Account', 'Category', 'Event'];
  wsDash.getRow(6).font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF6B7280' } };
  wsDash.getRow(7).values = ['', 'Semester 2 (2026)', 'Monthly', 'All', 'All', 'All', 'All', 'All'];
  wsDash.getRow(7).font = fontData;

  // KPI Header
  wsDash.mergeCells('B9:K9');
  wsDash.getCell('B9').value = 'KEY FINANCIAL METRICS';
  wsDash.getCell('B9').font = fontHeader;
  wsDash.getCell('B9').fill = fillNavy;

  // Row 1 KPIs: Total Balance, Total Income, Total Expense, Net Saving
  wsDash.mergeCells('B10:C10');
  wsDash.getCell('B10').value = 'TOTAL BALANCE';
  wsDash.getCell('B10').font = fontSub;

  wsDash.mergeCells('D10:E10');
  wsDash.getCell('D10').value = 'TOTAL INCOME';
  wsDash.getCell('D10').font = fontSub;

  wsDash.mergeCells('F10:G10');
  wsDash.getCell('F10').value = 'TOTAL EXPENSE';
  wsDash.getCell('F10').font = fontSub;

  wsDash.mergeCells('H10:I10');
  wsDash.getCell('H10').value = 'NET SAVING';
  wsDash.getCell('H10').font = fontSub;

  // Formulas for Row 1 KPIs
  const totalAccountRows = accounts.length;
  wsDash.mergeCells('B11:C11');
  wsDash.getCell('B11').value = { formula: `Accounts!G${3 + totalAccountRows}` };
  wsDash.getCell('B11').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1F2937' } };
  wsDash.getCell('B11').numFmt = idrFormat;

  wsDash.mergeCells('D11:E11');
  wsDash.getCell('D11').value = { formula: 'SUM(Transactions!$H$3:$H$1000)' };
  wsDash.getCell('D11').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF15803D' } };
  wsDash.getCell('D11').numFmt = idrFormat;

  wsDash.mergeCells('F11:G11');
  wsDash.getCell('F11').value = { formula: 'SUM(Transactions!$I$3:$I$1000)' };
  wsDash.getCell('F11').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFDC2626' } };
  wsDash.getCell('F11').numFmt = idrFormat;

  wsDash.mergeCells('H11:I11');
  wsDash.getCell('H11').value = { formula: 'D11-F11' };
  wsDash.getCell('H11').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1F2937' } };
  wsDash.getCell('H11').numFmt = idrFormat;

  // Row 2 KPIs: Saving Rate, Budget Left, Emergency Fund, Habit Score
  wsDash.mergeCells('B13:C13');
  wsDash.getCell('B13').value = 'SAVING RATE';
  wsDash.getCell('B13').font = fontSub;

  wsDash.mergeCells('D13:E13');
  wsDash.getCell('D13').value = 'BUDGET LEFT';
  wsDash.getCell('D13').font = fontSub;

  wsDash.mergeCells('F13:G13');
  wsDash.getCell('F13').value = 'EMERGENCY FUND';
  wsDash.getCell('F13').font = fontSub;

  wsDash.mergeCells('H13:I13');
  wsDash.getCell('H13').value = 'HABIT SCORE';
  wsDash.getCell('H13').font = fontSub;

  wsDash.mergeCells('B14:C14');
  wsDash.getCell('B14').value = { formula: 'IF(D11>0, H11/D11, 0)' };
  wsDash.getCell('B14').font = { name: 'Calibri', size: 14, bold: true };
  wsDash.getCell('B14').numFmt = pctFormat;

  wsDash.mergeCells('D14:E14');
  wsDash.getCell('D14').value = { formula: `SUM(H19:H26)` };
  wsDash.getCell('D14').font = { name: 'Calibri', size: 14, bold: true };
  wsDash.getCell('D14').numFmt = idrFormat;

  wsDash.mergeCells('F14:G14');
  wsDash.getCell('F14').value = { formula: `'Emergency Fund'!B4` };
  wsDash.getCell('F14').font = { name: 'Calibri', size: 14, bold: true };
  wsDash.getCell('F14').numFmt = idrFormat;

  wsDash.mergeCells('H14:I14');
  wsDash.getCell('H14').value = '95 / 100';
  wsDash.getCell('H14').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF15803D' } };

  // Expense Grouping & Budget Progress
  wsDash.mergeCells('B17:I17');
  wsDash.getCell('B17').value = 'BUDGET & EXPENSE PROGRESS';
  wsDash.getCell('B17').font = fontHeader;
  wsDash.getCell('B17').fill = fillNavy;

  wsDash.getRow(18).values = ['', 'Category', 'Budget', 'Actual Spent', 'Remaining', '% Used', '% of Total', 'Status'];
  wsDash.getRow(18).font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF6B7280' } };

  catsList.forEach((cat, idx) => {
    const r = 19 + idx;
    const catBudget = budgets[cat] || 0;
    const row = wsDash.addRow([
      '',
      cat,
      catBudget,
      { formula: `SUMIFS(Transactions!$I$3:$I$1000, Transactions!$D$3:$D$1000, B${r})` },
      { formula: `C${r}-D${r}` },
      { formula: `IF(C${r}>0, D${r}/C${r}, 0)` },
      { formula: `IF(Dashboard!$F$11>0, D${r}/Dashboard!$F$11, 0)` },
      { formula: `IF(E${r}<0, "Over Budget", "On Track")` },
    ]);
    row.font = fontData;
    row.getCell(3).numFmt = idrFormat;
    row.getCell(4).numFmt = idrFormat;
    row.getCell(5).numFmt = idrFormat;
    row.getCell(6).numFmt = pctFormat;
    row.getCell(7).numFmt = pctFormat;
  });

  // Account Balances Section on Dashboard
  const acctStartRow = 29;
  wsDash.mergeCells(`B${acctStartRow}:I${acctStartRow}`);
  wsDash.getCell(`B${acctStartRow}`).value = 'ACCOUNTS SUMMARY';
  wsDash.getCell(`B${acctStartRow}`).font = fontHeader;
  wsDash.getCell(`B${acctStartRow}`).fill = fillNavy;

  wsDash.getRow(acctStartRow + 1).values = ['', 'Account', 'Type', 'Opening Balance', 'Current Balance', 'Status'];
  wsDash.getRow(acctStartRow + 1).font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF6B7280' } };

  accounts.forEach((acc, idx) => {
    const r = acctStartRow + 2 + idx;
    const row = wsDash.addRow([
      '',
      acc.name,
      acc.type,
      acc.openingBalance,
      { formula: `Accounts!G${3 + idx}` },
      'Active',
    ]);
    row.font = fontData;
    row.getCell(4).numFmt = idrFormat;
    row.getCell(5).numFmt = idrFormat;
  });

  // Column widths for Dashboard
  wsDash.getColumn(1).width = 4;
  wsDash.getColumn(2).width = 20;
  wsDash.getColumn(3).width = 18;
  wsDash.getColumn(4).width = 18;
  wsDash.getColumn(5).width = 18;
  wsDash.getColumn(6).width = 16;
  wsDash.getColumn(7).width = 16;
  wsDash.getColumn(8).width = 16;
  wsDash.getColumn(9).width = 16;
  wsDash.getColumn(10).width = 16;

  // ----------------------------------------------------
  // 2. TRANSACTIONS SHEET (Tab 2)
  // ----------------------------------------------------
  const wsTx = workbook.addWorksheet('Transactions');
  wsTx.views = [{ state: 'frozen', xSplit: 0, ySplit: 2, showGridLines: true }];

  // Title
  wsTx.mergeCells('A1:M1');
  const txTitleCell = wsTx.getCell('A1');
  txTitleCell.value = 'TRANSACTION LOG';
  txTitleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF1F2937' } };
  txTitleCell.alignment = { vertical: 'middle' };

  // Headers in Row 2: Exact order mandated by user
  const txHeaders = [
    'Date',
    'Description',
    'Type',
    'Category',
    'Account',
    'Payment Method',
    'Amount',
    'Income',
    'Expense',
    'Context',
    'Purpose',
    'Event',
    'Notes'
  ];
  const txRow2 = wsTx.getRow(2);
  txRow2.values = txHeaders;
  txRow2.font = fontHeader;
  txRow2.fill = fillNavy;
  txRow2.alignment = { vertical: 'middle', horizontal: 'center' };

  wsTx.columns = [
    { width: 13 }, // A: Date
    { width: 34 }, // B: Description
    { width: 16 }, // C: Type
    { width: 18 }, // D: Category
    { width: 16 }, // E: Account
    { width: 18 }, // F: Payment Method
    { width: 16 }, // G: Amount
    { width: 16 }, // H: Income
    { width: 16 }, // I: Expense
    { width: 22 }, // J: Context
    { width: 14 }, // K: Purpose
    { width: 22 }, // L: Event
    { width: 30 }, // M: Notes
  ];

  // Populate transaction rows
  transactions.forEach((tx, idx) => {
    const rowNum = 3 + idx;
    const row = wsTx.addRow([
      new Date(tx.date),
      tx.description,
      tx.type,
      tx.category,
      tx.account,
      tx.paymentMethod,
      tx.amount,
      { formula: `IF(C${rowNum}="Income",G${rowNum},0)` },
      { formula: `IF(C${rowNum}="Expense",G${rowNum},0)` },
      tx.context || (tx.type === 'Transfer' && tx.toAccount ? `To: ${tx.toAccount}` : ''),
      tx.purpose,
      tx.event,
      tx.notes,
    ]);

    row.font = fontData;
    row.getCell(1).numFmt = 'dd/mm/yyyy';
    row.getCell(7).numFmt = idrFormat;
    row.getCell(8).numFmt = idrFormat;
    row.getCell(9).numFmt = idrFormat;
  });

  // REAL EXCEL DROPDOWNS (Data Validation for rows 3 to 1000)
  const maxTypeRow = typesList.length + 1;
  const maxCatRow = catsList.length + 1;
  const maxAcctRow = acctsList.length + 1;
  const maxPmRow = paymentsList.length + 1;
  const maxPurpRow = purposesList.length + 1;
  const maxEventRow = eventsList.length + 1;

  for (let r = 3; r <= 1000; r++) {
    // Type dropdown (Col C)
    wsTx.getCell(`C${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`Lists!$A$2:$A$${maxTypeRow}`],
      showErrorMessage: true,
      errorTitle: 'Invalid Type',
      error: 'Please select a valid transaction type from the dropdown list.',
    };

    // Category dropdown (Col D)
    wsTx.getCell(`D${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`Lists!$B$2:$B$${maxCatRow}`],
      showErrorMessage: true,
      errorTitle: 'Invalid Category',
      error: 'Please select a valid category from the dropdown list.',
    };

    // Account dropdown (Col E)
    wsTx.getCell(`E${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`Lists!$C$2:$C$${maxAcctRow}`],
      showErrorMessage: true,
      errorTitle: 'Invalid Account',
      error: 'Please select a valid account from the dropdown list.',
    };

    // Payment Method dropdown (Col F)
    wsTx.getCell(`F${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`Lists!$D$2:$D$${maxPmRow}`],
      showErrorMessage: true,
      errorTitle: 'Invalid Payment Method',
      error: 'Please select a valid payment method from the dropdown list.',
    };

    // Purpose dropdown (Col K)
    wsTx.getCell(`K${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`Lists!$E$2:$E$${maxPurpRow}`],
      showErrorMessage: true,
      errorTitle: 'Invalid Purpose',
      error: 'Please select a valid purpose from the dropdown list.',
    };

    // Event dropdown (Col L)
    wsTx.getCell(`L${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`Lists!$F$2:$F$${maxEventRow}`],
      showErrorMessage: true,
      errorTitle: 'Invalid Event',
      error: 'Please select a valid event from the dropdown list.',
    };

    // Auto-populate formula in empty rows if edited in Excel
    if (r > 2 + transactions.length) {
      wsTx.getCell(`H${r}`).value = { formula: `IF(C${r}="Income",G${r},0)` };
      wsTx.getCell(`H${r}`).numFmt = idrFormat;
      wsTx.getCell(`I${r}`).value = { formula: `IF(C${r}="Expense",G${r},0)` };
      wsTx.getCell(`I${r}`).numFmt = idrFormat;
      wsTx.getCell(`A${r}`).numFmt = 'dd/mm/yyyy';
      wsTx.getCell(`G${r}`).numFmt = idrFormat;
    }
  }

  // ----------------------------------------------------
  // 3. ACCOUNTS SHEET (Tab 3)
  // ----------------------------------------------------
  const wsAccts = workbook.addWorksheet('Accounts');
  wsAccts.views = [{ state: 'frozen', ySplit: 2, showGridLines: true }];

  wsAccts.mergeCells('A1:G1');
  const acctsTitle = wsAccts.getCell('A1');
  acctsTitle.value = 'ACCOUNTS MANAGEMENT & RECONCILIATION';
  acctsTitle.font = fontTitle;

  const acctsHeader = ['Account', 'Type', 'Opening Balance', 'Income / Inflow', 'Expense / Outflow', 'Net Transfers', 'Current Balance'];
  const acctsRow2 = wsAccts.getRow(2);
  acctsRow2.values = acctsHeader;
  acctsRow2.font = fontHeader;
  acctsRow2.fill = fillNavy;

  wsAccts.columns = [
    { width: 20 },
    { width: 14 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 20 },
  ];

  accounts.forEach((acc, i) => {
    const r = 3 + i;
    const row = wsAccts.addRow([
      acc.name,
      acc.type,
      acc.openingBalance,
      { formula: `SUMIFS(Transactions!$H$3:$H$1000, Transactions!$E$3:$E$1000, A${r})` },
      { formula: `SUMIFS(Transactions!$I$3:$I$1000, Transactions!$E$3:$E$1000, A${r})` },
      { formula: `SUMIFS(Transactions!$G$3:$G$1000, Transactions!$J$3:$J$1000, "*"&A${r}&"*", Transactions!$C$3:$C$1000, "Transfer") - SUMIFS(Transactions!$G$3:$G$1000, Transactions!$E$3:$E$1000, A${r}, Transactions!$C$3:$C$1000, "Transfer")` },
      { formula: `C${r} + D${r} - E${r} + F${r}` },
    ]);
    row.font = fontData;
    row.getCell(3).numFmt = idrFormat;
    row.getCell(4).numFmt = idrFormat;
    row.getCell(5).numFmt = idrFormat;
    row.getCell(6).numFmt = idrFormat;
    row.getCell(7).numFmt = idrFormat;
  });

  // Total row
  const totalRowIndex = 3 + accounts.length;
  const totalAcctRow = wsAccts.addRow([
    'TOTAL BALANCE',
    '',
    { formula: `SUM(C3:C${totalRowIndex - 1})` },
    { formula: `SUM(D3:D${totalRowIndex - 1})` },
    { formula: `SUM(E3:E${totalRowIndex - 1})` },
    { formula: `SUM(F3:F${totalRowIndex - 1})` },
    { formula: `SUM(G3:G${totalRowIndex - 1})` },
  ]);
  totalAcctRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  totalAcctRow.fill = fillHighlight;
  totalAcctRow.getCell(3).numFmt = idrFormat;
  totalAcctRow.getCell(4).numFmt = idrFormat;
  totalAcctRow.getCell(5).numFmt = idrFormat;
  totalAcctRow.getCell(6).numFmt = idrFormat;
  totalAcctRow.getCell(7).numFmt = idrFormat;

  // ----------------------------------------------------
  // 4. SAVINGS GOALS SHEET (Tab 4)
  // ----------------------------------------------------
  const wsGoals = workbook.addWorksheet('Savings Goals');
  wsGoals.views = [{ showGridLines: true }];

  wsGoals.mergeCells('A1:F1');
  const goalsTitle = wsGoals.getCell('A1');
  goalsTitle.value = 'SAVINGS GOALS TRACKER';
  goalsTitle.font = fontTitle;

  const goalsHeader = ['Goal ID', 'Goal Name', 'Target Amount', 'Current Saved', 'Target Date', 'Progress %'];
  const goalsRow2 = wsGoals.getRow(2);
  goalsRow2.values = goalsHeader;
  goalsRow2.font = fontHeader;
  goalsRow2.fill = fillNavy;

  wsGoals.columns = [
    { width: 12 },
    { width: 26 },
    { width: 18 },
    { width: 18 },
    { width: 16 },
    { width: 14 },
  ];

  goals.forEach((g, i) => {
    const r = 3 + i;
    const row = wsGoals.addRow([
      g.id,
      g.name,
      g.targetBalance,
      g.saved,
      g.targetDate,
      { formula: `IF(C${r}>0, D${r}/C${r}, 0)` },
    ]);
    row.font = fontData;
    row.getCell(3).numFmt = idrFormat;
    row.getCell(4).numFmt = idrFormat;
    row.getCell(6).numFmt = pctFormat;
  });

  // ----------------------------------------------------
  // 5. EMERGENCY FUND SHEET (Tab 5)
  // ----------------------------------------------------
  const wsEF = workbook.addWorksheet('Emergency Fund');
  wsEF.views = [{ showGridLines: true }];

  wsEF.mergeCells('A1:D1');
  const efTitle = wsEF.getCell('A1');
  efTitle.value = 'EMERGENCY FUND CALCULATOR';
  efTitle.font = fontTitle;

  wsEF.getRow(3).values = ['Parameter', 'Value', 'Formula / Description', 'Status'];
  wsEF.getRow(3).font = fontHeader;
  wsEF.getRow(3).fill = fillNavy;

  wsEF.addRow(['Monthly Essential Expense', emergencyFund.monthlyEssentialExpense, 'Average monthly needs', 'Calculated']);
  wsEF.addRow(['Target Months of Coverage', emergencyFund.idealMonths, 'Safety buffer duration', 'Recommended: 6 mos']);
  wsEF.addRow(['Target Emergency Fund', { formula: 'B4*B5' }, '= Monthly Expenses * Months', 'Target Benchmark']);
  wsEF.addRow(['Current Amount Saved', emergencyFund.currentAmount, 'Liquid reserve balance', 'Funded']);
  wsEF.addRow(['Fund Gap (Remaining)', { formula: 'B6-B7' }, '= Target - Current Saved', 'Shortfall']);
  wsEF.addRow(['Funding Progress %', { formula: 'IF(B6>0, B7/B6, 0)' }, '= Current Saved / Target', 'Coverage Ratio']);

  for (let r = 4; r <= 9; r++) {
    const row = wsEF.getRow(r);
    row.font = fontData;
    if (r === 4 || r === 6 || r === 7 || r === 8) {
      row.getCell(2).numFmt = idrFormat;
    } else if (r === 9) {
      row.getCell(2).numFmt = pctFormat;
    }
  }
  wsEF.columns = [{ width: 28 }, { width: 20 }, { width: 30 }, { width: 22 }];

  // ----------------------------------------------------
  // 6. LISTS SHEET (Tab 6: Source of Dropdown Values)
  // ----------------------------------------------------
  const wsLists = workbook.addWorksheet('Lists');
  wsLists.views = [{ showGridLines: true }];

  wsLists.columns = [
    { header: 'Type', key: 'type', width: 18 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Account', key: 'account', width: 18 },
    { header: 'Payment Method', key: 'payment', width: 18 },
    { header: 'Purpose', key: 'purpose', width: 15 },
    { header: 'Event', key: 'event', width: 18 },
  ];

  const maxLen = Math.max(
    typesList.length,
    catsList.length,
    acctsList.length,
    paymentsList.length,
    purposesList.length,
    eventsList.length
  );

  for (let i = 0; i < maxLen; i++) {
    wsLists.addRow([
      typesList[i] || '',
      catsList[i] || '',
      acctsList[i] || '',
      paymentsList[i] || '',
      purposesList[i] || '',
      eventsList[i] || '',
    ]);
  }

  const listsHeader = wsLists.getRow(1);
  listsHeader.font = fontHeader;
  listsHeader.fill = fillNavy;

  // ----------------------------------------------------
  // 7. MONTHLY SUMMARY SHEET (Tab 7)
  // ----------------------------------------------------
  const wsMonth = workbook.addWorksheet('Monthly Summary');
  wsMonth.views = [{ state: 'frozen', ySplit: 2, showGridLines: true }];

  wsMonth.mergeCells('A1:E1');
  wsMonth.getCell('A1').value = '2026 MONTHLY CASH FLOW SUMMARY';
  wsMonth.getCell('A1').font = fontTitle;

  wsMonth.getRow(2).values = ['Month', 'Income', 'Expense', 'Cash Flow (Net)', 'Savings Rate'];
  wsMonth.getRow(2).font = fontHeader;
  wsMonth.getRow(2).fill = fillNavy;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  months.forEach((m, idx) => {
    const r = 3 + idx;
    const mNum = idx + 1;
    const row = wsMonth.addRow([
      m,
      { formula: `SUMIFS(Transactions!$H$3:$H$1000, Transactions!$A$3:$A$1000, ">="&DATE(2026,${mNum},1), Transactions!$A$3:$A$1000, "<="&EOMONTH(DATE(2026,${mNum},1),0))` },
      { formula: `SUMIFS(Transactions!$I$3:$I$1000, Transactions!$A$3:$A$1000, ">="&DATE(2026,${mNum},1), Transactions!$A$3:$A$1000, "<="&EOMONTH(DATE(2026,${mNum},1),0))` },
      { formula: `B${r}-C${r}` },
      { formula: `IF(B${r}>0, D${r}/B${r}, 0)` },
    ]);
    row.font = fontData;
    row.getCell(2).numFmt = idrFormat;
    row.getCell(3).numFmt = idrFormat;
    row.getCell(4).numFmt = idrFormat;
    row.getCell(5).numFmt = pctFormat;
  });
  wsMonth.columns = [{ width: 16 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 16 }];

  // ----------------------------------------------------
  // 8. WEEKLY SUMMARY SHEET (Tab 8)
  // ----------------------------------------------------
  const wsWeek = workbook.addWorksheet('Weekly Summary');
  wsWeek.views = [{ showGridLines: true }];

  wsWeek.mergeCells('A1:E1');
  wsWeek.getCell('A1').value = 'SEPTEMBER 2026 WEEKLY EXPENSE BREAKDOWN';
  wsWeek.getCell('A1').font = fontTitle;

  wsWeek.getRow(2).values = ['Week', 'Date Range', 'Income', 'Expense', 'Cash Flow'];
  wsWeek.getRow(2).font = fontHeader;
  wsWeek.getRow(2).fill = fillNavy;

  const weeks = [
    { w: 'W1', range: '01/09/2026 - 07/09/2026', d1: 'DATE(2026,9,1)', d2: 'DATE(2026,9,7)' },
    { w: 'W2', range: '08/09/2026 - 14/09/2026', d1: 'DATE(2026,9,8)', d2: 'DATE(2026,9,14)' },
    { w: 'W3', range: '15/09/2026 - 21/09/2026', d1: 'DATE(2026,9,15)', d2: 'DATE(2026,9,21)' },
    { w: 'W4', range: '22/09/2026 - 28/09/2026', d1: 'DATE(2026,9,22)', d2: 'DATE(2026,9,28)' },
    { w: 'W5', range: '29/09/2026 - 30/09/2026', d1: 'DATE(2026,9,29)', d2: 'DATE(2026,9,30)' },
  ];

  weeks.forEach((wk, i) => {
    const r = 3 + i;
    const row = wsWeek.addRow([
      wk.w,
      wk.range,
      { formula: `SUMIFS(Transactions!$H$3:$H$1000, Transactions!$A$3:$A$1000, ">="&${wk.d1}, Transactions!$A$3:$A$1000, "<="&${wk.d2})` },
      { formula: `SUMIFS(Transactions!$I$3:$I$1000, Transactions!$A$3:$A$1000, ">="&${wk.d1}, Transactions!$A$3:$A$1000, "<="&${wk.d2})` },
      { formula: `C${r}-D${r}` },
    ]);
    row.font = fontData;
    row.getCell(3).numFmt = idrFormat;
    row.getCell(4).numFmt = idrFormat;
    row.getCell(5).numFmt = idrFormat;
  });
  wsWeek.columns = [{ width: 10 }, { width: 24 }, { width: 18 }, { width: 18 }, { width: 18 }];

  // ----------------------------------------------------
  // 9. DEPOSITS SHEET (Tab 9)
  // ----------------------------------------------------
  const wsDep = workbook.addWorksheet('Deposits');
  wsDep.views = [{ showGridLines: true }];

  wsDep.mergeCells('A1:I1');
  wsDep.getCell('A1').value = 'DEPOSITS PORTFOLIO (MULTI-PLATFORM)';
  wsDep.getCell('A1').font = fontTitle;

  wsDep.getRow(2).values = [
    'Platform',
    'Deposit Name',
    'Principal',
    'Interest Rate',
    'Start Date',
    'Maturity Date',
    'Estimated Interest',
    'Status',
    'Notes',
  ];
  wsDep.getRow(2).font = fontHeader;
  wsDep.getRow(2).fill = fillNavy;

  deposits.forEach((dep) => {
    const row = wsDep.addRow([
      dep.platform,
      dep.name,
      dep.principal,
      (dep.interestRate / 100),
      dep.startDate,
      dep.maturityDate,
      dep.estimatedInterest,
      dep.status,
      dep.notes || '',
    ]);
    row.font = fontData;
    row.getCell(3).numFmt = idrFormat;
    row.getCell(4).numFmt = pctFormat;
    row.getCell(7).numFmt = idrFormat;
  });
  wsDep.columns = [
    { width: 16 },
    { width: 26 },
    { width: 18 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 18 },
    { width: 14 },
    { width: 30 },
  ];

  // Output Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Read and Parse an uploaded .xlsx workbook from user (Bidirectional Sync)
export async function parseExcelTransactions(file: File): Promise<Transaction[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const wsTx = workbook.getWorksheet('Transactions');
  if (!wsTx) {
    throw new Error('Spreadsheet does not contain a "Transactions" sheet. Please ensure you are uploading Sasha’s Finance Dashboard workbook.');
  }

  const transactions: Transaction[] = [];

  wsTx.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) return; // Skip title and header

    // Columns:
    // 1: Date, 2: Description, 3: Type, 4: Category, 5: Account, 6: Payment Method, 7: Amount,
    // 8: Income, 9: Expense, 10: Context, 11: Purpose, 12: Event, 13: Notes
    const dateCell = row.getCell(1).value;
    const descCell = row.getCell(2).text?.trim();
    const typeCell = row.getCell(3).text?.trim();
    const catCell = row.getCell(4).text?.trim();
    const acctCell = row.getCell(5).text?.trim();
    const pmCell = row.getCell(6).text?.trim();
    const amtCell = row.getCell(7).value;
    const contextCell = row.getCell(10).text?.trim() || '';
    const purpCell = row.getCell(11).text?.trim() || 'Need';
    const eventCell = row.getCell(12).text?.trim() || 'Personal';
    const notesCell = row.getCell(13).text?.trim() || '';

    // If completely empty row, ignore
    if (!descCell && !amtCell) return;

    // Date parsing
    let dateStr = new Date().toISOString().split('T')[0];
    if (dateCell instanceof Date) {
      dateStr = dateCell.toISOString().split('T')[0];
    } else if (typeof dateCell === 'string') {
      if (dateCell.includes('/')) {
        const parts = dateCell.split('/');
        if (parts.length === 3) {
          dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } else {
        dateStr = dateCell;
      }
    }

    // Amount parsing
    let numAmt = 0;
    if (typeof amtCell === 'number') {
      numAmt = amtCell;
    } else if (typeof amtCell === 'object' && amtCell !== null && 'result' in amtCell) {
      numAmt = Number((amtCell as any).result) || 0;
    } else if (typeof amtCell === 'string') {
      numAmt = parseFloat(amtCell.replace(/[^0-9.-]+/g, '')) || 0;
    }

    const txType = typeCell || 'Expense';
    const income = txType === 'Income' ? numAmt : 0;
    const expense = txType === 'Expense' ? numAmt : 0;

    // Parse potential destination account from context
    let toAccount: string | undefined = undefined;
    if (txType === 'Transfer' && contextCell) {
      const match = contextCell.match(/To:\s*([^,\s]+)/i);
      if (match) toAccount = match[1];
    }

    transactions.push({
      id: `tx-excel-${Date.now()}-${rowNumber}`,
      date: dateStr,
      description: descCell || 'Excel Transaction',
      type: txType,
      category: catCell || 'Other',
      account: acctCell || 'Cash',
      toAccount,
      paymentMethod: pmCell || 'Cash',
      amount: numAmt,
      income,
      expense,
      context: contextCell,
      purpose: purpCell,
      event: eventCell,
      notes: notesCell,
    });
  });

  return transactions;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
