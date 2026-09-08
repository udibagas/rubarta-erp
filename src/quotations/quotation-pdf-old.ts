import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

const LOGO_PATH = path.join(process.cwd(), 'logo.png');

// Static issuer info (Quotation model has no Company relation)
const COMPANY = {
  name: 'PT. RUBARTA PRIMA ABADI',
  address: [
    'The Savoy Blok B1-20. River Garden Boulevard',
    'Jakarta Garden City, Cakung',
    'Jakarta Timur 13910',
  ],
};

const COLORS = {
  green: '#1CA84B',
  navy: '#12355B',
  gray: '#555555',
  border: '#B7B7B7',
};

function formatDate(date?: Date | string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatAmount(value: number): string {
  return (value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function generateQuotationPdf(quotation: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const contentWidth = right - left;
    const currency = quotation.currency || 'IDR';

    // ---------- Header: logo + company info (left), title + info box (right) ----------
    const headerTop = doc.y;

    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, left, headerTop, { width: 45 });
    }

    doc
      .fillColor(COLORS.green)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text(COMPANY.name, left + 55, headerTop, { width: 260 });

    doc
      .fillColor(COLORS.gray)
      .fontSize(8)
      .font('Helvetica')
      .text(COMPANY.address.join('\n'), left + 55, doc.y + 2, { width: 260 });

    const infoBoxWidth = 160;
    const infoBoxX = right - infoBoxWidth;

    doc
      .fillColor(COLORS.navy)
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('QUOTATION', infoBoxX, headerTop, {
        width: infoBoxWidth,
        align: 'right',
      });

    const infoRows: [string, string][] = [
      ['No', quotation.number],
      ['Date', formatDate(quotation.date)],
      ['Valid Until', formatDate(quotation.validUntil)],
      ['Attention', quotation.contactPerson || '-'],
    ];

    const infoY = doc.y + 6;
    const infoLabelWidth = 65;
    const infoRowHeight = 16;

    doc.lineWidth(0.5).strokeColor(COLORS.border);
    infoRows.forEach(([label, value], index) => {
      const rowY = infoY + index * infoRowHeight;
      doc.rect(infoBoxX, rowY, infoBoxWidth, infoRowHeight).stroke();
      doc
        .fillColor('#000000')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(label, infoBoxX + 4, rowY + 4, { width: infoLabelWidth });
      doc.font('Helvetica').text(value, infoBoxX + infoLabelWidth, rowY + 4, {
        width: infoBoxWidth - infoLabelWidth - 4,
      });
    });

    const detailY = infoY + infoRows.length * infoRowHeight + 6;

    const detailRows: [string, string][] = [
      ['Payment Method:', quotation.paymentMethod || ''],
      ['T.O.P.:', quotation.termOfPayment || ''],
      ['Currency:', currency],
      ['Phone:', quotation.contactPhone || ''],
    ];

    detailRows.forEach(([label, value], index) => {
      const rowY = detailY + index * 12;
      doc
        .fillColor('#000000')
        .fontSize(8)
        .font('Helvetica')
        .text(label, infoBoxX, rowY, { width: 70 })
        .text(value, infoBoxX + 70, rowY, { width: infoBoxWidth - 70 });
    });

    // ---------- Customer ----------
    let y = Math.max(doc.y, detailY + detailRows.length * 12) + 20;

    doc
      .fillColor(COLORS.navy)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('CUSTOMER', left, y);
    y += 12;

    doc
      .fillColor('#000000')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(quotation.Customer?.name || '-', left, y);
    y = doc.y;

    doc
      .font('Helvetica')
      .fontSize(8)
      .text(quotation.customerAddress || '', left, y, {
        width: contentWidth / 2,
      });
    y = doc.y + 15;

    // ---------- Items table ----------
    const columns = [
      { key: 'no', label: 'NO.', width: 30, align: 'center' as const },
      {
        key: 'partNumber',
        label: 'PART NO.',
        width: 80,
        align: 'left' as const,
      },
      {
        key: 'name',
        label: 'DESCRIPTION',
        width: contentWidth - 30 - 80 - 45 - 90 - 90,
        align: 'left' as const,
      },
      { key: 'quantity', label: 'QTY', width: 45, align: 'center' as const },
      {
        key: 'unitPrice',
        label: 'UNIT PRICE',
        width: 90,
        align: 'right' as const,
      },
      {
        key: 'totalPrice',
        label: 'AMOUNT',
        width: 90,
        align: 'right' as const,
      },
    ];

    const tableRowHeight = 20;

    const drawTableRow = (
      rowY: number,
      values: string[],
      options: { bold?: boolean; fill?: string; textColor?: string } = {},
    ) => {
      let x = left;
      doc.font(options.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);

      if (options.fill) {
        doc.rect(left, rowY, contentWidth, tableRowHeight).fill(options.fill);
      }

      doc.fillColor(options.textColor || '#000000');
      columns.forEach((col, index) => {
        doc.text(values[index], x + 4, rowY + 6, {
          width: col.width - 8,
          align: col.align,
        });
        x += col.width;
      });
    };

    // Header row
    drawTableRow(
      y,
      columns.map((c) => c.label),
      { bold: true, fill: COLORS.navy, textColor: '#FFFFFF' },
    );
    y += tableRowHeight;

    doc.strokeColor(COLORS.border).lineWidth(0.5);

    (quotation.QuotationItems || []).forEach((item: any, index: number) => {
      doc.rect(left, y, contentWidth, tableRowHeight).stroke();
      drawTableRow(y, [
        String(index + 1),
        item.partNumber || '-',
        item.name,
        String(item.quantity),
        formatAmount(item.unitPrice),
        formatAmount(item.totalPrice),
      ]);
      y += tableRowHeight;
    });

    y += 10;

    // ---------- Totals ----------
    const totalsRows: [string, string][] = [
      ['SUBTOTAL', formatAmount(quotation.totalAmount)],
    ];

    const discountPct =
      quotation.discount && quotation.totalAmount
        ? Math.round((quotation.discount / quotation.totalAmount) * 100)
        : 0;
    totalsRows.push([
      `DISCOUNT (${discountPct}%)`,
      formatAmount(quotation.discount || 0),
    ]);

    if (quotation.vatAmount) {
      totalsRows.push(['VAT', formatAmount(quotation.vatAmount)]);
    }

    totalsRows.push(['GRAND TOTAL', formatAmount(quotation.grandTotal)]);

    const totalsWidth = 220;
    const totalsX = right - totalsWidth;
    const totalsLabelWidth = 120;

    totalsRows.forEach(([label, value], index) => {
      const isLast = index === totalsRows.length - 1;
      const rowY = y + index * tableRowHeight;
      doc.rect(totalsX, rowY, totalsWidth, tableRowHeight).stroke();
      doc
        .font(isLast ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(isLast ? 9 : 8)
        .fillColor('#000000')
        .text(label, totalsX + 6, rowY + 6, { width: totalsLabelWidth });
      doc.text(value, totalsX + totalsLabelWidth, rowY + 6, {
        width: totalsWidth - totalsLabelWidth - 6,
        align: 'right',
      });
    });

    y += totalsRows.length * tableRowHeight + 30;

    if (quotation.termOfDelivery || quotation.termsAndConditions) {
      doc.fontSize(8).fillColor('#000000').font('Helvetica');
      if (quotation.termOfDelivery) {
        doc.text(`Term of Delivery: ${quotation.termOfDelivery}`, left, y, {
          width: contentWidth / 2,
        });
        y = doc.y + 4;
      }
      if (quotation.termsAndConditions) {
        doc
          .font('Helvetica-Bold')
          .text('Terms and Conditions', left, y)
          .font('Helvetica')
          .text(quotation.termsAndConditions, left, doc.y + 2, {
            width: contentWidth / 2,
          });
        y = doc.y;
      }
    }

    // ---------- Signature ----------
    const signatureWidth = 220;
    const signatureX = right - signatureWidth;
    let signatureY = y + 20;

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#000000')
      .text(COMPANY.name, signatureX, signatureY, {
        width: signatureWidth,
        align: 'center',
      });

    signatureY += 50;

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(
        `( ${(quotation.User?.name || '-').toUpperCase()} )`,
        signatureX,
        signatureY,
        { width: signatureWidth, align: 'center' },
      );

    doc.end();
  });
}
