import PDFDocument from 'pdfkit';
import { toCurrency } from '../helpers/number';
import { formatDate } from '../helpers/date';

export function generateQuotationPdf(quotation: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const currency = quotation.currency || 'IDR';

    doc
      .fontSize(18)
      .text('QUOTATION', { align: 'right' })
      .fontSize(10)
      .text(quotation.number, { align: 'right' })
      .moveDown(1.5);

    doc
      .fontSize(11)
      .text(
        `Date: ${quotation.date ? formatDate(new Date(quotation.date)) : '-'}`,
      )
      .text(`Valid Until: ${formatDate(new Date(quotation.validUntil))}`)
      .moveDown();

    doc
      .fontSize(12)
      .text('Customer', { underline: true })
      .fontSize(11)
      .text(quotation.Customer?.name || '-')
      .text(quotation.customerAddress || '')
      .text(`Contact: ${quotation.contactPerson || '-'}`)
      .text(`Phone: ${quotation.contactPhone || '-'}`)
      .text(`Email: ${quotation.contactEmail || '-'}`)
      .moveDown();

    doc
      .fontSize(12)
      .text(quotation.title, { underline: true })
      .fontSize(10)
      .text(quotation.description || '')
      .moveDown();

    // Items table
    const tableTop = doc.y;
    const columns = {
      no: 50,
      name: 80,
      qty: 320,
      price: 370,
      discount: 440,
      total: 500,
    };

    doc
      .fontSize(9)
      .text('No', columns.no, tableTop)
      .text('Item', columns.name, tableTop)
      .text('Qty', columns.qty, tableTop)
      .text('Price', columns.price, tableTop)
      .text('Disc', columns.discount, tableTop)
      .text('Total', columns.total, tableTop);

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    let y = tableTop + 20;

    (quotation.QuotationItems || []).forEach((item: any, index: number) => {
      doc
        .fontSize(9)
        .text(String(index + 1), columns.no, y)
        .text(
          `${item.name}${item.partNumber ? ` (${item.partNumber})` : ''}`,
          columns.name,
          y,
          {
            width: columns.qty - columns.name - 10,
          },
        )
        .text(String(item.quantity), columns.qty, y)
        .text(toCurrency(item.unitPrice, currency), columns.price, y)
        .text(toCurrency(item.discount || 0, currency), columns.discount, y)
        .text(toCurrency(item.totalPrice, currency), columns.total, y);

      y += 20;
    });

    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    doc
      .fontSize(10)
      .text('Subtotal', 400, y)
      .text(toCurrency(quotation.totalAmount, currency), columns.total, y);
    y += 15;

    if (quotation.discount) {
      doc
        .text('Discount', 400, y)
        .text(toCurrency(quotation.discount, currency), columns.total, y);
      y += 15;
    }

    if (quotation.vatAmount) {
      doc
        .text('VAT', 400, y)
        .text(toCurrency(quotation.vatAmount, currency), columns.total, y);
      y += 15;
    }

    doc
      .fontSize(11)
      .text('Grand Total', 400, y, { continued: false })
      .text(toCurrency(quotation.grandTotal, currency), columns.total, y);
    y += 25;

    if (quotation.termOfPayment) {
      doc
        .fontSize(9)
        .text(`Term of Payment: ${quotation.termOfPayment}`, 50, y);
      y += 15;
    }

    if (quotation.termOfDelivery) {
      doc
        .fontSize(9)
        .text(`Term of Delivery: ${quotation.termOfDelivery}`, 50, y);
      y += 15;
    }

    if (quotation.paymentMethod) {
      doc.fontSize(9).text(`Payment Method: ${quotation.paymentMethod}`, 50, y);
      y += 15;
    }

    if (quotation.termsAndConditions) {
      y += 10;
      doc
        .fontSize(10)
        .text('Terms and Conditions', 50, y, { underline: true })
        .fontSize(9)
        .text(quotation.termsAndConditions, 50, y + 15);
    }

    doc.end();
  });
}
