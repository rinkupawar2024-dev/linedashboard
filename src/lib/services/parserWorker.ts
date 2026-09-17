import * as XLSX from 'xlsx';
import { parseExcelWorkbook, type ExcelImportResult } from './excelParser';

export interface ParserWorkerRequest {
  buffer: ArrayBuffer;
  fileName: string;
}

export type ParserWorkerResponse =
  | { ok: true; result: ExcelImportResult }
  | { ok: false; error: string };

/**
 * Runs the workbook parse off the main thread so the dashboard stays
 * responsive during an import.
 *
 * xlsx is imported statically here: this module is only ever loaded inside the
 * worker chunk, which itself is created on demand, so the cost is still paid
 * lazily and never lands in the initial bundle.
 */
const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<ParserWorkerRequest>) => void) | null;
  postMessage: (message: ParserWorkerResponse) => void;
};

ctx.onmessage = (event: MessageEvent<ParserWorkerRequest>) => {
  const { buffer, fileName } = event.data;

  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    ctx.postMessage({ ok: true, result: parseExcelWorkbook(workbook, fileName, XLSX) });
  } catch (error) {
    // Errors are reported as data rather than thrown: an uncaught worker error
    // gives the caller no message to show.
    ctx.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : 'The workbook could not be parsed.',
    });
  }
};
