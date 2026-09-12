import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { PDFDocument as PdfLibDocument, StandardFonts, rgb } from 'pdf-lib';
import { createPdfDocumentWithTables } from 'pdfkit-table';

const LOGO_PATH = path.join(process.cwd(), 'logo.png');

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

function formatDate(value?: Date | string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatAmount(value: number) {
  return (value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

async function addPageNumbers(pdfBuffer: Buffer): Promise<Buffer> {
  const document = await PdfLibDocument.load(pdfBuffer);
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

export function generatePurchaseOrderPdf(order: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const PDFDocumentWithTables = createPdfDocumentWithTables(PDFDocument);
    const doc = new PDFDocumentWithTables({
      size: 'A4',
      margin: 40,
      bufferPages: true,
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      addPageNumbers(Buffer.concat(chunks)).then(resolve).catch(reject);
    });
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const width = right - left;
    const infoBoxWidth = 200;
    const infoBoxX = right - infoBoxWidth;
    const contentTop = 220;
    const infoRows: [string, string][] = [
      ['No', order.number],
      ['Date', formatDate(order.date)],
      ['Reference', order.referenceNumber || '-'],
      ['Order Type', order.orderType || '-'],
      ['Payment Method', order.paymentMethod || '-'],
      ['T.O.P.', order.termOfPayment || '-'],
      ['Currency', order.currency || 'IDR'],
      ['Delivery', order.deliveryMethod || '-'],
    ];

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
        .text('PURCHASE ORDER', infoBoxX, headerTop, {
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
        .text('VENDOR', left, 120);
      doc
        .fillColor('#000000')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(order.Supplier?.name || '-', left, 132);
      doc
        .font('Helvetica')
        .fontSize(8)
        .text(order.supplierAddress || '', left, 143, {
          width: width / 2,
        });

      doc.y = contentTop;
    };

    drawPageHeader();
    doc.on('pageAdded', drawPageHeader);

    const columns = [
      { property: 'no', label: 'NO.', width: 30, align: 'center' as const },
      {
        property: 'partNumber',
        label: 'PART NO.',
        width: 90,
        align: 'left' as const,
      },
      {
        property: 'description',
        label: 'DESCRIPTION',
        width: width - 30 - 90 - 45 - 90 - 90,
        align: 'left' as const,
      },
      {
        property: 'quantity',
        label: 'QTY',
        width: 45,
        align: 'right' as const,
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
        data: (order.PurchaseOrderItems || []).map((item, index) => ({
          no: String(index + 1),
          partNumber: item.partNumber || '-',
          description: item.description || '-',
          quantity: String(item.quantity),
          unitPrice: formatAmount(item.unitPrice),
          totalPrice: formatAmount(item.totalPrice),
        })),
      },
      { y: contentTop, absolutePosition: true },
    );

    doc.moveDown();
    const discountPct =
      order.discount && order.totalAmount
        ? Math.round((order.discount / order.totalAmount) * 100)
        : 0;
    doc.table(
      {
        headers: [
          { label: 'Label', property: 'label' },
          { label: 'Value', property: 'value', align: 'right' },
        ],
        data: [
          {
            label: 'bold:SUBTOTAL',
            value: `bold:${formatAmount(order.totalAmount)}`,
          },
          {
            label: `bold:DISCOUNT (${discountPct}%)`,
            value: `bold:${formatAmount(order.discount || 0)}`,
          },
          ...(order.vatAmount
            ? [
                {
                  label: 'bold:VAT',
                  value: `bold:${formatAmount(order.vatAmount)}`,
                },
              ]
            : []),
          {
            label: 'bold:GRAND TOTAL',
            value: `bold:${formatAmount(order.grandTotal)}`,
          },
        ],
      },
      { hideHeader: true, x: right - 200, width: 200 },
    );
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
