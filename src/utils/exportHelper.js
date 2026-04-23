import axios from 'axios';

/**
 * Triggers a file download from an API endpoint that returns a binary stream.
 * Uses axios so that cookies and custom headers (x-store-id) are sent automatically.
 *
 * @param {string} url       - The API endpoint (e.g. '/api/products/export')
 * @param {object} params    - Optional query params (e.g. { startDate, endDate })
 * @param {string} filename  - Fallback filename if the server doesn't specify one
 */
export async function downloadExcel(url, params = {}, filename = 'reporte.xlsx') {
  try {
    const response = await axios.get(url, {
      params,
      responseType: 'blob',
      withCredentials: true,
    });

    // Try to extract filename from Content-Disposition header
    const disposition = response.headers['content-disposition'];
    if (disposition) {
      const match = disposition.match(/filename="?([^";\r\n]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    // Create a temporary link element to trigger the download
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('[exportHelper] Error downloading file:', error);
    throw error;
  }
}
