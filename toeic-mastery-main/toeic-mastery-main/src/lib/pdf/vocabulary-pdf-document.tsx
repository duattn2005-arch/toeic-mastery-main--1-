import path from "node:path";
import { Document, Page, View, Text, Font, StyleSheet } from "@react-pdf/renderer";
import type { SavedWordExportRow } from "@/lib/data/bookmarks";

// Vietnamese diacritics need a Unicode font — the built-in PDF core fonts
// (Helvetica/Times/Courier) only cover basic Latin and would render "Nghĩa",
// "Ví dụ" etc. as missing/garbled glyphs.
Font.register({
  family: "NotoSans",
  src: path.join(process.cwd(), "src/assets/fonts/NotoSans-Regular.ttf"),
});

const styles = StyleSheet.create({
  page: { fontFamily: "NotoSans", fontSize: 10, padding: 32, color: "#1c2033" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#6b7280", marginBottom: 16 },
  table: { display: "flex", flexDirection: "column", width: "100%" },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#5b4bf0",
    color: "#ffffff",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e9f2",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  rowAlt: { backgroundColor: "#f5f7fb" },
  cellStt: { width: "6%", fontSize: 9 },
  cellWord: { width: "16%", fontSize: 10, fontWeight: 700 },
  cellIpa: { width: "14%", fontSize: 9, color: "#6b7280" },
  cellMeaning: { width: "18%", fontSize: 9 },
  cellExample: { width: "26%", fontSize: 9, color: "#374151" },
  cellNote: { width: "20%", fontSize: 9, borderLeftWidth: 1, borderLeftColor: "#e5e9f2", paddingLeft: 4, minHeight: 24 },
  headerCell: { fontSize: 9, fontWeight: 700 },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, fontSize: 8, color: "#9ca3af", textAlign: "center" },
});

export function VocabularyPdfDocument({ rows, generatedAt }: { rows: SavedWordExportRow[]; generatedAt: string }) {
  return (
    <Document title="Từ vựng của tôi — TOEIC Mastery">
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>Từ vựng của tôi</Text>
        <Text style={styles.subtitle}>
          {rows.length} từ · Xuất ngày {generatedAt} · TOEIC Mastery
        </Text>

        <View style={styles.table}>
          <View style={styles.headerRow} fixed>
            <Text style={[styles.headerCell, styles.cellStt]}>STT</Text>
            <Text style={[styles.headerCell, styles.cellWord]}>Từ</Text>
            <Text style={[styles.headerCell, styles.cellIpa]}>Phiên âm</Text>
            <Text style={[styles.headerCell, styles.cellMeaning]}>Nghĩa</Text>
            <Text style={[styles.headerCell, styles.cellExample]}>Ví dụ</Text>
            <Text style={[styles.headerCell, styles.cellNote]}>Ghi chú</Text>
          </View>

          {rows.map((row, i) => (
            <View key={`${row.word}-${i}`} style={[styles.row, ...(i % 2 === 1 ? [styles.rowAlt] : [])]} wrap={false}>
              <Text style={styles.cellStt}>{i + 1}</Text>
              <Text style={styles.cellWord}>{row.word}</Text>
              <Text style={styles.cellIpa}>{row.ipa ? `/${row.ipa.replace(/\//g, "")}/` : ""}</Text>
              <Text style={styles.cellMeaning}>{row.meaningVi}</Text>
              <Text style={styles.cellExample}>{row.exampleEn ?? ""}</Text>
              <Text style={styles.cellNote}>{row.note ?? ""}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `TOEIC Mastery · Trang ${pageNumber}/${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
