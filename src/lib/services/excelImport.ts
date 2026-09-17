import {
  ExcelImportError,
  MAX_UPLOAD_BYTES,
  parseExcelWorkbook,
  type ExcelImportResult,
  type XLSXModule,
} from './excelParser';
import type { ParserWorkerRequest, ParserWorkerResponse } from './parserWorker';

// xlsx is loaded on demand so it stays out of the initial client bundle.
let xlsxPromise: Promise<XLSXModule> | null = null;
function loadXLSX(): Promise<XLSXModule> {
  if (!xlsxPromise) {
    xlsxPromise = import('xlsx');
  }
  return xlsxPromise;
}

/** Give up on the worker and use the main thread rather than hang the import. */
const WORKER_TIMEOUT_MS = 30000;

/** Parses on a worker thread. Rejects if the worker cannot be used at all. */
function parseInWorker(buffer: ArrayBuffer, fileName: string): Promise<ExcelImportResult> {
  if (typeof Worker === 'undefined') {
    return Promise.reject(new Error('Web Workers are unavailable in this browser.'));
  }

  const worker = new Worker(new URL('./parserWorker.ts', import.meta.url));

  return new Promise<ExcelImportResult>((resolve, reject) => {
    const settle = (fn: () => void) => {
      clearTimeout(timer);
      worker.terminate();
      fn();
    };

    const timer = setTimeout(
      () => settle(() => reject(new Error('The parser worker did not respond.'))),
      WORKER_TIMEOUT_MS
    );

    worker.onmessage = (event: MessageEvent<ParserWorkerResponse>) => {
      const response = event.data;
      settle(() =>
        response.ok ? resolve(response.result) : reject(new ExcelImportError(response.error))
      );
    };

    // Fires when the worker script fails to load or throws on startup.
    worker.onerror = (event: ErrorEvent) => {
      settle(() => reject(new Error(event.message || 'The parser worker failed to start.')));
    };

    // The buffer is transferred rather than copied; see the re-read below.
    worker.postMessage({ buffer, fileName } satisfies ParserWorkerRequest, [buffer]);
  });
}

async function parseOnMainThread(buffer: ArrayBuffer, fileName: string): Promise<ExcelImportResult> {
  const XLSX = await loadXLSX();
  const workbook = XLSX.read(buffer, { type: 'array' });
  return parseExcelWorkbook(workbook, fileName, XLSX);
}

export async function parseUploadedExcelFile(file: File): Promise<ExcelImportResult> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ExcelImportError(
      `File is ${(file.size / (1024 * 1024)).toFixed(1)} MB, which exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB limit.`
    );
  }

  try {
    return await parseInWorker(await file.arrayBuffer(), file.name);
  } catch {
    // Worker unsupported, blocked by CSP, or otherwise unusable — the main
    // thread produces the same result. Re-read the file because the buffer was
    // transferred into the worker and is detached by now.
    return parseOnMainThread(await file.arrayBuffer(), file.name);
  }
}
