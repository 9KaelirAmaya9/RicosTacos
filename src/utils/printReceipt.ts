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
  // Inject receipt content directly into the main document and call window.print().
  // This works on iOS Safari and PWA standalone mode — calling print() on a hidden
  // off-screen iframe is silently blocked by Safari's security policy.
  const css = `
    #ricos-receipt { max-width: 300px; margin: 20px auto; padding: 20px; font-family: 'Courier New', monospace; }
    @media print {
      body > *:not(#ricos-receipt) { display: none !important; }
      #ricos-receipt { display: block !important; }
      @page { margin: 0.5in; }
    }
    .r-header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
    .r-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
    .r-info { margin: 15px 0; font-size: 12px; }
    .r-items { margin: 15px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; }
    .r-item { display: flex; justify-content: space-between; margin: 5px 0; font-size: 11px; }
    .r-item-name { flex: 1; }
    .r-item-qty { width: 30px; text-align: center; }
    .r-item-price { width: 60px; text-align: right; }
    .r-totals { margin: 15px 0; font-size: 12px; }
    .r-row { display: flex; justify-content: space-between; margin: 5px 0; }
    .r-row.grand { font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 5px; margin-top: 10px; }
    .r-footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 2px dashed #000; font-size: 10px; }
  `;

  const content = `
    <div class="r-header">
      <div class="r-name">Ricos Tacos Puebla</div>
      <div>Brooklyn, NY</div>
      <div>(718) 633-4816</div>
    </div>
    <div class="r-info">
      <div><strong>Order #:</strong> ${order.orderNumber}</div>
      <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' })}</div>
      <div><strong>Customer:</strong> ${order.customerName}</div>
      <div><strong>Type:</strong> ${order.orderType.toUpperCase()}</div>
      ${order.deliveryAddress ? `<div><strong>Address:</strong> ${order.deliveryAddress}</div>` : ''}
      ${order.notes ? `<div><strong>Notes:</strong> ${order.notes}</div>` : ''}
    </div>
    <div class="r-items">
      ${order.items.map(item => `
        <div class="r-item">
          <span class="r-item-name">${item.name}</span>
          <span class="r-item-qty">x${item.quantity}</span>
          <span class="r-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      `).join('')}
    </div>
    <div class="r-totals">
      <div class="r-row"><span>Subtotal:</span><span>$${order.subtotal.toFixed(2)}</span></div>
      <div class="r-row"><span>Tax (8.875%):</span><span>$${order.tax.toFixed(2)}</span></div>
      <div class="r-row grand"><span>TOTAL:</span><span>$${order.total.toFixed(2)}</span></div>
    </div>
    <div class="r-footer">
      <div>Thank you for your order!</div>
      <div>Follow us @RicosTacosPuebla</div>
    </div>
  `;

  // Clean up any previous receipt (e.g. rapid double-print)
  document.getElementById('ricos-receipt')?.remove();
  document.getElementById('ricos-receipt-style')?.remove();

  const style = document.createElement('style');
  style.id = 'ricos-receipt-style';
  style.textContent = css;
  document.head.appendChild(style);

  const div = document.createElement('div');
  div.id = 'ricos-receipt';
  div.innerHTML = content;
  document.body.appendChild(div);

  window.print();

  // Remove after the print dialog closes (synchronous on desktop; give extra
  // time on iOS where the dialog may linger briefly before dismissal)
  setTimeout(() => {
    document.getElementById('ricos-receipt')?.remove();
    document.getElementById('ricos-receipt-style')?.remove();
  }, 1000);
};
