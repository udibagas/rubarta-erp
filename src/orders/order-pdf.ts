import * as fs from 'fs';
import * as path from 'path';
import pdfkit from 'pdfkit';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createPdfDocumentWithTables } from 'pdfkit-table';

const LOGO_PATH = path.join(process.cwd(), 'logo.png');

// Static issuer info (Order model has no Company relation)
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
  border: '#808181',
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

async function addPageNumbers(pdfBuffer: Buffer): Promise<Buffer> {
  const document = await PDFDocument.load(pdfBuffer);
  const pages = document.getPages();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const fontSize = 8;

  pages.forEach((page, index) => {
    const label = `Page ${index + 1} of ${pages.length}`;
    const { width } = page.getSize();
    const labelWidth = font.widthOfTextAtSize(label, fontSize);

    page.drawText(label, {
      x: (width - labelWidth) / 2,
      y: 50,
      size: fontSize,
      font,
      color: rgb(0.33, 0.33, 0.33),
    });
  });

  return Buffer.from(await document.save());
}

export function generateOrderPdf(quotation: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const PDFDocument = createPdfDocumentWithTables(pdfkit);

    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      addPageNumbers(Buffer.concat(chunks)).then(resolve).catch(reject);
    });
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const contentWidth = right - left;
    const currency = quotation.currency || 'IDR';

    const infoBoxWidth = 200;
    const infoBoxX = right - infoBoxWidth;
    const infoRows: [string, string][] = [
      ['No', quotation.number],
      ['Date', formatDate(quotation.date)],
      ['Request Type', quotation.requestType || '-'],
      ['Delivery Method', quotation.deliveryMethod || ''],
      ['Payment Method', quotation.paymentMethod || ''],
      ['T.O.P.', quotation.termOfPayment || ''],
      ['Currency', currency],
      ['Attention', quotation.contactPerson || '-'],
      ['Phone', quotation.contactPhone || ''],
    ];

    const contentTop = 220;

    const drawPageHeader = () => {
      const headerTop = doc.page.margins.top;

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
        .text(COMPANY.address.join('\n'), left + 55, headerTop + 18, {
          width: 260,
        });

      doc
        .fillColor(COLORS.navy)
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('SALES ORDER', infoBoxX, headerTop, {
          width: infoBoxWidth,
          align: 'right',
        });

      doc
        .lineWidth(0.5)
        .strokeColor(COLORS.border)
        .moveTo(infoBoxX, headerTop + 28)
        .lineTo(infoBoxX + infoBoxWidth, headerTop + 28)
        .stroke();

      doc.table({
        headers: [
          { label: 'Property', width: 80, property: 'property' },
          { label: 'Value', width: 120, property: 'value' },
        ],
        data: infoRows.map(([label, value]) => ({
          property: `bold:${label}`,
          value,
        })),
        options: {
          x: infoBoxX,
          y: headerTop + 30,
          width: infoBoxWidth,
          hideHeader: true,
        },
      });

      doc
        .fillColor(COLORS.navy)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('CUSTOMER', left, 120);

      doc
        .fillColor('#000000')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(quotation.Customer?.name || '-', left, 132);

      doc
        .font('Helvetica')
        .fontSize(8)
        .text(quotation.customerAddress || '', left, 143, {
          width: contentWidth / 2,
        });

      doc.y = contentTop;
    };

    drawPageHeader();
    doc.on('pageAdded', drawPageHeader);

    let y = contentTop + 20;

    // ---------- Items table ----------
    const columns = [
      { property: 'no', label: 'NO.', width: 30, align: 'center' as const },
      {
        property: 'partNumber',
        label: 'PART NO.',
        width: 80,
        align: 'left' as const,
      },
      {
        property: 'description',
        label: 'DESCRIPTION',
        width: contentWidth - 30 - 80 - 45 - 90 - 90,
        align: 'left' as const,
      },
      {
        property: 'quantity',
        label: 'QTY',
        width: 45,
        align: 'center' as const,
      },
      {
        property: 'unitPrice',
        label: 'UNIT PRICE',
        width: 90,
        align: 'right' as const,
      },
      {
        property: 'totalPrice',
        label: 'AMOUNT',
        width: 90,
        align: 'right' as const,
      },
    ];

    doc.table(
      {
        headers: columns,
        data: quotation.OrderItems.map((item, index) => ({
          no: String(index + 1),
          partNumber: item.partNumber || '-',
          description: item.description || '-',
          quantity: String(item.quantity),
          unitPrice: formatAmount(item.unitPrice),
          totalPrice: formatAmount(item.totalPrice),
        })),
      },
      { y, absolutePosition: true },
    );

    const tableRowHeight = 20;

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

    doc
      .lineWidth(0.5)
      .strokeColor(COLORS.border)
      .moveTo(right - 200, doc.y - 2)
      .lineTo(right, doc.y - 2)
      .stroke();

    doc.table(
      {
        headers: [
          { label: 'Label', property: 'label' },
          {
            label: 'Value',
            property: 'value',
            align: 'right',
          },
        ],
        data: [
          {
            label: 'bold:SUBTOTAL',
            value: `bold:${formatAmount(quotation.totalAmount)}`,
          },
          {
            label: `bold:DISCOUNT (${discountPct}%)`,
            value: `bold:${formatAmount(quotation.discount || 0)}`,
          },
          ...(quotation.vatAmount
            ? [
                {
                  label: 'bold:VAT',
                  value: `bold:${formatAmount(quotation.vatAmount)}`,
                },
              ]
            : []),
          {
            label: 'bold:GRAND TOTAL',
            value: `bold:${formatAmount(quotation.grandTotal)}`,
          },
        ],
      },
      {
        hideHeader: true,
        x: right - 200,
        width: 200,
      },
    );

    y += totalsRows.length * tableRowHeight + 30;

    // ---------- Signature ----------
    const signatureWidth = 220;
    const signatureX = right - signatureWidth;
    let signatureY = doc.y + 20;

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
