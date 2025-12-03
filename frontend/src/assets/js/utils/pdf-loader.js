/**
 * PDF.js Loader
 * Carga PDF.js v5 y configura el worker
 */

import * as pdfjsLib from '/public/vendor/pdfjs/pdf.min.mjs';

// Configurar worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/public/vendor/pdfjs/pdf.worker.min.mjs';

// Exponer globalmente para compatibilidad con código existente
window.pdfjsLib = pdfjsLib;

console.log('✅ PDF.js v5 cargado correctamente');

export default pdfjsLib;
