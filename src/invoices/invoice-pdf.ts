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

function formatDate(value?: Date | string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
}

function formatAmount(value: number, currency?: string): string {
  return (value || 0).toLocaleString('id-ID', {
    style: currency ? 'currency' : 'decimal',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

async function addPageNumbers(pdfBuffer: Buffer): Promise<Buffer> {
  const doc = await PdfLibDocument.load(pdfBuffer);
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);
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

  return Buffer.from(await doc.save());
}

export function generateInvoicePdf(invoice: any): Promise<Buffer> {
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
    const infoWidth = 190;
    const infoX = right - infoWidth;
    const contentTop = 250;

    const drawWatermark = () => {
      const status = String(invoice?.status ?? '')
        .trim()
        .toUpperCase();
      if (!['DRAFT', 'PAID'].includes(status)) {
        return;
      }

      const centerX = doc.page.width / 2;
      const centerY = doc.page.height / 2;

      const strokeColor = status === 'DRAFT' ? '#FF0000' : '#008000';

      doc
        .save()
        .rotate(315, { origin: [centerX, centerY] })
        .font('Helvetica-Bold')
        .fontSize(90)
        .strokeColor(strokeColor)
        .lineWidth(1.2)
        .text(status.split('').join(' '), centerX - 180, centerY - 28, {
          align: 'center',
          stroke: true,
          fill: false,
        })
        .restore();
    };

    const drawPageHeader = () => {
      const headerTop = doc.page.margins.top;

      if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, left, headerTop, { width: 45 });
      }

      doc
        .fillColor(COLORS.green)
        .font('Helvetica-Bold')
        .fontSize(13)
        .text(COMPANY.name, left + 55, headerTop, { width: 260 });
      doc
        .fillColor(COLORS.gray)
        .font('Helvetica')
        .fontSize(8)
        .text(COMPANY.address.join('\n'), left + 55, headerTop + 18, {
          width: 260,
        });

      doc
        .fillColor(COLORS.navy)
        .font('Helvetica-Bold')
        .fontSize(20)
        .text('INVOICE', infoX, headerTop, {
          width: infoWidth,
          align: 'right',
        });

      doc
        .lineWidth(0.5)
        .strokeColor(COLORS.border)
        .rect(infoX, headerTop + 32, infoWidth, 65.2)
        .stroke();

      doc.table({
        headers: [
          {
            label: 'Property',
            width: 65,
            property: 'property',
            padding: [0, 0, 0, 5],
          },
          { label: 'Value', width: 125, property: 'value' },
        ],
        data: [
          { property: 'bold:No', value: `: ${invoice.number || '-'}` },
          { property: 'bold:Date', value: `: ${formatDate(invoice.date)}` },
          { property: 'bold:Attn', value: `: ${invoice.contactPerson || '-'}` },
          { property: 'bold:Phone', value: `: ${invoice.contactPhone || '-'}` },
        ],
        options: {
          x: infoX,
          y: headerTop + 35,
          width: infoWidth,
          hideHeader: true,
        },
      });

      const partyY = 150;
      const partyColumnWidth = width / 2;
      const shipToX = left + partyColumnWidth + 65;

      doc
        .fillColor(COLORS.navy)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('BILL TO:', left, partyY, { width: partyColumnWidth });
      doc
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(invoice.Customer?.name || '-', left, partyY + 14, {
          width: partyColumnWidth,
        });
      doc
        .font('Helvetica')
        .fontSize(8)
        .text(invoice.billingAddress || '-', left, partyY + 27, {
          width: partyColumnWidth - 10,
        })
        .text('T.O.P', left, partyY + 60, { width: 48 })
        .text(`: ${invoice.termOfPayment || '-'}`, left + 48, partyY + 60, {
          width: partyColumnWidth - 58,
        })
        .text('PAYMENT', left, partyY + 72, { width: 48 })
        .text(`: ${invoice.paymentMethod || '-'}`, left + 48, partyY + 72, {
          width: partyColumnWidth - 58,
        });

      doc
        .fillColor(COLORS.navy)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('SHIP TO:', shipToX, partyY);
      doc
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(invoice.Customer?.name || '-', shipToX, partyY + 14);

      doc
        .font('Helvetica')
        .fontSize(8)
        .text(invoice.shippingAddress || '-', shipToX, partyY + 27)
        .text('Reference No', shipToX, partyY + 60)
        .text(
          `: ${invoice.referenceNumber || '-'}`,
          shipToX + 70,
          partyY + 60,
          {
            width: partyColumnWidth - 80,
          },
        )
        .text('DO No', shipToX, partyY + 72)
        .text(
          `: ${invoice.DeliveryOrder?.number || '-'}`,
          shipToX + 70,
          partyY + 72,
        )
        .text('Tax Invoice No', shipToX, partyY + 84)
        .text(
          `: ${invoice.taxInvoiceNumber || '-'}`,
          shipToX + 70,
          partyY + 84,
        );

      drawWatermark();
      doc.y = contentTop;
    };

    drawPageHeader();
    doc.on('pageAdded', drawPageHeader);

    let y = contentTop;

    const columns = [
      {
        property: 'no',
        label: 'NO.',
        width: 30,
        align: 'center' as const,
      },
      {
        property: 'partNumber',
        label: 'PART NO.',
        width: 90,
        align: 'left' as const,
      },
      {
        property: 'description',
        label: 'DESCRIPTION',
        width: width - 30 - 90 - 55 - 95 - 95,
        align: 'left' as const,
      },
      {
        property: 'quantity',
        label: 'QTY',
        width: 55,
        align: 'center' as const,
      },
      {
        property: 'unitPrice',
        label: 'UNIT PRICE',
        width: 95,
        align: 'right' as const,
      },
      {
        property: 'totalPrice',
        label: 'AMOUNT',
        width: 95,
        align: 'right' as const,
      },
    ];

    doc.table(
      {
        headers: columns,
        data: (invoice.InvoiceItems || []).map((item: any, index: number) => ({
          no: String(index + 1),
          partNumber: item.partNumber || '-',
          description: item.description || '-',
          quantity: String(item.quantity),
          unitPrice: formatAmount(item.unitPrice),
          totalPrice: formatAmount(item.totalPrice),
        })),
      },
      { y: y + 20, x: left, absolutePosition: true },
    );

    const summaryY = doc.y + 16;
    const commentsWidth = width - 240;
    const commentsHeight = 126;
    const commentsPadding = 7;
    const commentsTextWidth = commentsWidth - commentsPadding * 2;

    doc
      .lineWidth(0.75)
      .strokeColor(COLORS.gray)
      .rect(left, summaryY, commentsWidth, commentsHeight)
      .stroke();

    doc
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(
        'Others Comments Or Special Instructions',
        left + commentsPadding,
        summaryY + commentsPadding,
        {
          width: commentsTextWidth,
        },
      );

    doc
      .lineWidth(0.5)
      .moveTo(left, summaryY + 18)
      .lineTo(left + commentsWidth, summaryY + 18)
      .stroke();

    const commentX = left + commentsPadding;
    const labelWidth = 48;
    const valueX = commentX + labelWidth;
    const valueWidth = commentsTextWidth - labelWidth;
    const drawCommentRow = (
      label: string,
      value: string,
      rowY: number,
      boldValue = false,
    ) => {
      doc
        .font('Helvetica')
        .fontSize(8)
        .text(label, commentX, rowY, { width: labelWidth })
        .font(boldValue ? 'Helvetica-Bold' : 'Helvetica')
        .text(`: ${value}`, valueX, rowY, { width: valueWidth });
    };

    doc
      .font('Helvetica')
      .fontSize(8)
      .text(
        'Payment is made in FULL AMOUNT to Bank Account:',
        commentX,
        summaryY + 24,
        { width: commentsTextWidth },
      );
    drawCommentRow('Name', 'PT. RUBARTA PRIMA ABADI', summaryY + 36);
    drawCommentRow(
      'Bank',
      'UOB - KCP KELAPA GADING BOULEVARD RAYA',
      summaryY + 48,
    );
    drawCommentRow('A/C No', '5953006953', summaryY + 60, true);
    doc.text('Please Send the transfer slip to :', commentX, summaryY + 84, {
      width: commentsTextWidth,
    });
    drawCommentRow('E-mail', 'finance@rubarta.co.id', summaryY + 96);
    doc.text('Put Invoice No. for reference.', commentX, summaryY + 108, {
      width: commentsTextWidth,
    });

    doc.table(
      {
        headers: [
          { label: 'Label', property: 'label' },
          { label: 'Value', property: 'value', align: 'right' },
        ],
        data: [
          {
            label: 'bold:SUBTOTAL',
            value: `bold:${formatAmount(invoice.totalAmount, invoice.currency)}`,
          },
          {
            label: 'bold:DISCOUNT',
            value: `bold:${formatAmount(invoice.discount, invoice.currency)}`,
          },
          {
            label: 'bold:VAT',
            value: `bold:${formatAmount(invoice.vatAmount, invoice.currency)}`,
          },
          {
            label: 'bold:GRAND TOTAL',
            value: `bold:${formatAmount(invoice.grandTotal, invoice.currency)}`,
          },
        ],
      },
      {
        hideHeader: true,
        x: right - 220,
        y: summaryY,
        width: 220,
      },
    );

    y = Math.max(doc.y, summaryY + 126);

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
        `( ${(invoice.User?.name || '-').toUpperCase()} )`,
        signatureX,
        signatureY,
        { width: signatureWidth, align: 'center' },
      );

    doc.end();
  });
}
