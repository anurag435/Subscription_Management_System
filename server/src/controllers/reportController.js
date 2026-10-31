import mongoose from 'mongoose';
import { Subscription } from '../models/Subscription.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc   Get core finance KPI metrics (Active subs, Total collected, Outstanding, Overdue count, MRR)
 * @route  GET /api/v1/reports/metrics
 * @access Admin & Staff
 */
export const getFinanceMetrics = asyncHandler(async (req, res) => {
  // 1. Active subscriptions count
  const activeSubsCountPromise = Subscription.countDocuments({ status: 'Active' });

  // 2. Total revenue collected via payments
  const revenuePromise = Payment.aggregate([
    {
      $group: {
        _id: null,
        totalCollected: { $sum: '$amount' },
        paymentCount: { $sum: 1 },
      },
    },
  ]);

  // 3. Outstanding amount from confirmed and overdue invoices
  const outstandingPromise = Invoice.aggregate([
    {
      $match: {
        status: { $in: ['Confirmed', 'Overdue'] },
        balanceDue: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: null,
        totalOutstanding: { $sum: '$balanceDue' },
        invoiceCount: { $sum: 1 },
      },
    },
  ]);

  // 4. Overdue count and amount
  const overduePromise = Invoice.aggregate([
    {
      $match: {
        $or: [
          { status: 'Overdue' },
          { status: 'Confirmed', dueDate: { $lt: new Date() }, balanceDue: { $gt: 0 } },
        ],
      },
    },
    {
      $group: {
        _id: null,
        overdueCount: { $sum: 1 },
        overdueAmount: { $sum: '$balanceDue' },
      },
    },
  ]);

  // 5. MRR Calculation using aggregation pipeline on active subscriptions
  const mrrPromise = Subscription.aggregate([
    {
      $match: { status: 'Active' },
    },
    {
      $lookup: {
        from: 'plans',
        localField: 'plan',
        foreignField: '_id',
        as: 'planDetails',
      },
    },
    {
      $unwind: '$planDetails',
    },
    {
      $project: {
        recurringSubtotal: 1,
        billingPeriod: '$planDetails.billingPeriod',
        monthlyValue: {
          $switch: {
            branches: [
              {
                case: { $eq: ['$planDetails.billingPeriod', 'daily'] },
                then: { $multiply: ['$recurringSubtotal', 30] },
              },
              {
                case: { $eq: ['$planDetails.billingPeriod', 'weekly'] },
                then: { $multiply: ['$recurringSubtotal', 4.3333] },
              },
              {
                case: { $eq: ['$planDetails.billingPeriod', 'yearly'] },
                then: { $divide: ['$recurringSubtotal', 12] },
              },
            ],
            default: '$recurringSubtotal', // monthly
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        mrr: { $sum: '$monthlyValue' },
      },
    },
  ]);

  const [
    activeSubsCount,
    revenueResult,
    outstandingResult,
    overdueResult,
    mrrResult,
  ] = await Promise.all([
    activeSubsCountPromise,
    revenuePromise,
    outstandingPromise,
    overduePromise,
    mrrPromise,
  ]);

  const totalCollected = revenueResult[0]?.totalCollected || 0;
  const paymentCount = revenueResult[0]?.paymentCount || 0;
  const totalOutstanding = outstandingResult[0]?.totalOutstanding || 0;
  const overdueCount = overdueResult[0]?.overdueCount || 0;
  const overdueAmount = overdueResult[0]?.overdueAmount || 0;
  const mrr = mrrResult[0]?.mrr || 0;
  const arr = mrr * 12;

  res.status(200).json({
    success: true,
    data: {
      activeSubscriptions: activeSubsCount,
      totalCollected: Number(totalCollected.toFixed(2)),
      paymentCount,
      totalOutstanding: Number(totalOutstanding.toFixed(2)),
      overdueCount,
      overdueAmount: Number(overdueAmount.toFixed(2)),
      mrr: Number(mrr.toFixed(2)),
      arr: Number(arr.toFixed(2)),
    },
    message: 'Finance metrics retrieved',
  });
});

/**
 * @desc   Get revenue trend chart data (aggregated by month)
 * @route  GET /api/v1/reports/revenue-trend
 * @access Admin & Staff
 */
export const getRevenueTrend = asyncHandler(async (req, res) => {
  const trend = await Payment.aggregate([
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m', date: '$paymentDate' },
        },
        revenue: { $sum: '$amount' },
        transactions: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $project: {
        _id: 0,
        month: '$_id',
        revenue: { $round: ['$revenue', 2] },
        transactions: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: trend,
    message: 'Revenue trend retrieved',
  });
});

/**
 * @desc   Get active plan distribution
 * @route  GET /api/v1/reports/plan-distribution
 * @access Admin & Staff
 */
export const getPlanDistribution = asyncHandler(async (req, res) => {
  const distribution = await Subscription.aggregate([
    {
      $match: { status: 'Active' },
    },
    {
      $lookup: {
        from: 'plans',
        localField: 'plan',
        foreignField: '_id',
        as: 'planDetails',
      },
    },
    {
      $unwind: '$planDetails',
    },
    {
      $group: {
        _id: '$planDetails.name',
        count: { $sum: 1 },
        totalValue: { $sum: '$recurringSubtotal' },
      },
    },
    {
      $project: {
        _id: 0,
        name: '$_id',
        count: 1,
        totalValue: { $round: ['$totalValue', 2] },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: distribution,
    message: 'Plan distribution retrieved',
  });
});

/**
 * @desc   Get overdue invoice list queue
 * @route  GET /api/v1/reports/overdue-invoices
 * @access Admin & Staff
 */
export const getOverdueInvoices = asyncHandler(async (req, res) => {
  const overdueList = await Invoice.find({
    $or: [
      { status: 'Overdue' },
      { status: 'Confirmed', dueDate: { $lt: new Date() }, balanceDue: { $gt: 0 } },
    ],
  })
    .populate('customer', 'name email company phone')
    .populate('subscription', 'subscriptionNumber')
    .sort({ dueDate: 1 })
    .limit(50)
    .lean();

  res.status(200).json({
    success: true,
    data: overdueList,
    message: 'Overdue invoices retrieved',
  });
});
