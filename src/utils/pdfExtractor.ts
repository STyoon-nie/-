import * as pdfjsLib from "pdfjs-dist";

// Configure worker src with fail-safe fallback
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.10.38"}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn("PDF worker configuration note:", e);
}

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageStrings = textContent.items
        // @ts-ignore
        .map((item) => item.str || "")
        .join(" ");
      
      fullText += `[${pageNum} 페이지]\n${pageStrings}\n\n`;
    }
    
    return fullText.trim();
  } catch (error) {
    console.error("PDF Parsing error, falling back to array buffer string extract:", error);
    // Fallback: decode text as much as possible
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder("utf-8", { fatal: false });
    return decoder.decode(buffer);
  }
}
