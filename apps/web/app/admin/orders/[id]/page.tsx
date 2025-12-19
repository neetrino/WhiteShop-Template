'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../lib/auth/AuthContext';
import { Card, Button } from '@shop/ui';
import { apiClient } from '../../../../lib/api-client';

interface OrderDetails {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
  customer?: {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
  billingAddress?: any | null;
  shippingAddress?: any | null;
  shippingMethod?: string | null;
  notes?: string | null;
  adminNotes?: string | null;
  payment?: {
    id: string;
    provider: string;
    method?: string | null;
    amount: number;
    currency: string;
    status: string;
    cardLast4?: string | null;
    cardBrand?: string | null;
  } | null;
  items: Array<{
    id: string;
    productTitle: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  createdAt: string;
  updatedAt?: string;
}

export default function OrderDetailsPage() {
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = typeof params?.id === 'string' ? params.id : '';
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number, currency: string = 'AMD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/admin');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  useEffect(() => {
    // If we somehow don't have an order id, don't call the API
    if (!orderId) {
      console.error('❌ [ADMIN][OrderDetails] Missing orderId from route params');
      setError('Order ID is missing in the URL');
      setLoading(false);
      return;
    }

    const loadOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('📂 [ADMIN][OrderDetails] Loading order details page...', { orderId });
        const response = await apiClient.get<OrderDetails>(`/api/v1/admin/orders/${orderId}`);
        console.log('✅ [ADMIN][OrderDetails] Order details loaded:', response);
        setOrder(response);
      } catch (err: any) {
        console.error('❌ [ADMIN][OrderDetails] Failed to load order details:', err);
        setError(err?.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn && isAdmin) {
      loadOrder();
    }
  }, [isLoggedIn, isAdmin, orderId]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/admin/orders')}
              className="text-gray-600 hover:text-gray-900 mb-2 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Orders
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Order Details {order ? `#${order.number}` : ''}
            </h1>
            {order && (
              <p className="mt-1 text-sm text-gray-500">
                Created at {new Date(order.createdAt).toLocaleString()}
                {order.updatedAt ? ` • Updated at ${new Date(order.updatedAt).toLocaleString()}` : ''}
              </p>
            )}
          </div>
        </div>

        {error && (
          <Card className="p-4 mb-4 border border-red-200 bg-red-50">
            <div className="text-sm text-red-700">{error}</div>
          </Card>
        )}

        {!order && !error && (
          <Card className="p-4">
            <div className="text-sm text-gray-600">Order not found.</div>
          </Card>
        )}

        {order && (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Summary</h2>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div>
                      <span className="font-medium">Order #:</span> {order.number}
                    </div>
                    <div>
                      <span className="font-medium">Total:</span>{' '}
                      {formatCurrency(order.total, order.currency || 'AMD')}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {order.status}
                    </div>
                    <div>
                      <span className="font-medium">Payment:</span> {order.paymentStatus}
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Customer</h2>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div>
                      {(order.customer?.firstName || '') +
                        (order.customer?.lastName ? ' ' + order.customer.lastName : '') ||
                        'Unknown customer'}
                    </div>
                    {order.customerPhone && <div>{order.customerPhone}</div>}
                    {order.customerEmail && <div>{order.customerEmail}</div>}
                  </div>
                </div>
              </div>
            </Card>

            {/* Addresses & Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4 md:p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Shipping Address</h2>
                {order.shippingAddress ? (
                  <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto">
                    {JSON.stringify(order.shippingAddress, null, 2)}
                  </pre>
                ) : (
                  <div className="text-sm text-gray-500">
                    <p>No shipping address</p>
                    <p>Shipping method: pickup </p>
                  </div>
                  
                )}
              </Card>

              <Card className="p-4 md:p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Payment</h2>
                {order.payment ? (
                  <div className="text-sm text-gray-700 space-y-1">
                    {order.payment.method && <div>Method: {order.payment.method}</div>}
                    <div>
                      Amount:{' '}
                      {formatCurrency(order.payment.amount, order.payment.currency || 'AMD')}
                    </div>
                    <div>Status: {order.payment.status}</div>
                    {order.payment.cardBrand && order.payment.cardLast4 && (
                      <div>
                        Card: {order.payment.cardBrand} ••••{order.payment.cardLast4}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No payment information</div>
                )}
              </Card>
            </div>

            {/* Items */}
            <Card className="p-4 md:p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Items</h2>
              {Array.isArray(order.items) && order.items.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 rounded-md">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Product</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">SKU</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">Qty</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">Price</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2">{item.productTitle}</td>
                          <td className="px-3 py-2 text-gray-500">{item.sku}</td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">
                            {formatCurrency(item.unitPrice, order.currency || 'AMD')}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatCurrency(item.total, order.currency || 'AMD')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No items found for this order</div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}


