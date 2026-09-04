import { RecurringTransaction, Transaction, Frequency } from './types';

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Advance a date by the specified recurrence frequency
 */
export function advanceDateByFrequency(d: Date, freq: Frequency): Date {
  const next = new Date(d.getTime());
  switch (freq) {
    case 'Daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'Weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'Bi-weekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'Monthly': {
      const targetDay = d.getDate();
      next.setMonth(next.getMonth() + 1);
      // Adjust if target day overflowed (e.g. Jan 31 -> Feb 28)
      if (next.getDate() !== targetDay) {
        next.setDate(0); // last day of previous month
      }
      break;
    }
    case 'Yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

/**
 * Get all expected occurrence dates from startDate up to cutoffDate
 */
export function getOccurrenceDates(startDateStr: string, cutoffDateStr: string, freq: Frequency): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [cy, cm, cd] = cutoffDateStr.split('-').map(Number);

  let current = new Date(sy, sm - 1, sd);
  const cutoff = new Date(cy, cm - 1, cd);

  // Safety break to prevent infinite loops
  let iterations = 0;
  while (current <= cutoff && iterations < 365) {
    dates.push(formatDateISO(current));
    current = advanceDateByFrequency(current, freq);
    iterations++;
  }

  return dates;
}

/**
 * Automatically populates transactions from active recurring items up to a cutoff date,
 * guaranteeing ZERO duplicates.
 */
export function syncRecurringTransactions(
  recurringRules: RecurringTransaction[],
  existingTransactions: Transaction[],
  cutoffDateStr: string = formatDateISO(new Date())
): {
  newTransactions: Transaction[];
  updatedRules: RecurringTransaction[];
  countAdded: number;
} {
  const generated: Transaction[] = [];
  const updatedRules = [...recurringRules];

  for (let i = 0; i < updatedRules.length; i++) {
    const rule = updatedRules[i];
    if (rule.status !== 'Active') continue;

    const occurrences = getOccurrenceDates(rule.startDate, cutoffDateStr, rule.frequency);
    let latestOccurrence: string | undefined = rule.lastGeneratedDate;

    for (const dateStr of occurrences) {
      // Check for duplicate
      const isDuplicate = existingTransactions.some(
        (tx) =>
          (tx.recurringRuleId === rule.id && tx.date === dateStr) ||
          (tx.date === dateStr &&
            tx.description === rule.description &&
            tx.amount === rule.amount &&
            tx.type === rule.type)
      ) || generated.some(
        (tx) =>
          (tx.recurringRuleId === rule.id && tx.date === dateStr) ||
          (tx.date === dateStr &&
            tx.description === rule.description &&
            tx.amount === rule.amount &&
            tx.type === rule.type)
      );

      if (!isDuplicate) {
        const income = rule.type === 'Income' ? rule.amount : 0;
        const expense = rule.type === 'Expense' ? rule.amount : 0;

        const newTx: Transaction = {
          id: `tx-rec-${rule.id}-${dateStr}`,
          date: dateStr,
          description: rule.description,
          type: rule.type,
          category: rule.category,
          account: rule.account,
          toAccount: rule.toAccount,
          paymentMethod: rule.paymentMethod,
          amount: rule.amount,
          income,
          expense,
          context: `Recurring (${rule.frequency})`,
          purpose: rule.purpose,
          event: rule.event || 'Personal',
          notes: rule.notes ? `${rule.notes} [Recurring ${rule.frequency}]` : `Auto-generated from ${rule.frequency} recurrence rule`,
          recurringRuleId: rule.id,
        };

        generated.push(newTx);
        latestOccurrence = dateStr;
      }
    }

    if (latestOccurrence && latestOccurrence !== rule.lastGeneratedDate) {
      updatedRules[i] = { ...rule, lastGeneratedDate: latestOccurrence };
    }
  }

  return {
    newTransactions: generated,
    updatedRules,
    countAdded: generated.length,
  };
}

/**
 * Get next scheduled date for a recurring rule
 */
export function getNextScheduledDate(rule: RecurringTransaction, fromDateStr: string = formatDateISO(new Date())): string {
  const [fy, fm, fd] = fromDateStr.split('-').map(Number);
  const fromDate = new Date(fy, fm - 1, fd);

  const [sy, sm, sd] = rule.startDate.split('-').map(Number);
  let current = new Date(sy, sm - 1, sd);

  let iterations = 0;
  while (current <= fromDate && iterations < 365) {
    current = advanceDateByFrequency(current, rule.frequency);
    iterations++;
  }

  return formatDateISO(current);
}
