import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Plan } from '../models/Plan.js';
import { Tax } from '../models/Tax.js';
import { Discount } from '../models/Discount.js';
import { QuotationTemplate } from '../models/QuotationTemplate.js';
import { Subscription } from '../models/Subscription.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Counter } from '../utils/numberGenerators.js';

const parseArgs = () => {
  const args = process.argv.slice(2);
  let scale = 0;
  for (const arg of args) {
    if (arg.startsWith('--scale=')) {
      scale = parseInt(arg.split('=')[1], 10) || 0;
    }
  }
  return { scale };
};

const runSeed = async () => {
  try {
    const { scale } = parseArgs();
    await connectDB();

    console.log('--- Cleaning Existing Database Collections ---');
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Plan.deleteMany({}),
      Tax.deleteMany({}),
      Discount.deleteMany({}),
      QuotationTemplate.deleteMany({}),
      Subscription.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      Counter.deleteMany({}),
    ]);
    console.log('Database cleared.');

    // 1. Create Default Users (1 Admin, 2 Staff, Sample Customers)
    console.log('--- Seeding Users ---');
    const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);
    const staffPasswordHash = await bcrypt.hash('Staff@12345', 10);
    const customerPasswordHash = await bcrypt.hash('Customer@12345', 10);

    const admin = await User.create({
      name: 'Brightloop Super Admin',
      email: 'admin@brightloop.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      phone: '+1 555-0100',
      company: 'Brightloop Software HQ',
    });

    const staff1 = await User.create({
      name: 'Jessica Vance',
      email: 'staff1@brightloop.com',
      passwordHash: staffPasswordHash,
      role: 'staff',
      phone: '+1 555-0101',
    });

    const staff2 = await User.create({
      name: 'Marcus Brody',
      email: 'staff2@brightloop.com',
      passwordHash: staffPasswordHash,
      role: 'staff',
      phone: '+1 555-0102',
    });

    const sampleCustomerUsers = await User.insertMany([
      {
        name: 'Apex Innovations',
        email: 'billing@apexinnovations.io',
        passwordHash: customerPasswordHash,
        role: 'customer',
        company: 'Apex Innovations LLC',
        phone: '+1 555-0201',
        address: { street: '100 Silicon Way', city: 'San Jose', state: 'CA', zip: '95113', country: 'USA' },
      },
      {
        name: 'OmniCorp Technologies',
        email: 'accounts@omnicorp.com',
        passwordHash: customerPasswordHash,
        role: 'customer',
        company: 'OmniCorp Global Ltd',
        phone: '+1 555-0202',
        address: { street: '450 Tech Plaza', city: 'Austin', state: 'TX', zip: '78701', country: 'USA' },
      },
      {
        name: 'Zenith Health Systems',
        email: 'finance@zenithhealth.org',
        passwordHash: customerPasswordHash,
        role: 'customer',
        company: 'Zenith Health Care',
        phone: '+1 555-0203',
        address: { street: '77 Medical Center Blvd', city: 'Boston', state: 'MA', zip: '02115', country: 'USA' },
      },
      {
        name: 'Nova Media Group',
        email: 'payables@novamedia.co',
        passwordHash: customerPasswordHash,
        role: 'customer',
        company: 'Nova Digital Media',
        phone: '+1 555-0204',
        address: { street: '12 Madison Ave', city: 'New York', state: 'NY', zip: '10010', country: 'USA' },
      },
    ]);
    console.log(`Created 1 Admin, 2 Staff, and ${sampleCustomerUsers.length} Customers.`);

    // 2. Create Products with Variants
    console.log('--- Seeding Products & Variants ---');
    const products = await Product.insertMany([
      {
        name: 'Odoo ERP Sync Connector',
        type: 'service',
        salesPrice: 450,
        costPrice: 120,
        notes: 'Automated bi-directional ledger and CRM sync plugin',
        variants: [
          { attribute: 'Edition', value: 'Enterprise v17', extraPrice: 560 },
          { attribute: 'Edition', value: 'Community v17', extraPrice: 0 },
          { attribute: 'Deployment', value: 'Dedicated Cloud Agent', extraPrice: 150 },
        ],
      },
      {
        name: 'Dedicated IPv4 & DDoS Shield',
        type: 'service',
        salesPrice: 75,
        costPrice: 20,
        notes: 'High-availability static IP gateway with Layer 7 protection',
        variants: [
          { attribute: 'Bandwidth', value: '1 Gbps Burstable', extraPrice: 0 },
          { attribute: 'Bandwidth', value: '10 Gbps Uncapped', extraPrice: 120 },
        ],
      },
      {
        name: 'SSL Wildcard Security Suite',
        type: 'digital',
        salesPrice: 120,
        costPrice: 30,
        notes: 'Extended validation 2048-bit certificate with daily malware scans',
        variants: [
          { attribute: 'Validation', value: 'Organization Validated (OV)', extraPrice: 0 },
          { attribute: 'Validation', value: 'Extended Validated (EV)', extraPrice: 200 },
        ],
      },
      {
        name: '24/7 Priority Support SLA',
        type: 'service',
        salesPrice: 250,
        costPrice: 80,
        notes: 'Guaranteed 15-minute response time with dedicated Slack bridge',
        variants: [
          { attribute: 'Coverage', value: 'Standard Business Hours', extraPrice: 0 },
          { attribute: 'Coverage', value: '24/7 Follow-the-Sun', extraPrice: 300 },
        ],
      },
    ]);
    console.log(`Created ${products.length} Products with multi-attribute variants.`);

    // 3. Create Plans
    console.log('--- Seeding Billing Plans ---');
    const plans = await Plan.insertMany([
      {
        name: 'Monthly Pro Tier',
        price: 149,
        billingPeriod: 'monthly',
        minQuantity: 1,
        options: { autoCloseOnEnd: false, allowEarlyClose: true, allowPause: true, allowRenew: true },
        status: 'active',
      },
      {
        name: 'Annual Enterprise Suite',
        price: 1490,
        billingPeriod: 'yearly',
        minQuantity: 1,
        options: { autoCloseOnEnd: false, allowEarlyClose: false, allowPause: true, allowRenew: true },
        status: 'active',
      },
      {
        name: 'Weekly Growth Starter',
        price: 49,
        billingPeriod: 'weekly',
        minQuantity: 1,
        options: { autoCloseOnEnd: false, allowEarlyClose: true, allowPause: false, allowRenew: true },
        status: 'active',
      },
      {
        name: 'Daily High-Compute Sandbox',
        price: 19,
        billingPeriod: 'daily',
        minQuantity: 2,
        options: { autoCloseOnEnd: true, allowEarlyClose: true, allowPause: true, allowRenew: true },
        status: 'active',
      },
    ]);
    console.log(`Created ${plans.length} Billing Plans.`);

    // 4. Create Taxes
    console.log('--- Seeding Tax Rules ---');
    const taxes = await Tax.insertMany([
      { name: 'GST 18%', rate: 18, appliesTo: 'all', isActive: true },
      { name: 'VAT 10%', rate: 10, appliesTo: 'all', isActive: true },
      { name: 'State Tech Tax 6.5%', rate: 6.5, appliesTo: 'services', isActive: true },
    ]);
    console.log(`Created ${taxes.length} Tax Rules.`);

    // 5. Create Discounts
    console.log('--- Seeding Discount Engine Rules ---');
    const discounts = await Discount.insertMany([
      {
        name: 'Welcome 15% Launch Promo',
        type: 'percentage',
        value: 15,
        minPurchase: 100,
        minQuantity: 1,
        startDate: new Date('2026-01-01'),
        appliesTo: 'whole_subscription',
        isActive: true,
      },
      {
        name: 'Early Adopter $50 Credit',
        type: 'fixed',
        value: 50,
        minPurchase: 200,
        minQuantity: 1,
        startDate: new Date('2026-01-01'),
        usageLimit: 500,
        appliesTo: 'whole_subscription',
        isActive: true,
      },
    ]);
    console.log(`Created ${discounts.length} Discount Rules.`);

    // 6. Create Quotation Templates
    console.log('--- Seeding Quotation Templates ---');
    const templates = await QuotationTemplate.insertMany([
      {
        name: 'Odoo Enterprise Cloud Pack',
        validityDays: 30,
        plan: plans[0]._id, // Monthly Pro
        lines: [
          {
            product: products[0]._id,
            variant: products[0].variants[0], // Enterprise
            quantity: 1,
          },
          {
            product: products[1]._id,
            variant: products[1].variants[0],
            quantity: 2,
          },
        ],
      },
      {
        name: 'Enterprise Security & SLA Package',
        validityDays: 15,
        plan: plans[1]._id, // Annual Enterprise
        lines: [
          {
            product: products[2]._id,
            variant: products[2].variants[1],
            quantity: 1,
          },
          {
            product: products[3]._id,
            variant: products[3].variants[1],
            quantity: 1,
          },
        ],
      },
    ]);
    console.log(`Created ${templates.length} Quotation Templates.`);

    // 7. Seed Subscriptions, Invoices, and Payments
    const baseCount = scale > 0 ? scale : 20;
    console.log(`--- Seeding ${baseCount} Subscriptions, Invoices & Payments ---`);

    const statuses = ['Active', 'Active', 'Active', 'Confirmed', 'Quotation', 'Draft', 'Paused', 'Closed'];
    const paymentMethods = ['card', 'bank transfer', 'UPI', 'cash'];

    const subscriptionsToInsert = [];
    const now = new Date();

    for (let i = 1; i <= baseCount; i++) {
      const cust = sampleCustomerUsers[(i - 1) % sampleCustomerUsers.length];
      const plan = plans[(i - 1) % plans.length];
      const prod = products[(i - 1) % products.length];
      const variant = prod.variants[0];
      const status = statuses[(i - 1) % statuses.length];

      const subNum = `SUB-${String(i).padStart(6, '0')}`;
      const lineUnit = prod.salesPrice + (variant?.extraPrice || 0);
      const lineQty = Math.max(plan.minQuantity, 1);
      const lineTotal = lineUnit * lineQty;
      const recurringSubtotal = plan.price + lineTotal;

      const startDate = new Date(now.getTime() - (i % 60) * 24 * 60 * 60 * 1000);
      const nextBilling = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

      subscriptionsToInsert.push({
        subscriptionNumber: subNum,
        customer: cust._id,
        plan: plan._id,
        startDate,
        paymentTerms: i % 2 === 0 ? 'immediate' : 'net30',
        lines: [
          {
            product: prod._id,
            variant,
            quantity: lineQty,
            unitPrice: lineUnit,
            taxes: [taxes[0]._id],
            amount: lineTotal,
          },
        ],
        recurringSubtotal,
        status,
        nextBillingDate: status === 'Active' ? nextBilling : null,
        statusHistory: [
          {
            fromStatus: 'None',
            toStatus: status,
            changedBy: admin._id,
            note: 'Initial seed generation',
            changedAt: startDate,
          },
        ],
      });
    }

    // Insert Subscriptions in fast batches
    const insertedSubs = await Subscription.insertMany(subscriptionsToInsert, { ordered: false });
    console.log(`Successfully created ${insertedSubs.length} Subscriptions.`);

    // Generate Invoices for Confirmed, Active, and Closed subscriptions
    const invoicesToInsert = [];
    let invoiceSeq = 1;

    for (const sub of insertedSubs) {
      if (['Active', 'Confirmed', 'Closed'].includes(sub.status)) {
        const invNum = `INV-${String(invoiceSeq++).padStart(6, '0')}`;
        const subtotal = sub.recurringSubtotal;
        const discountAmt = Number(((subtotal * 15) / 100).toFixed(2));
        const taxAmt = Number((((subtotal - discountAmt) * 18) / 100).toFixed(2));
        const total = Number((subtotal - discountAmt + taxAmt).toFixed(2));

        // Distribute invoice statuses
        const isPaid = invoiceSeq % 2 === 0;
        const isOverdue = invoiceSeq % 5 === 0;
        const invStatus = isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Confirmed';

        const amountPaid = isPaid ? total : isOverdue ? 0 : Number((total * 0.4).toFixed(2));
        const balanceDue = Number((total - amountPaid).toFixed(2));

        const dueDate = isOverdue
          ? new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days in the past
          : new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days in future

        invoicesToInsert.push({
          invoiceNumber: invNum,
          subscription: sub._id,
          customer: sub.customer,
          lines: [
            {
              name: 'Monthly Tier & Deliverables',
              quantity: 1,
              unitPrice: subtotal,
              lineSubtotal: subtotal,
              lineTaxes: [{ taxId: taxes[0]._id, name: 'GST 18%', rate: 18, amount: taxAmt }],
            },
          ],
          discountsApplied: [
            { discountId: discounts[0]._id, name: 'Welcome 15% Launch Promo', type: 'percentage', amount: discountAmt },
          ],
          taxBreakdown: [
            { taxId: taxes[0]._id, name: 'GST 18%', rate: 18, amount: taxAmt },
          ],
          subtotal,
          discountTotal: discountAmt,
          taxTotal: taxAmt,
          total,
          amountPaid,
          balanceDue,
          dueDate,
          billingPeriodStart: sub.startDate,
          billingPeriodEnd: new Date(sub.startDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          status: invStatus,
        });
      }
    }

    const insertedInvoices = await Invoice.insertMany(invoicesToInsert, { ordered: false });
    console.log(`Successfully created ${insertedInvoices.length} Invoices.`);

    // Create Payments for invoices with amountPaid > 0
    const paymentsToInsert = [];
    let paymentSeq = 1;

    for (const inv of insertedInvoices) {
      if (inv.amountPaid > 0) {
        paymentsToInsert.push({
          paymentNumber: `PAY-${String(paymentSeq++).padStart(6, '0')}`,
          invoice: inv._id,
          method: paymentMethods[(paymentSeq - 1) % paymentMethods.length],
          amount: inv.amountPaid,
          paymentDate: new Date(now.getTime() - (paymentSeq % 10) * 24 * 60 * 60 * 1000),
          note: inv.status === 'Paid' ? 'Full settlement payment' : 'Initial installment',
          recordedBy: staff1._id,
        });
      }
    }

    if (paymentsToInsert.length > 0) {
      await Payment.insertMany(paymentsToInsert, { ordered: false });
      console.log(`Successfully created ${paymentsToInsert.length} Payments.`);
    }

    // Set counter seeds
    await Counter.findByIdAndUpdate('SUB', { seq: baseCount }, { upsert: true });
    await Counter.findByIdAndUpdate('INV', { seq: invoiceSeq }, { upsert: true });
    await Counter.findByIdAndUpdate('PAY', { seq: paymentSeq }, { upsert: true });

    console.log('\n============================================================');
    console.log(' SEEDING COMPLETE FOR BRIGHTLOOP SOFTWARE PLATFORM');
    console.log('============================================================');
    console.log('Demo Credentials:');
    console.log(' - Admin:    admin@brightloop.com     / Admin@12345');
    console.log(' - Staff 1:  staff1@brightloop.com    / Staff@12345');
    console.log(' - Staff 2:  staff2@brightloop.com    / Staff@12345');
    console.log(' - Customer: billing@apexinnovations.io / Customer@12345');
    console.log('============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

runSeed();
