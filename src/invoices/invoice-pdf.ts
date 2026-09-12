import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

const LOGO_PATH = path.join(process.cwd(), 'logo.png');
const COMPANY_NAME = 'PT. RUBARTA PRIMA ABADI';
const COMPANY_ADDRESS = [
  'The Savoy Blok B1-20. River Garden Boulevard',
  'Jakarta Garden City, Cakung',
  'Jakarta Timur 13910',
];
const COLORS = {
  green: '#1CA84B',
  navy: '#12355B',
  gray: '#555555',
  border: '#B7B7B7',
};

function formatDate(value?: Date | string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatAmount(value: number): string {
  return (value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function generateInvoicePdf(invoice: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    const left = document.page.margins.left;
    const right = document.page.width - document.page.margins.right;
    const width = right - left;
    const infoWidth = 190;
    const infoX = right - infoWidth;

    if (fs.existsSync(LOGO_PATH)) {
      document.image(LOGO_PATH, left, 40, { width: 45 });
    }

    document
      .fillColor(COLORS.green)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(COMPANY_NAME, left + 55, 40, { width: 260 });
    document
      .fillColor(COLORS.gray)
      .font('Helvetica')
      .fontSize(8)
      .text(COMPANY_ADDRESS.join('\n'), left + 55, 58, { width: 260 });

    document
      .fillColor(COLORS.navy)
      .font('Helvetica-Bold')
      .fontSize(20)
      .text('INVOICE', infoX, 40, { width: infoWidth, align: 'right' });

    const infoRows = [
      ['No', invoice.number],
      ['Date', formatDate(invoice.date)],
      ['Due Date', formatDate(invoice.dueDate)],
      ['Reference', invoice.referenceNumber || '-'],
      ['Status', invoice.status],
    ];
    let infoY = 75;
    document.fontSize(8).lineWidth(0.5).strokeColor(COLORS.border);
    for (const [label, value] of infoRows) {
      document.rect(infoX, infoY, infoWidth, 16).stroke();
      document
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text(label, infoX + 4, infoY + 4, { width: 65 });
      document
        .font('Helvetica')
        .text(value || '-', infoX + 70, infoY + 4, { width: infoWidth - 74 });
      infoY += 16;
    }

    let y = 170;
    document
      .fillColor(COLORS.navy)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('BILL TO', left, y);
    y += 14;
    document
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(invoice.Customer?.name || '-', left, y);
    y += 13;
    document
      .font('Helvetica')
      .fontSize(8)
      .text(invoice.contactPerson || '-', left, y);
    y += 12;
    document.text(
      [invoice.contactPhone, invoice.contactEmail]
        .filter(Boolean)
        .join(' | ') || '-',
      left,
      y,
    );
    y += 28;

    const columns = [
      { label: 'NO.', width: 30, align: 'center' as const },
      { label: 'PART NO.', width: 90, align: 'left' as const },
      {
        label: 'DESCRIPTION',
        width: width - 30 - 90 - 55 - 95 - 95,
        align: 'left' as const,
      },
      { label: 'QTY', width: 55, align: 'center' as const },
      { label: 'UNIT PRICE', width: 95, align: 'right' as const },
      { label: 'AMOUNT', width: 95, align: 'right' as const },
    ];
    const rowHeight = 20;

    const drawRow = (
      values: string[],
      fill?: string,
      textColor = '#000000',
    ) => {
      let x = left;
      if (fill) document.rect(left, y, width, rowHeight).fill(fill);
      document.fillColor(textColor).fontSize(8);
      columns.forEach((column, index) => {
        document.text(values[index] || '-', x + 4, y + 6, {
          width: column.width - 8,
          align: column.align,
        });
        x += column.width;
      });
      document
        .strokeColor(COLORS.border)
        .rect(left, y, width, rowHeight)
        .stroke();
      y += rowHeight;
    };

    drawRow(
      columns.map((column) => column.label),
      COLORS.navy,
      '#FFFFFF',
    );
    (invoice.InvoiceItems || []).forEach((item: any, index: number) => {
      drawRow([
        String(index + 1),
        item.partNumber,
        item.description,
        String(item.quantity),
        formatAmount(item.unitPrice),
        formatAmount(item.totalPrice),
      ]);
    });

    y += 16;
    const totalsX = right - 220;
    const drawTotal = (label: string, value: number, bold = false) => {
      document
        .fillColor('#000000')
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(bold ? 10 : 8)
        .text(label, totalsX, y, { width: 110 });
      document.text(formatAmount(value), totalsX + 110, y, {
        width: 110,
        align: 'right',
      });
      y += bold ? 18 : 14;
    };

    drawTotal('Subtotal', invoice.totalAmount);
    drawTotal('Discount', invoice.discount);
    drawTotal('VAT', invoice.vatAmount);
    drawTotal('Grand Total', invoice.grandTotal, true);

    document
      .fillColor(COLORS.gray)
      .font('Helvetica')
      .fontSize(8)
      .text(`Payment Method: ${invoice.paymentMethod || '-'}`, left, y + 20)
      .text(`Term of Payment: ${invoice.termOfPayment || '-'}`, left, y + 34);

    document.end();
  });
}
