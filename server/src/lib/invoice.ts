import PDFDocument from 'pdfkit';
import type { Response } from 'express';

interface InvoiceItem {
  productName: string;
  variantLabel: string | null;
  sku: string;
  quantity: number;
  unitPrice: string;
  gstRate: string;
  totalPrice: string;
}

interface InvoiceData {
  orderNumber: string;
  orderDate: Date;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  paymentMethod: 'RAZORPAY' | 'COD';
  paymentStatus: string;
  shippingAddress: {
    name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pinCode: string;
  };
  items: InvoiceItem[];
  subtotal: string;
  gstAmount: string;
  shippingCharge: string;
  totalAmount: string;
}

const COLORS = {
  primary: '#1A2E40',
  accent: '#B8860B',
  text: '#333333',
  muted: '#777777',
  border: '#E0E0E0',
  bg: '#F8F9FA',
  white: '#FFFFFF',
};

function drawLine(doc: PDFKit.PDFDocument, y: number, fromX: number, toX: number, color = COLORS.border) {
  doc.strokeColor(color).lineWidth(0.5).moveTo(fromX, y).lineTo(toX, y).stroke();
}

function formatCurrency(val: string | number): string {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Generate and stream a GST-compliant invoice PDF directly to the response.
 */
export function generateInvoicePDF(data: InvoiceData, res: Response): void {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Pipe directly to response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ABPATEL-Invoice-${data.orderNumber}.pdf"`);
  doc.pipe(res);

  const pageWidth = doc.page.width;
  const marginLeft = 50;
  const marginRight = pageWidth - 50;
  const contentWidth = marginRight - marginLeft;

  // ── HEADER ──
  doc.rect(marginLeft, 50, contentWidth, 70).fill(COLORS.primary);
  doc.fillColor(COLORS.white).fontSize(22).font('Helvetica-Bold').text('ABPATEL', marginLeft + 20, 65);
  doc.fillColor(COLORS.accent).fontSize(9).font('Helvetica').text('HARDWARE FITTINGS', marginLeft + 20, 90, { characterSpacing: 2 });
  doc.fillColor(COLORS.white).fontSize(16).font('Helvetica-Bold').text('TAX INVOICE', marginRight - 140, 72, { width: 120, align: 'right' });

  let y = 140;

  // ── INVOICE META ──
  const gstNumber = process.env.GST_NUMBER || '24XXXXX0000X1Z5';
  doc.fillColor(COLORS.muted).fontSize(8).font('Helvetica');
  doc.text(`GSTIN: ${gstNumber}`, marginLeft, y);
  doc.text(`Invoice No: ${data.orderNumber}`, marginRight - 200, y, { width: 200, align: 'right' });
  y += 14;
  doc.text(`Date: ${data.orderDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, marginRight - 200, y, { width: 200, align: 'right' });
  y += 24;

  // ── CUSTOMER & SHIPPING ──
  const halfWidth = contentWidth / 2 - 10;

  // Bill To
  doc.rect(marginLeft, y, halfWidth, 20).fill(COLORS.bg);
  doc.fillColor(COLORS.primary).fontSize(9).font('Helvetica-Bold').text('BILL TO', marginLeft + 8, y + 5);
  y += 24;
  doc.fillColor(COLORS.text).fontSize(9).font('Helvetica-Bold').text(data.customerName, marginLeft + 8, y);
  y += 13;
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted);
  if (data.customerEmail) { doc.text(data.customerEmail, marginLeft + 8, y); y += 11; }
  if (data.customerPhone) { doc.text(data.customerPhone, marginLeft + 8, y); y += 11; }

  // Ship To (positioned alongside Bill To)
  const shipX = marginLeft + halfWidth + 20;
  let shipY = y - (data.customerEmail ? 24 : 13) - (data.customerPhone ? 11 : 0);
  shipY = Math.max(shipY, 164); // align start

  const shipStartY = shipY - 24;
  doc.rect(shipX, shipStartY, halfWidth, 20).fill(COLORS.bg);
  doc.fillColor(COLORS.primary).fontSize(9).font('Helvetica-Bold').text('SHIP TO', shipX + 8, shipStartY + 5);
  shipY = shipStartY + 24;
  const addr = data.shippingAddress;
  doc.fillColor(COLORS.text).fontSize(9).font('Helvetica-Bold').text(addr.name, shipX + 8, shipY);
  shipY += 13;
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted);
  doc.text(addr.line1, shipX + 8, shipY); shipY += 11;
  if (addr.line2) { doc.text(addr.line2, shipX + 8, shipY); shipY += 11; }
  doc.text(`${addr.city}, ${addr.state} — ${addr.pinCode}`, shipX + 8, shipY); shipY += 11;
  doc.text(`Phone: ${addr.phone}`, shipX + 8, shipY); shipY += 11;

  y = Math.max(y, shipY) + 16;

  // ── ITEMS TABLE ──
  const colWidths = { item: contentWidth * 0.35, sku: contentWidth * 0.12, qty: contentWidth * 0.08, rate: contentWidth * 0.15, gst: contentWidth * 0.12, total: contentWidth * 0.18 };

  // Header row
  doc.rect(marginLeft, y, contentWidth, 22).fill(COLORS.primary);
  doc.fillColor(COLORS.white).fontSize(8).font('Helvetica-Bold');
  let colX = marginLeft + 8;
  doc.text('ITEM', colX, y + 6, { width: colWidths.item }); colX += colWidths.item;
  doc.text('SKU', colX, y + 6, { width: colWidths.sku }); colX += colWidths.sku;
  doc.text('QTY', colX, y + 6, { width: colWidths.qty, align: 'center' }); colX += colWidths.qty;
  doc.text('RATE', colX, y + 6, { width: colWidths.rate, align: 'right' }); colX += colWidths.rate;
  doc.text('GST', colX, y + 6, { width: colWidths.gst, align: 'center' }); colX += colWidths.gst;
  doc.text('TOTAL', colX, y + 6, { width: colWidths.total, align: 'right' });
  y += 22;

  // Item rows
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.text);
  data.items.forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) doc.rect(marginLeft, y, contentWidth, 22).fill('#FAFAFA');

    colX = marginLeft + 8;
    const itemLabel = item.variantLabel ? `${item.productName} (${item.variantLabel})` : item.productName;

    doc.fillColor(COLORS.text);
    doc.text(itemLabel, colX, y + 6, { width: colWidths.item - 8, ellipsis: true }); colX += colWidths.item;
    doc.fillColor(COLORS.muted).text(item.sku, colX, y + 6, { width: colWidths.sku }); colX += colWidths.sku;
    doc.fillColor(COLORS.text).text(item.quantity.toString(), colX, y + 6, { width: colWidths.qty, align: 'center' }); colX += colWidths.qty;
    doc.text(formatCurrency(item.unitPrice), colX, y + 6, { width: colWidths.rate, align: 'right' }); colX += colWidths.rate;
    doc.fillColor(COLORS.muted).text(`${item.gstRate}%`, colX, y + 6, { width: colWidths.gst, align: 'center' }); colX += colWidths.gst;
    doc.fillColor(COLORS.text).font('Helvetica-Bold').text(formatCurrency(item.totalPrice), colX, y + 6, { width: colWidths.total, align: 'right' });
    doc.font('Helvetica');
    y += 22;
  });

  drawLine(doc, y, marginLeft, marginRight);
  y += 16;

  // ── TOTALS ──
  const totalsX = marginRight - 200;
  const totalsLabelWidth = 120;
  const totalsValueWidth = 80;

  const drawTotalRow = (label: string, value: string, bold = false) => {
    doc.fillColor(COLORS.muted).fontSize(9).font('Helvetica').text(label, totalsX, y, { width: totalsLabelWidth });
    doc.fillColor(COLORS.text).fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica').text(value, totalsX + totalsLabelWidth, y, { width: totalsValueWidth, align: 'right' });
    y += 16;
  };

  drawTotalRow('Subtotal', formatCurrency(data.subtotal));
  drawTotalRow('GST (included)', formatCurrency(data.gstAmount));
  drawTotalRow('Shipping', parseFloat(data.shippingCharge) > 0 ? formatCurrency(data.shippingCharge) : 'Free');
  drawLine(doc, y - 4, totalsX, marginRight);
  y += 2;
  doc.rect(totalsX - 4, y - 2, 208, 22).fill(COLORS.bg);
  doc.fillColor(COLORS.primary).fontSize(11).font('Helvetica-Bold').text('TOTAL', totalsX, y + 2, { width: totalsLabelWidth });
  doc.text(formatCurrency(data.totalAmount), totalsX + totalsLabelWidth, y + 2, { width: totalsValueWidth, align: 'right' });
  y += 30;

  // ── PAYMENT INFO ──
  doc.fillColor(COLORS.muted).fontSize(8).font('Helvetica');
  const paymentLabel = data.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid via Razorpay';
  const statusLabel = data.paymentStatus === 'PAID' ? 'Paid' : 'Pending';
  doc.text(`Payment: ${paymentLabel}  |  Status: ${statusLabel}`, marginLeft, y);
  y += 24;

  // ── FOOTER ──
  drawLine(doc, y, marginLeft, marginRight, COLORS.border);
  y += 12;
  doc.fillColor(COLORS.muted).fontSize(7).font('Helvetica');
  doc.text('Thank you for shopping with ABPATEL Hardware. For queries, contact us on WhatsApp or email.', marginLeft, y, { width: contentWidth, align: 'center' });
  y += 10;
  doc.text(`© ${new Date().getFullYear()} ABPATEL Hardware Shop. All rights reserved.`, marginLeft, y, { width: contentWidth, align: 'center' });

  doc.end();
}
