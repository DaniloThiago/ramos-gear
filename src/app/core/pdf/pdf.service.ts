import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  async generateFromElement(target: string | HTMLElement, filename = 'laudo-ramos-gear.pdf'): Promise<Blob> {
    const element = this.resolveElement(target);
    if (!element) {
      throw new Error(`Elemento não encontrado para geração do PDF: ${filename}`);
    }

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;

    const headerElement = element.querySelector<HTMLElement>('[data-pdf-header]');
    const headerCanvas = headerElement ? await this.renderCanvas(headerElement) : null;
    const headerHeight = headerCanvas ? (headerCanvas.height * contentWidth) / headerCanvas.width : 0;
    const headerGap = headerCanvas ? 6 : 0;
    const contentStartY = margin + headerHeight + headerGap;
    const contentBottomY = pageHeight - margin;
    const blocks = this.resolveBlocks(element);
    let cursorY = contentStartY;

    for (const block of blocks) {
      const canvas = await this.renderCanvas(block);

      if (!canvas.width || !canvas.height) {
        continue;
      }

      if (cursorY === contentStartY) {
        this.drawHeader(pdf, headerCanvas, margin, contentWidth);
      }

      const imageHeight = (canvas.height * contentWidth) / canvas.width;
      if (cursorY + imageHeight > contentBottomY) {
        pdf.addPage();
        this.drawHeader(pdf, headerCanvas, margin, contentWidth);
        cursorY = contentStartY;
      }

      const availableHeight = contentBottomY - cursorY;
      const drawHeight = imageHeight > availableHeight ? availableHeight : imageHeight;
      const drawWidth = imageHeight > availableHeight ? (canvas.width * drawHeight) / canvas.height : contentWidth;
      const drawX = margin + (contentWidth - drawWidth) / 2;

      const imageData = canvas.toDataURL('image/jpeg', 0.96);
      pdf.addImage(imageData, 'JPEG', drawX, cursorY, drawWidth, drawHeight, undefined, 'FAST');
      cursorY += drawHeight + 6;
    }

    return pdf.output('blob');
  }

  download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async share(blob: Blob, filename: string): Promise<boolean> {
    const file = new File([blob], filename, { type: 'application/pdf' });

    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      await navigator.share({
        title: 'Laudo cautelar Ramos Gear',
        text: 'Laudo cautelar gerado pelo Ramos Gear.',
        files: [file],
      });
      return true;
    }

    this.download(blob, filename);
    return false;
  }

  private resolveElement(target: string | HTMLElement): HTMLElement | null {
    if (typeof target !== 'string') {
      return target;
    }

    if (typeof document === 'undefined') {
      return null;
    }

    return document.getElementById(target);
  }

  private resolveBlocks(element: HTMLElement): HTMLElement[] {
    const blocks = Array.from(element.querySelectorAll<HTMLElement>('[data-pdf-block]')).filter(
      (node) => !node.hasAttribute('data-pdf-header'),
    );
    return blocks.length ? blocks : [element];
  }

  private drawHeader(
    pdf: jsPDF,
    headerCanvas: HTMLCanvasElement | null,
    margin: number,
    contentWidth: number,
  ): void {
    if (!headerCanvas) {
      return;
    }

    const headerHeight = (headerCanvas.height * contentWidth) / headerCanvas.width;
    const imageData = headerCanvas.toDataURL('image/jpeg', 0.96);
    pdf.addImage(imageData, 'JPEG', margin, margin, contentWidth, headerHeight, undefined, 'FAST');
  }

  private async renderCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
    return html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 0,
    });
  }
}
