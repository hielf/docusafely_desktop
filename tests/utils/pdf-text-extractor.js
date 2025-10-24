const fs = require('fs');
const { spawn } = require('child_process');

/**
 * PDF Text Extractor Utility
 * Provides multiple methods to extract text from PDF files for testing purposes
 */

class PDFTextExtractor {
  constructor() {
    this.extractionMethods = [
      'pdf2txt',      // pdf2txt utility
      'pdftotext',    // pdftotext utility
      'basic',        // Basic binary text extraction
      'python_pymupdf' // Python PyMuPDF method
    ];
  }

  /**
   * Extract text from PDF using the best available method
   */
  async extractText(pdfPath, options = {}) {
    const { method = 'auto', timeout = 10000 } = options;

    if (method === 'auto') {
      // Try methods in order of preference
      for (const extractionMethod of this.extractionMethods) {
        try {
          const text = await this.extractTextWithMethod(pdfPath, extractionMethod, timeout);
          if (text && text.length > 0) {
            console.log(`✓ Text extracted using ${extractionMethod}`);
            return text;
          }
        } catch (error) {
          console.warn(`⚠️ ${extractionMethod} failed:`, error.message);
        }
      }
      throw new Error('All text extraction methods failed');
    } else {
      return this.extractTextWithMethod(pdfPath, method, timeout);
    }
  }

  /**
   * Extract text using a specific method
   */
  async extractTextWithMethod(pdfPath, method, timeout = 10000) {
    switch (method) {
      case 'pdf2txt':
        return this.extractWithPdf2Txt(pdfPath, timeout);
      case 'pdftotext':
        return this.extractWithPdftoText(pdfPath, timeout);
      case 'python_pymupdf':
        return this.extractWithPythonPyMuPDF(pdfPath, timeout);
      case 'basic':
      default:
        return this.extractBasic(pdfPath);
    }
  }

  /**
   * Extract text using pdf2txt utility
   */
  async extractWithPdf2Txt(pdfPath, timeout) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('pdf2txt timeout'));
      }, timeout);

      const proc = spawn('pdf2txt', [pdfPath]);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        clearTimeout(timeoutId);
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`pdf2txt failed with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`pdf2txt error: ${error.message}`));
      });
    });
  }

  /**
   * Extract text using pdftotext utility
   */
  async extractWithPdftoText(pdfPath, timeout) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('pdftotext timeout'));
      }, timeout);

      const proc = spawn('pdftotext', [pdfPath, '-']);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        clearTimeout(timeoutId);
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`pdftotext failed with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`pdftotext error: ${error.message}`));
      });
    });
  }

  /**
   * Extract text using Python PyMuPDF
   */
  async extractWithPythonPyMuPDF(pdfPath, timeout) {
    const pythonScript = `
import sys
import fitz  # PyMuPDF
import json

try:
    doc = fitz.open("${pdfPath}")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    print(json.dumps({"status": "success", "text": text}))
except Exception as e:
    print(json.dumps({"status": "error", "message": str(e)}))
`;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Python PyMuPDF timeout'));
      }, timeout);

      const proc = spawn('python3', ['-c', pythonScript]);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        clearTimeout(timeoutId);
        try {
          const result = JSON.parse(stdout);
          if (result.status === 'success') {
            resolve(result.text);
          } else {
            reject(new Error(result.message));
          }
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${error.message}`));
        }
      });

      proc.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`Python error: ${error.message}`));
      });
    });
  }

  /**
   * Basic text extraction from PDF binary content
   */
  extractBasic(pdfPath) {
    try {
      const pdfContent = fs.readFileSync(pdfPath);

      // Convert to string and extract readable text
      const textContent = pdfContent.toString('utf8', 0, Math.min(pdfContent.length, 100000));

      // Extract text between text objects (basic approach)
      const textMatches = textContent.match(/\([^)]*\)/g) || [];
      const extractedText = textMatches
        .map(match => match.slice(1, -1)) // Remove parentheses
        .join(' ')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')');

      return extractedText;
    } catch (error) {
      throw new Error(`Basic extraction failed: ${error.message}`);
    }
  }

  /**
   * Analyze extracted text for PII patterns
   */
  analyzeText(text) {
    const patterns = {
      emails: text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [],
      phones: text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || [],
      names: text.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g) || [],
      addresses: text.match(/\b\d+\s+[A-Za-z0-9\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Circle|Cir)\b/gi) || [],
      creditCards: text.match(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g) || [],
      ssns: text.match(/\b\d{3}-?\d{2}-?\d{4}\b/g) || []
    };

    return {
      totalLength: text.length,
      patterns: patterns,
      patternCounts: Object.fromEntries(
        Object.entries(patterns).map(([key, matches]) => [key, matches.length])
      ),
      hasPII: Object.values(patterns).some(matches => matches.length > 0)
    };
  }

  /**
   * Compare two texts to detect changes (for masking verification)
   */
  compareTexts(originalText, processedText) {
    const originalAnalysis = this.analyzeText(originalText);
    const processedAnalysis = this.analyzeText(processedText);

    // Check for masking patterns
    const maskingPatterns = {
      xMasking: /x{2,}/g,
      starMasking: /\*{2,}/g,
      hashMasking: /#{2,}/g,
      dashMasking: /-{2,}/g
    };

    let totalMasked = 0;
    const maskingResults = {};

    Object.entries(maskingPatterns).forEach(([type, pattern]) => {
      const matches = processedText.match(pattern);
      const count = matches ? matches.length : 0;
      totalMasked += count;
      maskingResults[type] = count;
    });

    return {
      original: originalAnalysis,
      processed: processedAnalysis,
      masking: {
        results: maskingResults,
        totalMasked: totalMasked,
        hasMasking: totalMasked > 0
      },
      changes: {
        lengthDifference: processedText.length - originalText.length,
        piiReduction: originalAnalysis.hasPII && !processedAnalysis.hasPII,
        contentChanged: originalText !== processedText
      }
    };
  }
}

module.exports = PDFTextExtractor;
