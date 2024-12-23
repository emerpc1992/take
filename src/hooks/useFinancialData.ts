import { useSales } from './useSales';
import { useExpenses } from './useExpenses';

export function useFinancialData() {
  const { sales } = useSales();
  const { expenses } = useExpenses();

  const completedSales = sales.filter(sale => sale.status === 'completed');
  
  const grossSales = completedSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);

  const costOfSales = completedSales.reduce((sum, sale) => {
    if (!sale.items) return sum;
    return sum + sale.items.reduce((itemSum, item) => {
      const costPrice = Number(item.costPrice) || 0;
      const quantity = Number(item.quantity) || 0;
      return itemSum + (costPrice * quantity);
    }, 0);
  }, 0);

  const totalDiscounts = completedSales.reduce((sum, sale) => sum + (Number(sale.discount) || 0), 0);

  const netSales = grossSales - totalDiscounts;

  const grossProfit = netSales - costOfSales;

  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Otros';
    const amount = Number(expense.amount) || 0;
    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);

  const operatingExpenses = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

  const operatingProfit = grossProfit - operatingExpenses;

  // Calculate total commissions and commission discounts
  const { totalCommissions, netCommissions } = completedSales.reduce((acc, sale) => {
    const baseCommission = sale.total * (sale.commission / 100);
    acc.totalCommissions += baseCommission;

    const discounts = sale.commissionDiscounts?.reduce((sum, discount) => 
      sum + Number(discount.amount), 0) || 0;
    acc.netCommissions += (baseCommission - discounts);

    return acc;
  }, { totalCommissions: 0, netCommissions: 0 });

  const netProfit = operatingProfit - netCommissions;

  const salesByPaymentMethod = completedSales.reduce((acc, sale) => {
    const method = sale.paymentMethod || 'other';
    acc[method] = (acc[method] || 0) + (Number(sale.total) || 0);
    return acc;
  }, {} as Record<string, number>);

  const paymentMethodPercentages = Object.entries(salesByPaymentMethod).reduce((acc, [method, amount]) => {
    acc[method] = (amount / grossSales) * 100;
    return acc;
  }, {} as Record<string, number>);

  return {
    grossSales,
    netSales,
    totalDiscounts,
    costOfSales,
    grossProfit,
    operatingExpenses,
    expensesByCategory,
    operatingProfit,
    totalCommissions,
    netCommissions,
    netProfit,
    totalTransactions: completedSales.length,
    averageTicket: completedSales.length > 0 ? netSales / completedSales.length : 0,
    profitMargin: netSales > 0 ? (netProfit / netSales) * 100 : 0,
    salesByPaymentMethod,
    paymentMethodPercentages
  };
}