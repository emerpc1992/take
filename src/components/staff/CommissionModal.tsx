import React, { useState } from 'react';
import { Staff } from '../../types/database';
import { useSales } from '../../hooks/useSales';
import { MinusCircle, Trash2 } from 'lucide-react';
import CommissionDiscountModal from './CommissionDiscountModal';
import { formatAmount } from '../../utils/formatters';

interface CommissionModalProps {
  staff: Staff;
  onClose: () => void;
}

export default function CommissionModal({ staff, onClose }: CommissionModalProps) {
  const { sales, addCommissionDiscount, clearStaffCommissions } = useSales();
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  
  // Get completed sales for this staff member
  const staffSales = sales.filter(sale => 
    sale.staffId === staff.id && 
    sale.status === 'completed'
  );

  // Calculate totals
  const totalSales = staffSales.reduce((sum, sale) => sum + sale.total, 0);
  
  // Calculate base commission (before discounts)
  const baseCommission = staffSales.reduce((sum, sale) => 
    sum + (sale.total * (sale.commission / 100)), 0
  );

  // Calculate total discounts
  const totalDiscounts = staffSales.reduce((sum, sale) => {
    const saleDiscounts = sale.commissionDiscounts || [];
    return sum + saleDiscounts.reduce((discountSum, discount) => 
      discountSum + Number(discount.amount), 0
    );
  }, 0);

  // Calculate final commission (after discounts)
  const finalCommission = baseCommission - totalDiscounts;

  const handleApplyDiscount = async (data: { amount: number; reason: string }) => {
    try {
      await addCommissionDiscount(staff.id!, {
        amount: Number(data.amount),
        reason: data.reason
      });
      setShowDiscountModal(false);
    } catch (error) {
      console.error('Error applying discount:', error);
      alert('Error al aplicar el descuento');
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('¿Está seguro de borrar todo el historial de comisiones? Esta acción no se puede deshacer.')) {
      try {
        await clearStaffCommissions(staff.id!);
        onClose();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-xl font-bold mb-4">
          Reporte de Comisiones - {staff.name}
        </h2>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total en Ventas</p>
            <p className="text-2xl font-bold text-gray-900">
              ${formatAmount(totalSales)}
            </p>
          </div>
          <div className="bg-pink-50 p-4 rounded-lg">
            <p className="text-sm text-pink-600">Comisiones Brutas</p>
            <p className="text-2xl font-bold text-pink-600">
              ${formatAmount(baseCommission)}
            </p>
            {totalDiscounts > 0 && (
              <p className="text-sm text-red-600 mt-1">
                -${formatAmount(totalDiscounts)} (descuentos)
              </p>
            )}
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600">Comisión Final</p>
            <p className="text-2xl font-bold text-green-600">
              ${formatAmount(finalCommission)}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Detalle de Ventas</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDiscountModal(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700"
              disabled={finalCommission <= 0}
            >
              <MinusCircle className="h-4 w-4 mr-2" />
              Aplicar Descuento
            </button>
            <button
              onClick={handleClearHistory}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Borrar Historial
            </button>
          </div>
        </div>

        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Fecha</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Cliente</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Total Venta</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">% Comisión</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Comisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {staffSales.map((sale) => {
                const saleCommission = sale.total * (sale.commission / 100);
                const saleDiscounts = sale.commissionDiscounts?.reduce((sum, discount) => 
                  sum + Number(discount.amount), 0) || 0;
                const netCommission = saleCommission - saleDiscounts;

                return (
                  <tr key={sale.id}>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {sale.clientName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                      ${formatAmount(sale.total)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                      {sale.commission}%
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium">
                      <span className="text-pink-600">
                        ${formatAmount(saleCommission)}
                      </span>
                      {saleDiscounts > 0 && (
                        <>
                          <br />
                          <span className="text-red-600 text-xs">
                            -${formatAmount(saleDiscounts)}
                          </span>
                          <br />
                          <span className="text-green-600">
                            =${formatAmount(netCommission)}
                          </span>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalDiscounts > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Descuentos Aplicados</h3>
            <div className="bg-red-50 rounded-lg p-4">
              {staffSales.map((sale) => (
                sale.commissionDiscounts?.map((discount, index) => (
                  <div key={`${sale.id}-${index}`} className="flex justify-between items-center py-2">
                    <div>
                      <p className="text-red-600 font-medium">-${formatAmount(Number(discount.amount))}</p>
                      <p className="text-sm text-gray-600">{discount.reason}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(discount.appliedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ))}
              <div className="mt-2 pt-2 border-t border-red-200">
                <p className="text-red-600 font-medium">
                  Total Descuentos: -${formatAmount(totalDiscounts)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cerrar
          </button>
        </div>

        {showDiscountModal && (
          <CommissionDiscountModal
            onSubmit={handleApplyDiscount}
            onClose={() => setShowDiscountModal(false)}
            maxAmount={finalCommission}
          />
        )}
      </div>
    </div>
  );
}