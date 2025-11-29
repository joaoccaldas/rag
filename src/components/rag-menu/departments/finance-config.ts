/**
 * Finance Department Menu Configuration
 * Specialized menu items for Finance workflows
 */

import { 
  DollarSign, 
  Calculator, 
  FileText, 
  TrendingUp, 
  PieChart, 
  CreditCard,
  Receipt,
  Building,
  Briefcase,
  ShieldCheck,
  BarChart3,
  Activity,
  Target
} from 'lucide-react'
import type { MenuItem } from '../types'

export const FINANCE_MENU_ITEMS: MenuItem[] = [
  {
    id: 'finance-modeling',
    label: 'Financial Modeling',
    icon: Activity,
    description: 'Financial models, waterfall analysis, and scenario planning',
    department: 'finance',
    priority: 1,
    actions: [
      { 
        id: 'waterfall-bridge', 
        label: 'Waterfall Bridge Analysis', 
        icon: TrendingUp, 
        targetView: 'financial-modeling',
        actionContext: 'waterfall',
        department: 'finance'
      },
      { 
        id: 'variance-bridge', 
        label: 'Variance Bridge', 
        icon: Target, 
        targetView: 'financial-modeling',
        actionContext: 'variance-bridge',
        department: 'finance'
      },
      { 
        id: 'scenario-analysis', 
        label: 'Scenario Analysis', 
        icon: BarChart3, 
        targetView: 'financial-modeling',
        actionContext: 'scenario',
        department: 'finance'
      },
      { 
        id: 'driver-analysis', 
        label: 'Driver Analysis', 
        icon: Calculator, 
        targetView: 'financial-modeling',
        actionContext: 'drivers',
        department: 'finance'
      }
    ]
  },
  {
    id: 'finance-accounting',
    label: 'Accounting & Bookkeeping',
    icon: Calculator,
    description: 'Financial records, transactions, and account management',
    department: 'finance',
    priority: 2,
    actions: [
      { 
        id: 'general-ledger', 
        label: 'General Ledger', 
        icon: FileText, 
        targetView: 'finance-accounting',
        actionContext: 'ledger',
        department: 'finance'
      },
      { 
        id: 'accounts-payable', 
        label: 'Accounts Payable', 
        icon: CreditCard, 
        targetView: 'finance-accounting',
        actionContext: 'payable',
        department: 'finance'
      },
      { 
        id: 'accounts-receivable', 
        label: 'Accounts Receivable', 
        icon: Receipt, 
        targetView: 'finance-accounting',
        actionContext: 'receivable',
        department: 'finance'
      },
      { 
        id: 'bank-reconciliation', 
        label: 'Bank Reconciliation', 
        icon: Building, 
        targetView: 'finance-accounting',
        actionContext: 'reconciliation',
        department: 'finance'
      }
    ]
  },
  {
    id: 'finance-budgeting',
    label: 'Budgeting & Planning',
    icon: PieChart,
    description: 'Budget creation, forecasting, and financial planning',
    department: 'finance',
    priority: 3,
    actions: [
      { 
        id: 'budget-creation', 
        label: 'Budget Creation', 
        icon: Calculator, 
        targetView: 'finance-budgeting',
        actionContext: 'creation',
        department: 'finance'
      },
      { 
        id: 'budget-tracking', 
        label: 'Budget Tracking', 
        icon: TrendingUp, 
        targetView: 'finance-budgeting',
        actionContext: 'tracking',
        department: 'finance'
      },
      { 
        id: 'financial-forecasting', 
        label: 'Financial Forecasting', 
        icon: BarChart3, 
        targetView: 'finance-budgeting',
        actionContext: 'forecasting',
        department: 'finance'
      },
      { 
        id: 'variance-analysis', 
        label: 'Variance Analysis', 
        icon: PieChart, 
        targetView: 'finance-budgeting',
        actionContext: 'variance',
        department: 'finance'
      }
    ]
  },
  {
    id: 'finance-reporting',
    label: 'Financial Reporting',
    icon: FileText,
    description: 'Financial statements, reports, and compliance documentation',
    department: 'finance',
    priority: 4,
    actions: [
      { 
        id: 'income-statement', 
        label: 'Income Statement', 
        icon: TrendingUp, 
        targetView: 'finance-reporting',
        actionContext: 'income',
        department: 'finance'
      },
      { 
        id: 'balance-sheet', 
        label: 'Balance Sheet', 
        icon: Calculator, 
        targetView: 'finance-reporting',
        actionContext: 'balance',
        department: 'finance'
      },
      { 
        id: 'cash-flow', 
        label: 'Cash Flow Statement', 
        icon: DollarSign, 
        targetView: 'finance-reporting',
        actionContext: 'cashflow',
        department: 'finance'
      },
      { 
        id: 'financial-dashboard', 
        label: 'Financial Dashboard', 
        icon: BarChart3, 
        targetView: 'finance-reporting',
        actionContext: 'dashboard',
        department: 'finance'
      }
    ]
  },
  {
    id: 'finance-compliance',
    label: 'Compliance & Audit',
    icon: ShieldCheck,
    description: 'Tax compliance, audit preparation, and regulatory requirements',
    department: 'finance',
    priority: 5,
    actions: [
      { 
        id: 'tax-preparation', 
        label: 'Tax Preparation', 
        icon: FileText, 
        targetView: 'finance-compliance',
        actionContext: 'tax',
        department: 'finance'
      },
      { 
        id: 'audit-trail', 
        label: 'Audit Trail', 
        icon: ShieldCheck, 
        targetView: 'finance-compliance',
        actionContext: 'audit',
        department: 'finance'
      },
      { 
        id: 'regulatory-reporting', 
        label: 'Regulatory Reporting', 
        icon: Building, 
        targetView: 'finance-compliance',
        actionContext: 'regulatory',
        department: 'finance'
      },
      { 
        id: 'document-management', 
        label: 'Document Management', 
        icon: Briefcase, 
        targetView: 'finance-compliance',
        actionContext: 'documents',
        department: 'finance'
      }
    ]
  }
]
