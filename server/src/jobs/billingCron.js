import cron from 'node-cron';
import { generateDueInvoices } from '../services/billingService.js';
import { Invoice } from '../models/Invoice.js';

export const initCronJobs = () => {
  // 1. Recurring Billing & Auto-close Job
  // Runs daily at 00:00 (midnight)
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron Job]: Running daily recurring billing engine...');
    try {
      const summary = await generateDueInvoices();
      console.log(
        `[Cron Job Completed]: Generated: ${summary.generated}, Skipped: ${summary.skipped}, Auto-Closed: ${summary.autoClosed}`
      );
    } catch (err) {
      console.error('[Cron Job Error]: Error during recurring billing cycle:', err);
    }
  });

  // 2. Overdue Invoices Detection Job
  // Runs daily at 01:00 (1 AM)
  cron.schedule('0 1 * * *', async () => {
    console.log('[Cron Job]: Checking for overdue unpaid invoices...');
    try {
      const now = new Date();
      // Find invoices that are Confirmed, unpaid, and past dueDate
      const result = await Invoice.updateMany(
        {
          status: 'Confirmed',
          balanceDue: { $gt: 0 },
          dueDate: { $lt: now },
        },
        {
          $set: { status: 'Overdue' },
        }
      );
      console.log(`[Cron Job Completed]: Marked ${result.modifiedCount} invoices as Overdue`);
    } catch (err) {
      console.error('[Cron Job Error]: Error marking overdue invoices:', err);
    }
  });

  console.log('[Cron Jobs Initialized]: Recurring billing and overdue monitor active');
};
