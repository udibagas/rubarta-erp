import PDFDocument from 'pdfkit';

function formatDate(value?: Date | string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : '-';
}

function formatAmount(value: number) {
  return (value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function generatePurchaseOrderPdf(order: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const width = doc.page.width - left - doc.page.margins.right;
    doc
      .fillColor('#12355B')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('PURCHASE ORDER');
    doc.moveDown(0.5).fillColor('#000000').fontSize(10).font('Helvetica');
    doc.text(`No: ${order.number}`);
    doc.text(`Date: ${formatDate(order.date)}`);
    doc.text(`Supplier: ${order.Supplier?.name || '-'}`);
    doc.text(`Reference: ${order.referenceNumber || '-'}`);
    doc.moveDown();

    const columns = [30, 90, width - 30 - 90 - 45 - 90 - 90, 45, 90, 90];
    const headers = [
      'NO.',
      'PART NO.',
      'DESCRIPTION',
      'QTY',
      'UNIT PRICE',
      'AMOUNT',
    ];
    const drawRow = (values: string[], bold = false) => {
      const y = doc.y;
      let x = left;
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
      values.forEach((value, index) => {
        doc.rect(x, y, columns[index], 20).stroke();
        doc.text(value, x + 4, y + 6, {
          width: columns[index] - 8,
          align: index >= 3 ? 'right' : 'left',
        });
        x += columns[index];
      });
      doc.y = y + 20;
    };

    drawRow(headers, true);
    for (const [index, item] of (order.PurchaseOrderItems || []).entries()) {
      drawRow([
        String(index + 1),
        item.partNumber || '-',
        item.description || '-',
        String(item.quantity),
        formatAmount(item.unitPrice),
        formatAmount(item.totalPrice),
      ]);
    }

    doc.moveDown();
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(`Subtotal: ${formatAmount(order.totalAmount)}`, { align: 'right' });
    doc.text(`Discount: ${formatAmount(order.discount)}`, { align: 'right' });
    doc.text(`VAT: ${formatAmount(order.vatAmount)}`, { align: 'right' });
    doc.text(`Grand total: ${formatAmount(order.grandTotal)}`, {
      align: 'right',
    });
    doc.moveDown();
    doc
      .font('Helvetica')
      .fontSize(9)
      .text(`Payment: ${order.paymentMethod || '-'}`);
    doc.text(`Delivery: ${order.deliveryMethod || '-'}`);
    doc.text(`Terms: ${order.termsAndConditions || '-'}`);
    doc.end();
  });
}
