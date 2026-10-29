import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import {
  getMonthDays,
  prayerLabels,
  prayerTimetableMeta,
  timetableColumns,
  timetableMonths,
} from "../src/data/prayer-times.ts";
import { bankDetails, site } from "../src/data/site.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const logoPath = path.join(root, "src/assets/images/cicc-logo.png");
const outputDirectory = path.join(root, "public/timetables");

const colours = {
  ink: "#071a16",
  emerald: "#0d644f",
  emeraldDark: "#073f35",
  mint: "#e4f3ee",
  paper: "#fbfaf6",
  sand: "#f1ecdf",
  gold: "#d3a953",
  muted: "#52635e",
  line: "#dce4df",
  white: "#ffffff",
};

const monthNameFormatter = new Intl.DateTimeFormat("en-IE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const rowDateFormatter = new Intl.DateTimeFormat("en-IE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function drawText(doc, text, x, y, options = {}) {
  doc.text(text, x, y, { lineBreak: false, ...options });
}

function drawHeader(doc, monthLabel) {
  const pageWidth = doc.page.width;
  doc.rect(0, 0, pageWidth, 106).fill(colours.ink);
  doc.rect(0, 106, pageWidth, 5).fill(colours.gold);
  doc.image(logoPath, 34, 20, { fit: [64, 64] });

  doc
    .fillColor(colours.white)
    .font("Helvetica-Bold")
    .fontSize(19);
  drawText(doc, "CARLOW MASJID", 112, 25);
  doc.font("Helvetica").fontSize(9).fillColor("#cdebe2");
  drawText(doc, site.name, 112, 50);
  drawText(
    doc,
    `${site.address.street}, ${site.address.locality}, ${site.address.postalCode}`,
    112,
    65,
  );

  doc.fillColor(colours.gold).font("Helvetica-Bold").fontSize(9);
  drawText(doc, "PRAYER START TIMETABLE", 558, 25, {
    width: 246,
    align: "right",
  });
  doc.fillColor(colours.white).fontSize(20);
  drawText(doc, monthLabel, 470, 43, {
    width: 334,
    align: "right",
  });
  doc.fillColor("#cdebe2").font("Helvetica").fontSize(8);
  drawText(doc, `${prayerTimetableMeta.timezone} · 24-hour time`, 558, 72, {
    width: 246,
    align: "right",
  });
}

function drawTable(doc, days) {
  const left = 36;
  const top = 126;
  const width = doc.page.width - left * 2;
  const dateWidth = 118;
  const timeWidth = (width - dateWidth) / timetableColumns.length;
  const headerHeight = 18;
  const rowHeight = 10;
  const columns = [
    { label: "Date", width: dateWidth },
    ...timetableColumns.map((name) => ({
      label: prayerLabels[name],
      width: timeWidth,
    })),
  ];

  let x = left;
  columns.forEach((column) => {
    doc.rect(x, top, column.width, headerHeight).fill(colours.emeraldDark);
    doc.fillColor(colours.white).font("Helvetica-Bold").fontSize(7.5);
    drawText(doc, column.label, x + 4, top + 5.2, {
      width: column.width - 8,
      align: column.label === "Date" ? "left" : "center",
    });
    x += column.width;
  });

  days.forEach((day, index) => {
    const y = top + headerHeight + index * rowHeight;
    const date = new Date(`${day.date}T12:00:00Z`);
    const isFriday = date.getUTCDay() === 5;
    const background =
      isFriday ? colours.mint : index % 2 === 0 ? colours.paper : colours.white;
    doc.rect(left, y, width, rowHeight).fill(background);
    doc
      .moveTo(left, y + rowHeight)
      .lineTo(left + width, y + rowHeight)
      .lineWidth(0.35)
      .strokeColor(colours.line)
      .stroke();

    x = left;
    doc.fillColor(colours.ink).font("Helvetica-Bold").fontSize(7.1);
    drawText(doc, rowDateFormatter.format(date), x + 4, y + 2.6, {
      width: dateWidth - 8,
    });
    x += dateWidth;

    timetableColumns.forEach((name) => {
      doc
        .moveTo(x, y)
        .lineTo(x, y + rowHeight)
        .lineWidth(0.3)
        .strokeColor(colours.line)
        .stroke();
      doc.fillColor(colours.ink).font("Helvetica").fontSize(7.1);
      drawText(doc, day[name], x + 3, y + 2.6, {
        width: timeWidth - 6,
        align: "center",
      });
      x += timeWidth;
    });
  });

  return top + headerHeight + days.length * rowHeight;
}

function drawNotes(doc, y) {
  const left = 36;
  const width = doc.page.width - left * 2;
  doc.roundedRect(left, y + 12, width, 38, 6).fill(colours.sand);
  doc.fillColor(colours.emeraldDark).font("Helvetica-Bold").fontSize(8);
  drawText(doc, "START TIMES ONLY", left + 12, y + 20);
  doc.fillColor(colours.ink).font("Helvetica").fontSize(7.4);
  doc.text(
    `Sunrise is shown for reference and is not a prayer. Jama’ah and Jumu’ah times were not supplied; contact the centre for congregation details. Source: ${prayerTimetableMeta.source}, ${prayerTimetableMeta.sourceAddress}, ${prayerTimetableMeta.sourcePhone}.`,
    left + 112,
    y + 18.5,
    { width: width - 124, lineGap: 1.2 },
  );
}

function drawFooter(doc) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const footerY = pageHeight - 88;
  doc.rect(0, footerY, pageWidth, 88).fill(colours.ink);
  doc.rect(0, footerY, pageWidth, 4).fill(colours.gold);

  doc.fillColor(colours.gold).font("Helvetica-Bold").fontSize(8);
  drawText(doc, "VISIT & CONTACT", 36, footerY + 16);
  doc.fillColor(colours.white).font("Helvetica").fontSize(7.3);
  drawText(
    doc,
    `${site.address.street}, ${site.address.locality}, ${site.address.postalCode}`,
    36,
    footerY + 31,
  );
  drawText(
    doc,
    `${site.phoneDisplay}  ·  ${site.email}  ·  carlowmasjid.ie`,
    36,
    footerY + 44,
  );
  doc.fillColor("#cdebe2").fontSize(6.8);
  drawText(
    doc,
    `Company ${site.companyNumber}  ·  Registered Charity ${site.registeredCharityNumber}`,
    36,
    footerY + 59,
  );

  doc.fillColor(colours.gold).font("Helvetica-Bold").fontSize(8);
  drawText(doc, "SUPPORT THE CENTRE", 455, footerY + 16);
  doc.fillColor(colours.white).font("Helvetica").fontSize(7.3);
  drawText(
    doc,
    bankDetails.accountName,
    455,
    footerY + 31,
  );
  drawText(
    doc,
    `${bankDetails.bankName}  ·  A/C ${bankDetails.accountNumber}  ·  Sort ${bankDetails.sortCode}`,
    455,
    footerY + 44,
  );
  drawText(
    doc,
    `IBAN ${bankDetails.iban}  ·  BIC ${bankDetails.bic}`,
    455,
    footerY + 56,
  );
  doc
    .fillColor("#cdebe2")
    .fontSize(6.8)
    .text("Donate securely: carlowmasjid.ie/projects.html#donate", 455, footerY + 69, {
      width: 350,
      link: `${site.url}/projects.html#donate`,
      underline: true,
    });
}

function generatePdf(month) {
  const days = getMonthDays(month.value);
  const monthDate = new Date(`${month.value}-15T12:00:00Z`);
  const monthLabel = monthNameFormatter.format(monthDate);
  const outputPath = path.join(root, "public", month.pdf);
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 0,
    info: {
      Title: `${monthLabel} Prayer Start Timetable — Carlow Masjid`,
      Author: site.name,
      Subject: `Verified Carlow prayer start times for ${monthLabel}`,
      Keywords: "Carlow Masjid, prayer times, salah, timetable",
    },
  });

  doc.pipe(fs.createWriteStream(outputPath));
  drawHeader(doc, monthLabel);
  const tableBottom = drawTable(doc, days);
  drawNotes(doc, tableBottom);
  drawFooter(doc);
  doc.end();
}

fs.mkdirSync(outputDirectory, { recursive: true });
timetableMonths.forEach(generatePdf);
