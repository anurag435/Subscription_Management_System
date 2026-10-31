import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { RoleGuard } from '../components/layout/RoleGuard';
import { AppLayout } from '../components/layout/AppLayout';

// Auth Pages
import { Login } from '../pages/auth/Login';
import { Signup } from '../pages/auth/Signup';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { ResetPassword } from '../pages/auth/ResetPassword';

// Main App Pages
import { Dashboard } from '../pages/dashboard/Dashboard';
import { CustomerList } from '../pages/customers/CustomerList';
import { StaffList } from '../pages/staff/StaffList';
import { ProductList } from '../pages/products/ProductList';
import { PlanList } from '../pages/plans/PlanList';
import { TemplateList } from '../pages/templates/TemplateList';
import { SubscriptionList } from '../pages/subscriptions/SubscriptionList';
import { SubscriptionDetail } from '../pages/subscriptions/SubscriptionDetail';
import { InvoiceList } from '../pages/invoices/InvoiceList';
import { InvoiceDetail } from '../pages/invoices/InvoiceDetail';
import { PaymentList } from '../pages/payments/PaymentList';
import { DiscountList } from '../pages/discounts/DiscountList';
import { TaxList } from '../pages/taxes/TaxList';

// Customer Portal Pages
import { PortalSubscriptions } from '../pages/portal/PortalSubscriptions';
import { PortalInvoices } from '../pages/portal/PortalInvoices';

export const router = createBrowserRouter([
  // Public auth routes
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password/:token', element: <ResetPassword /> },

  // Protected App Routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Default redirect
          { path: '/', element: <Navigate to="/dashboard" replace /> },

          // Admin & Staff routes
          {
            element: <RoleGuard allowedRoles={['admin', 'staff']} />,
            children: [
              { path: '/dashboard', element: <Dashboard /> },
              { path: '/customers', element: <CustomerList /> },
              { path: '/products', element: <ProductList /> },
              { path: '/plans', element: <PlanList /> },
              { path: '/templates', element: <TemplateList /> },
              { path: '/subscriptions', element: <SubscriptionList /> },
              { path: '/subscriptions/:id', element: <SubscriptionDetail /> },
              { path: '/invoices', element: <InvoiceList /> },
              { path: '/invoices/:id', element: <InvoiceDetail /> },
              { path: '/payments', element: <PaymentList /> },
            ],
          },

          // Admin-only routes
          {
            element: <RoleGuard allowedRoles={['admin']} />,
            children: [
              { path: '/staff', element: <StaffList /> },
              { path: '/discounts', element: <DiscountList /> },
              { path: '/taxes', element: <TaxList /> },
            ],
          },

          // Customer portal routes
          {
            element: <RoleGuard allowedRoles={['customer']} />,
            children: [
              { path: '/portal/subscriptions', element: <PortalSubscriptions /> },
              { path: '/portal/invoices', element: <PortalInvoices /> },
            ],
          },
        ],
      },
    ],
  },

  // Fallback
  { path: '*', element: <Navigate to="/login" replace /> },
]);
