/**
 * Utility to trigger a file download in the browser.
 * @param {string} content - File content string
 * @param {string} filename - Name for the downloaded file
 * @param {string} mimeType - MIME type (default: text/plain)
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download JSON data as a .json file
 */
export function downloadJSON(data, filename = 'export.json') {
  downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
}

/**
 * Download array of objects as CSV
 */
export function downloadCSV(rows, filename = 'export.csv') {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
  downloadFile(csv, filename, 'text/csv');
}