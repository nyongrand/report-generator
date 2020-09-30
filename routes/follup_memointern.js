var express = require("express");
var router = express.Router();

var PdfPrinter = require("pdfmake");

router.post("/", function (req, res) {
  const fonts = {
    Helvetica: {
      normal: "Helvetica",
      bold: "Helvetica-Bold",
      italics: "Helvetica-Oblique",
      bolditalics: "Helvetica-BoldOblique",
    },
  };

  const printer = new PdfPrinter(fonts);
  const docDefinition = getDocDefinition(req.body);
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  pdfDoc.pipe(res);
  pdfDoc.end();
});

/**
 * Create document definition from report object
 * @param {any} report
 */
function getDocDefinition(report) {
  const instansi = "RUMAH SAKIT MUHAMMADIYAH LAMONGAN";
  const address = "Jl. Jaksa Agung Suprapto No. 76 RT 03 RW 03 Lamongan";
  const phone = "Telp. 0322-322834 (Hunting) Fax. 0322-314048";

  const dispositions = dispositionsRow(report.dispositions);
  const followups = followupsRow(report.followups);
  const expeditions = expeditionsRow(report.expeditions);

  // report details
  const layoutDetails = {
    table: {
      widths: [90, "auto", "*"],
      body: [
        ["", "", ""],
        ["", "", ""],
        ["Nomor Memo", ":", report.refNumber],
        ["Tanggal Memo", ":", report.sent],
        ["Pengirim", ":", report.sender],
        ["Jabatan", ":", report.function],
        ["Perihal", ":", report.subject],
        ["", "", ""],
        ["", "", ""],
      ],
    },
    layout: {
      hLineWidth: function (i) {
        if (i % 8 === 0) return 1;
        if (i % 6 === 1) return 2;
        return 0;
      },
      vLineWidth: () => 0,
      paddingTop: (i) => (i === 2 ? 5 : 1),
      paddingBottom: (i) => (i === 6 ? 4 : 1),
    },
    margin: [0, 10, 0, 10],
  };

  // disposition list
  const layoutDispositions = {
    table: {
      widths: [100, "*", 75],
      body: dispositions,
    },
    margin: [0, 5, 0, 15],
    layout: {
      fillColor: (row) => (row === 0 ? "#CCCCCC" : null),
      hLineColor: () => "#AAAAAA",
      hLineStyle: () => ({ dash: { length: 2 } }),
      hLineWidth: (i) => (i > 1 ? 1 : 0),
      vLineWidth: () => 0,
      paddingTop: () => 5,
      paddingBottom: () => 2,
    },
  };

  // follow up list
  const layoutFollowups = {
    table: {
      widths: ["auto", "*", "auto"],
      body: followups,
    },
    layout: {
      hLineWidth: (i) => (i % 4 == 0 ? 1 : 0),
      vLineWidth: () => 0,
      hLineColor: () => "#AAAAAA",
      paddingTop: (i) => (i % 4 === 0 ? 4 : 0),
      paddingBottom: (i) => (i % 4 === 3 ? 2 : 0),
    },
    margin: [0, 5, 0, 15],
  };

  // expedition list
  const layoutExpeditions = {
    table: {
      widths: ["auto", "auto", "*", "auto"],
      body: expeditions,
    },
    margin: [0, 5, 0, 15],
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      hLineColor: () => "#AAAAAA",
      fillColor: function (row) {
        return row === 0 ? "#CCCCCC" : null;
      },
      paddingTop: () => 5,
      paddingBottom: () => 2,
    },
  };

  return {
    pageSize: "A4",
    pageOrientation: "portrait",
    defaultStyle: {
      font: "Helvetica",
      lineHeight: 1.15,
    },

    content: [
      { text: `${report.title}`, style: "header" },
      { text: instansi, style: "header" },
      { text: `${address}, ${phone}`, style: "contact" },

      { text: `ID: ${report.id}` },
      {
        table: {
          widths: ["auto", "auto", "auto", "auto", "auto", "*"],
          body: [
            [
              "Tgl Terima",
              `: ${report.received}`,
              "Target Selesai",
              `: ${report.deadline}`,
              "Arsip",
              `: ${report.archive}`,
            ],
            [
              "No Agenda",
              `: ${report.agenda}`,
              "Nama File",
              `: ${report.filename}`,
              "Kode",
              `: ${report.archiveCode}`,
            ],
          ],
        },
        layout: {
          hLineWidth: (i) => (i + 1) % 2,
          vLineWidth: (i) => (i + 1) % 2,
          paddingTop: () => 3,
          paddingBottom: () => 0,
        },
      },

      layoutDetails,

      { text: "Disposisi", style: "subheader" },
      layoutDispositions,

      { text: "Tindak Lanjut", style: "subheader" },
      layoutFollowups,

      { text: "Ekspedisi", style: "subheader" },
      layoutExpeditions,
    ],

    styles: {
      header: {
        alignment: "center",
        fontSize: 14,
        bold: true,
      },
      subheader: {
        fontSize: 12,
        bold: true,
        decoration: "underline",
      },
      contact: {
        alignment: "center",
        fontSize: 10,
        italics: true,
        margin: [0, 0, 0, 20],
      },
    },
  };
}

function dispositionsRow(items) {
  const row = [["Diteruskan Ke", "Isi Disposisi", "Tanggal"]];
  items.forEach((element) => {
    row.push([element.name, element.note, element.date]);
  });

  return row;
}

function followupsRow(items) {
  const row = [];
  items.forEach((element, index) => {
    row.push([index + 1, { colSpan: 2, text: element.name, bold: true }, ""]);
    row.push(["", `Tgl. Kirim ${element.date}`, element.read]);
    row.push([
      "",
      { colSpan: 2, text: "Isi Tindak Lanjut:", margin: [0, 5, 0, 0] },
      "",
    ]);
    row.push(["", { colSpan: 2, text: element.note }, ""]);
  });

  return row;
}

function expeditionsRow(items) {
  const row = [["No", "Tgl Kirim", "Penerima", "Dibaca"]];
  items.forEach((element) => {
    row.push([row.length, element.date, element.name, element.read]);
  });

  return row;
}

module.exports = router;
