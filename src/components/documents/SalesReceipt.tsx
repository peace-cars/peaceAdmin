import React from 'react';
import QRCode from 'react-qr-code';

interface SalesReceiptProps {
  transaction: any;
  date: string;
}

/**
 * Sales Receipt — Enterprise Print-Ready Document
 * 
 * Apple-style minimalist layout optimized for A4 print output.
 * All sections use break-inside-avoid to prevent mid-section page breaks.
 * 
 * Financial breakdown:
 *   Subtotal (vehicle price)
 *   + VAT (15% per Ethiopian tax law)
 *   + Processing Fee (configurable)
 *   = Total Due
 *   Commission is tracked internally but NOT shown to buyer.
 */
export function SalesReceipt({ transaction, date }: SalesReceiptProps) {
  const tId = transaction?.id || 'TXN-' + Math.floor(Math.random() * 1000000);
  const price = Number(transaction?.price || 0);
  const vat = price * 0.15;
  const processingFee = Number(transaction?.processingFee || 0);
  const total = price + vat + processingFee;
  
  const vehicle = transaction?.vehicle || {};
  const qrUrl = `https://peacecars.com/verify/${vehicle.id || tId}`;

  return (
    <div className="bg-white text-black font-sans text-sm receipt-container">
      
      {/* Print-specific styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .receipt-container {
            width: 100% !important;
            max-width: none !important;
            padding: 40px !important;
            margin: 0 !important;
            font-size: 11px !important;
          }
          .receipt-container * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .receipt-break-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .receipt-no-orphan {
            orphans: 3;
            widows: 3;
          }
          @page {
            size: A4;
            margin: 15mm 20mm;
          }
        }
      `}} />

      <div className="p-10 print:p-0 max-w-[800px] mx-auto">

        {/* Header — Apple-style minimal */}
        <div className="flex justify-between items-start mb-16 receipt-break-avoid">
          <div>
            <h1 className="text-[28px] font-black tracking-tight leading-none">Peace Market</h1>
            <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-400 mt-2">Sales Receipt</p>
          </div>
          <div className="text-right flex items-start gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Receipt No.</p>
              <p className="text-lg font-mono font-black mt-0.5">{tId.substring(0, 8).toUpperCase()}</p>
              <p className="text-[10px] text-gray-400 mt-1">{date}</p>
            </div>
            <div className="border border-gray-200 p-1.5 bg-white">
              <QRCode value={qrUrl} size={56} level="M" />
            </div>
          </div>
        </div>

        {/* Parties — Clean two-column */}
        <div className="grid grid-cols-2 gap-16 mb-12 py-8 border-y border-gray-100 receipt-break-avoid">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">Buyer</p>
            <p className="text-lg font-bold leading-snug">{transaction?.buyerName || 'Walk-in Customer'}</p>
            <p className="text-gray-500 mt-1.5 text-[12px]">{transaction?.buyerPhone || 'No phone provided'}</p>
            <p className="text-gray-500 text-[12px]">{transaction?.buyerAddress || 'Addis Ababa, Ethiopia'}</p>
            {transaction?.buyerTin && (
              <p className="text-gray-500 text-[12px]">TIN: {transaction.buyerTin}</p>
            )}
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">Seller</p>
            <p className="text-lg font-bold leading-snug">Peace Cars PLC</p>
            <p className="text-gray-500 mt-1.5 text-[12px]">Branch: {vehicle.location?.name || transaction?.branchName || 'Main Showroom'}</p>
            <p className="text-gray-500 text-[12px]">Bole Road, Addis Ababa</p>
            <p className="text-gray-500 text-[12px]">VAT TIN: 0012345678</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-12 receipt-break-avoid">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold w-[45%]">Description</th>
                <th className="py-3 text-left text-[9px] uppercase tracking-[0.2em] font-bold">Plate / VIN</th>
                <th className="py-3 text-center text-[9px] uppercase tracking-[0.2em] font-bold">Qty</th>
                <th className="py-3 text-right text-[9px] uppercase tracking-[0.2em] font-bold">Amount (ETB)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-5">
                  <p className="font-bold text-[13px]">{vehicle.year || ''} {vehicle.make || ''} {vehicle.model || ''}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                    {vehicle.fuel && <p className="text-[10px] text-gray-400">{vehicle.fuel}</p>}
                    {vehicle.mileage && <p className="text-[10px] text-gray-400">{Number(vehicle.mileage).toLocaleString()} km</p>}
                    {vehicle.condition && <p className="text-[10px] text-gray-400">Grade: {vehicle.condition}</p>}
                    {vehicle.color && <p className="text-[10px] text-gray-400">{vehicle.color}</p>}
                  </div>
                </td>
                <td className="py-5">
                  <p className="font-mono text-[11px]">{vehicle.plate_code || vehicle.plate_number || '—'}</p>
                  {vehicle.vin && <p className="font-mono text-[9px] text-gray-400 mt-0.5">{vehicle.vin}</p>}
                </td>
                <td className="py-5 text-center font-bold">1</td>
                <td className="py-5 text-right font-bold tabular-nums">{price.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals — Right-aligned, clear hierarchy */}
        <div className="flex justify-end mb-16 receipt-break-avoid">
          <div className="w-72">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-bold tabular-nums">{price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">VAT (15%)</span>
                <span className="font-bold tabular-nums">{vat.toLocaleString()}</span>
              </div>
              {processingFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Processing Fee</span>
                  <span className="font-bold tabular-nums">{processingFee.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between border-t-2 border-black pt-4 mt-4">
              <span className="font-black uppercase tracking-widest text-[12px]">Total Due</span>
              <span className="font-black text-[22px] tabular-nums">{total.toLocaleString()}</span>
            </div>
            <p className="text-right text-[9px] text-gray-400 mt-1 uppercase tracking-widest">Ethiopian Birr</p>
          </div>
        </div>

        {/* Payment Method */}
        {transaction?.paymentMethod && (
          <div className="mb-12 receipt-break-avoid">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Payment Method</p>
            <p className="font-bold">{transaction.paymentMethod}</p>
            {transaction.paymentRef && (
              <p className="text-[11px] text-gray-500 mt-0.5">Ref: {transaction.paymentRef}</p>
            )}
          </div>
        )}

        {/* Terms & Signatures */}
        <div className="grid grid-cols-2 gap-16 receipt-break-avoid">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">Terms & Conditions</p>
            <div className="text-[10px] text-gray-500 leading-relaxed space-y-2 receipt-no-orphan">
              <p>1. All vehicle sales are final and subject to Peace Market standard terms of service.</p>
              <p>2. Title transfer will be initiated within 3 business days of full payment clearance.</p>
              <p>3. Vehicles are sold based on the attached evaluation report unless otherwise specified in writing.</p>
              <p>4. All government registration fees and transfer taxes are the responsibility of the buyer.</p>
              <p>5. Warranty coverage (if applicable) is detailed in a separate warranty certificate.</p>
            </div>
          </div>
          <div className="flex flex-col justify-end gap-8">
            <div>
              <div className="border-b border-black w-full mb-2 mt-8"></div>
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-center">Buyer Signature</p>
            </div>
            <div>
              <div className="border-b border-black w-full mb-2"></div>
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-center">Authorized Dealer Signature & Stamp</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-6 border-t border-gray-100 text-center receipt-break-avoid">
          <p className="text-[9px] text-gray-300 uppercase tracking-[0.2em]">Peace Market • Bole Road, Addis Ababa, Ethiopia • +251 111 22 33 44</p>
          <p className="text-[9px] text-gray-300 mt-0.5">This is an electronically generated document. Valid without wet signature when QR verified.</p>
        </div>
      </div>
    </div>
  );
}
