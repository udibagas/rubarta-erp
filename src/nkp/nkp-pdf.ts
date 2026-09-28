import PDFDocument from 'pdfkit';
import { PDFDocument as PdfLibDocument, StandardFonts, rgb } from 'pdf-lib';
import { createPdfDocumentWithTables } from 'pdfkit-table';
import { formatDateNumeric } from '../helpers/date';
import { terbilang, toDecimal } from '../helpers/number';

const ACTIONS: Record<string, string> = {
  APPROVAL: 'APPROVED BY',
  VERIFICATION: 'VERIFIED BY',
  AUTHORIZATION: 'AUTHORIZED BY',
};

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
      y: 30,
      size: fontSize,
      font,
      color: rgb(0.33, 0.33, 0.33),
    });
  });

  return Buffer.from(await document.save());
}

export function generateNkpPdf(data: any): Promise<Buffer> {
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
    const contentTop = 145;
    const currency = data.currency || 'IDR';
    const decimals = currency === 'IDR' ? 0 : 2;

    const drawPageHeader = () => {
      const top = doc.page.margins.top;

      doc
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .fontSize(16)
        .text('NOTA KUASA PEMBAYARAN', left, top, {
          width,
          align: 'center',
        });

      doc
        .fontSize(12)
        .text((data.Company?.name || '').toUpperCase(), left, top + 20, {
          width,
          align: 'center',
        });

      doc
        .moveTo(left, top + 42)
        .lineTo(right, top + 42)
        .lineWidth(1)
        .strokeColor('#808181')
        .stroke();

      doc
        .lineWidth(0.5)
        .strokeColor('#808181')
        .rect(left, top + 48.5, 250, 32)
        .stroke();

      doc.table(
        {
          headers: [
            {
              label: 'Property',
              property: 'property',
              width: 70,
              padding: [0, 2, 0, 2],
            },
            {
              label: 'Value',
              property: 'value',
              width: 180,
              padding: [0, 2, 0, 2],
            },
          ],
          data: [
            { property: 'bold:NKP NO', value: `: ${data.number}` },
            {
              property: 'bold:NKP DATE',
              value: `: ${formatDateNumeric(new Date(data.date))}`,
            },
          ],
        },
        { x: left, y: top + 50, width: 250, hideHeader: true },
      );

      doc.y = contentTop;
    };

    drawPageHeader();
    doc.on('pageAdded', drawPageHeader);

    const partyLabel = data.paymentType;
    const partyName =
      data.paymentType === 'EMPLOYEE'
        ? data.Employee?.name?.toUpperCase()
        : data.Supplier?.name?.toUpperCase();

    const detailRows: [string, string][] = [
      ['COMPANY', data.Company?.name || '-'],
      ['TYPE', `${data.paymentType} / ${data.nkpType}`],
      [partyLabel, partyName || '-'],
      ['BANK NAME', `${data.Bank?.code || ''} - ${data.Bank?.name || ''}`],
      ['CURRENCY', currency],
      ['BANK ACCOUNT', data.bankAccount || '-'],
      ['BANK REF NO', data.bankRefNo || '-'],
      ['DESCRIPTION', data.description || '-'],
    ];

    const detailTop = doc.y;

    doc
      .lineWidth(0.5)
      .strokeColor('#808181')
      .rect(left, detailTop - 2.9, width, detailRows.length * 16)
      .stroke();

    doc.table(
      {
        headers: [
          {
            label: 'Property',
            property: 'property',
            width: 120,
            padding: [0, 0, 0, 5],
          },
          {
            label: 'Value',
            property: 'value',
            width: width - 120,
            padding: [0, 0, 0, 5],
          },
        ],
        data: detailRows.map(([label, value]) => ({
          property: `bold:${label}`,
          value: `: ${value}`,
        })),
      },
      { x: left, y: detailTop, width, hideHeader: true },
    );

    doc.moveDown(0.8);

    const itemColumns = [
      { property: 'no', label: 'NO', width: 30, align: 'center' as const },
      {
        property: 'date',
        label: 'DATE',
        width: 70,
        align: 'center' as const,
      },
      {
        property: 'description',
        label: 'DESCRIPTION',
        width: width - 30 - 70 - 90 - 55,
        align: 'left' as const,
      },
      {
        property: 'amount',
        label: 'AMOUNT',
        width: 90,
        align: 'right' as const,
      },
      {
        property: 'currency',
        label: 'CURR',
        width: 55,
        align: 'center' as const,
      },
    ];

    doc.table(
      {
        headers: itemColumns,
        data: (data.NkpItem || []).map((item, index) => ({
          no: String(index + 1),
          date: formatDateNumeric(new Date(item.date)),
          description: item.description,
          amount: toDecimal(item.amount, decimals),
          currency: item.currency,
        })),
      },
      { x: left, width },
    );

    doc.moveDown(0.5);

    const totalsRows: [string, number][] = [['GRAND TOTAL', data.grandTotal]];

    if (data.paymentType === 'VENDOR') {
      totalsRows.push(['TAX', data.tax]);
      totalsRows.push(['DEDUCTION', data.deduction]);
      totalsRows.push(['NET AMOUNT', data.netAmount]);

      if (data.nkpType === 'SETTLEMENT') {
        totalsRows.push(['DOWN PAYMENT', data.downPayment]);
      }
    }

    if (data.paymentType === 'EMPLOYEE') {
      if (data.cashAdvanceBalance) {
        totalsRows.push(['CASH ADVANCE BALANCE', data.cashAdvanceBalance]);
      }

      if (data.nkpType === 'CASH_ADVANCE') {
        totalsRows.push(['TRANSFER KE KARYAWAN', Math.abs(data.finalPayment)]);
      }

      if (data.nkpType === 'DECLARATION') {
        totalsRows.push([
          `KEMBALI KE ${data.finalPayment > 0 ? 'KARYAWAN' : 'PERUSAHAAN'}`,
          Math.abs(data.finalPayment),
        ]);
      }
    }

    if (data.paymentType === 'VENDOR') {
      totalsRows.push(['FINAL PAYMENT', data.finalPayment]);
    }

    const totalsWidth = width / 2;
    const totalsX = right - totalsWidth;
    const totalsTop = doc.y;

    doc
      .lineWidth(0.5)
      .strokeColor('#808181')
      .rect(totalsX, totalsTop - 1.7, totalsWidth, totalsRows.length * 16)
      .stroke();

    doc.table(
      {
        headers: [
          {
            label: 'Label',
            property: 'label',
            width: totalsWidth - 120,
            align: 'right' as const,
            padding: [0, 0, 0, 5],
          },
          {
            label: 'Value',
            property: 'value',
            width: 120,
            align: 'right' as const,
            padding: [0, 5, 0, 0],
          },
        ],
        data: totalsRows.map(([label, value]) => ({
          label: `bold:${label}`,
          value: `bold:${toDecimal(value, decimals)} ${currency}`,
        })),
      },
      { x: totalsX, y: totalsTop, width: totalsWidth, hideHeader: true },
    );

    doc.moveDown(0.3);
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(
        `TERBILANG: ${terbilang(data.finalPayment).toUpperCase()}`,
        left,
        doc.y,
        { width },
      );

    const approvals = data.NkpApproval || [];

    if (approvals.length) {
      doc.moveDown(1.5);
      const boxHeight = 110;
      const boxWidth = width / approvals.length;
      const boxTop = doc.y;

      approvals.forEach((approval: any, index: number) => {
        const boxX = left + index * boxWidth;

        doc
          .lineWidth(0.5)
          .strokeColor('#808181')
          .rect(boxX, boxTop - 2.9, boxWidth, boxHeight)
          .stroke();

        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .text(
            ACTIONS[approval.approvalActionType] || approval.approvalActionType,
            boxX,
            boxTop + 6,
            { width: boxWidth, align: 'center' },
          );

        doc
          .moveTo(boxX, boxTop + 22)
          .lineTo(boxX + boxWidth, boxTop + 22)
          .stroke();

        doc
          .font('Helvetica')
          .fontSize(8)
          .text(
            approval.approvalStatus === 'APPROVED' ? 'APPROVED' : 'PENDING',
            boxX,
            boxTop + 50,
            { width: boxWidth, align: 'center' },
          );

        doc
          .fontSize(7)
          .text(
            approval.approvalStatus
              ? formatDateNumeric(new Date(approval.updatedAt))
              : '-',
            boxX,
            boxTop + 80,
            { width: boxWidth, align: 'center' },
          );

        doc
          .moveTo(boxX, boxTop + 90)
          .lineTo(boxX + boxWidth, boxTop + 90)
          .stroke();

        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .text(`(${approval.User?.name || ''})`, boxX, boxTop + 94, {
            width: boxWidth,
            align: 'center',
          });
      });

      doc.y = boxTop + boxHeight;
    }

    doc.end();
  });
}
