/**
 * exporters.ts
 * Utilidades para exportar los productos extraídos a CSV o Excel.
 *
 * Dependencias:
 *   npm install xlsx papaparse
 */

/**
 * Descarga los productos como CSV
 * @param products
 * @param filename
 */
export function exportToCSV(products: Record<string, unknown>[], filename = "catalogo") {
  if (!products || products.length === 0) return;

  // Usar Papa.unparse si está disponible, sino generarlo manualmente
  let csv: string;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Papa = require("papaparse");
    csv = Papa.unparse(products, { header: true });
  } catch {
    // Fallback manual
    const headers = Object.keys(products[0]);
    const rows = products.map((p) =>
      headers.map((h) => {
        const val = p[h] ?? "";
        const str = String(val);
        return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      })
    );
    csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }

  // BOM para que Excel abra bien con acentos
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Descarga los productos como Excel (.xlsx)
 * @param products
 * @param filename
 */
export function exportToXLSX(products: Record<string, unknown>[], filename = "catalogo") {
  if (!products || products.length === 0) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XLSX = require("xlsx");

    const worksheet = XLSX.utils.json_to_sheet(products);

    // Autoajuste de ancho de columnas
    const colWidths = Object.keys(products[0]).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...products.map((p) => String(p[key] ?? "").length)
      );
      return { wch: Math.min(maxLen + 2, 40) };
    });
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (err) {
    console.error("Error exportando a XLSX:", err);
    // Fallback a CSV si xlsx no está instalado
    exportToCSV(products, filename);
  }
}

/**
 * Helper para trigger de descarga
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
