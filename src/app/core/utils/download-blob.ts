import { HttpResponse } from '@angular/common/http';

export function downloadBlobResponse(response: HttpResponse<Blob>, fallbackFilename: string): void {
  const blob = response.body;

  if (!blob) {
    return;
  }

  const filename = getFilename(response.headers.get('content-disposition')) || fallbackFilename;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  window.URL.revokeObjectURL(url);
}

function getFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] ?? null;
}
