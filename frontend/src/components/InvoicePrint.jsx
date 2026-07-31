import React, { forwardRef } from 'react';

const InvoicePrint = forwardRef(({ cart, totals, paymentMethod, storeInfo }, ref) => {
  return (
    <div className="hidden print:block font-mono text-black bg-white p-8 w-full max-w-2xl mx-auto" ref={ref}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold uppercase">{storeInfo?.name || 'Kirana Pulse Store'}</h1>
        <p className="text-sm">{storeInfo?.address || 'Main Market Road, City'}</p>
        <p className="text-sm">GSTIN: {storeInfo?.gst_number || '27AADCB2230M1Z2'}</p>
        <p className="text-sm">Phone: {storeInfo?.contact_number || '+91 9876543210'}</p>
      </div>

      <div className="border-b-2 border-black border-dashed mb-4"></div>

      <div className="flex justify-between text-sm mb-4">
        <div>
          <p>Date: {new Date().toLocaleDateString()}</p>
          <p>Time: {new Date().toLocaleTimeString()}</p>
        </div>
        <div className="text-right">
          <p>Invoice #: INV-{Math.floor(Math.random() * 100000)}</p>
          <p>Mode: {paymentMethod}</p>
        </div>
      </div>

      <div className="border-b-2 border-black border-dashed mb-4"></div>

      {/* Items Table */}
      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1">Item</th>
            <th className="text-right py-1">Qty</th>
            <th className="text-right py-1">Price</th>
            <th className="text-right py-1">Amt</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="py-2">
                <div>{item.name}</div>
                {(item.discount > 0 || item.gst > 0) && (
                  <div className="text-xs text-gray-600">
                    {item.discount > 0 && `-${item.discount}% `}
                    {item.gst > 0 && `(GST ${item.gst}%)`}
                  </div>
                )}
              </td>
              <td className="text-right align-top py-2">{item.quantity}</td>
              <td className="text-right align-top py-2">{item.price.toFixed(2)}</td>
              <td className="text-right align-top py-2">{item.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end text-sm">
        <div className="w-48 space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{totals.totalDiscount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST:</span>
            <span>+{totals.totalGst.toFixed(2)}</span>
          </div>
          <div className="border-t-2 border-black my-1"></div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>₹{totals.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="border-b-2 border-black border-dashed my-6"></div>

      {/* Footer */}
      <div className="text-center text-sm">
        <p className="font-bold">Thank You For Shopping!</p>
        <p className="mt-1 text-xs">Please visit again.</p>
        <p className="mt-4 text-xs italic">Powered by KiranaPulse POS</p>
      </div>

      {/* CSS overrides for print */}
      <style type="text/css">
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:block, .print\\:block * {
              visibility: visible;
            }
            .print\\:block {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
});

export default InvoicePrint;
