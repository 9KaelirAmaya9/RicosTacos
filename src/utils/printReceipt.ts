interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface ReceiptData {
  orderNumber: string;
  customerName: string;
  orderType: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
}

export const printReceipt = (order: ReceiptData) => {
  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - Order ${order.orderNumber}</title>
      <style>
        @media print {
          body { margin: 0; }
          @page { margin: 0.5in; }
        }
        body {
          font-family: 'Courier New', monospace;
          max-width: 300px;
          margin: 20px auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px dashed #000;
          padding-bottom: 10px;
        }
        .restaurant-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .order-info {
          margin: 15px 0;
          font-size: 12px;
        }
        .items {
          margin: 15px 0;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 10px 0;
        }
        .item {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-size: 11px;
        }
        .item-name { flex: 1; }
        .item-qty { width: 30px; text-align: center; }
        .item-price { width: 60px; text-align: right; }
        .totals { margin: 15px 0; font-size: 12px; }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
        }
        .total-row.grand {
          font-weight: bold;
          font-size: 14px;
          border-top: 2px solid #000;
          padding-top: 5px;
          margin-top: 10px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 10px;
          border-top: 2px dashed #000;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="restaurant-name">Ricos Tacos Puebla</div>
        <div>Brooklyn, NY</div>
        <div>(718) 633-4816</div>
      </div>

      <div class="order-info">
        <div><strong>Order #:</strong> ${order.orderNumber}</div>
        <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
        <div><strong>Customer:</strong> ${order.customerName}</div>
        <div><strong>Type:</strong> ${order.orderType.toUpperCase()}</div>
        ${order.deliveryAddress ? `<div><strong>Address:</strong> ${order.deliveryAddress}</div>` : ''}
        ${order.notes ? `<div><strong>Notes:</strong> ${order.notes}</div>` : ''}
      </div>

      <div class="items">
        ${order.items.map(item => `
          <div class="item">
            <span class="item-name">${item.name}</span>
            <span class="item-qty">x${item.quantity}</span>
            <span class="item-price">$${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>$${order.subtotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>Tax (8.875%):</span>
          <span>$${order.tax.toFixed(2)}</span>
        </div>
        <div class="total-row grand">
          <span>TOTAL:</span>
          <span>$${order.total.toFixed(2)}</span>
        </div>
      </div>

      <div class="footer">
        <div>Thank you for your order!</div>
        <div>Follow us @RicosTacosPuebla</div>
      </div>
    </body>
    </html>
  `;

  // Use a hidden iframe instead of window.open so popup blockers don't interfere.
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(receiptHTML);
  doc.close();

  // Wait for fonts/styles to load before printing
  iframe.contentWindow?.addEventListener('load', () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    // Clean up after the print dialog closes
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  });
};
