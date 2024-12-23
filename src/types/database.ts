// Add CommissionDiscount interface
export interface CommissionDiscount {
  amount: number;
  reason: string;
  appliedAt: string;
}

// Update Sale interface to include commissionDiscounts
export interface Sale {
  id?: number;
  clientName: string;
  clientPhone?: string;
  staffId: number;
  staffName: string;
  commission: number;
  discount: number;
  subtotal: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  status: 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  commissionDiscounts?: CommissionDiscount[];
}