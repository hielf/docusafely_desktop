/**
 * Tests for file type validation
 * 
 * Tests cover:
 * - File extension validation for all supported document types
 * - Error handling for unsupported file types
 * - Validation helper functions
 */

describe('File Type Validation', () => {
  // Supported file extensions from the frontend
  const SUPPORTED_EXTENSIONS = ['txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'md'];

  // Helper function to validate file extension (matches frontend logic)
  function isValidFileExtension(filePath) {
    const ext = filePath.toLowerCase().split('.').pop();
    return SUPPORTED_EXTENSIONS.includes(ext);
  }

  describe('Supported file types', () => {
    test('should accept .txt files', () => {
      expect(isValidFileExtension('document.txt')).toBe(true);
      expect(isValidFileExtension('test.TXT')).toBe(true);
      expect(isValidFileExtension('/path/to/file.txt')).toBe(true);
    });

    test('should accept .pdf files', () => {
      expect(isValidFileExtension('document.pdf')).toBe(true);
      expect(isValidFileExtension('test.PDF')).toBe(true);
      expect(isValidFileExtension('/path/to/file.pdf')).toBe(true);
    });

    test('should accept Word document files', () => {
      expect(isValidFileExtension('document.doc')).toBe(true);
      expect(isValidFileExtension('document.docx')).toBe(true);
      expect(isValidFileExtension('test.DOC')).toBe(true);
      expect(isValidFileExtension('test.DOCX')).toBe(true);
    });

    test('should accept Excel spreadsheet files', () => {
      expect(isValidFileExtension('spreadsheet.xls')).toBe(true);
      expect(isValidFileExtension('spreadsheet.xlsx')).toBe(true);
      expect(isValidFileExtension('test.XLS')).toBe(true);
      expect(isValidFileExtension('test.XLSX')).toBe(true);
    });

    test('should accept PowerPoint presentation files', () => {
      expect(isValidFileExtension('presentation.ppt')).toBe(true);
      expect(isValidFileExtension('presentation.pptx')).toBe(true);
      expect(isValidFileExtension('test.PPT')).toBe(true);
      expect(isValidFileExtension('test.PPTX')).toBe(true);
    });

    test('should accept RTF files', () => {
      expect(isValidFileExtension('document.rtf')).toBe(true);
      expect(isValidFileExtension('test.RTF')).toBe(true);
    });

    test('should accept Markdown files', () => {
      expect(isValidFileExtension('readme.md')).toBe(true);
      expect(isValidFileExtension('test.MD')).toBe(true);
    });

    test('should accept all supported extensions regardless of case', () => {
      SUPPORTED_EXTENSIONS.forEach(ext => {
        expect(isValidFileExtension(`file.${ext.toLowerCase()}`)).toBe(true);
        expect(isValidFileExtension(`file.${ext.toUpperCase()}`)).toBe(true);
      });
    });
  });

  describe('Unsupported file types', () => {
    test('should reject unsupported file types', () => {
      const unsupported = ['exe', 'zip', 'jpg', 'png', 'mp4', 'csv', 'json', 'xml', 'html'];
      unsupported.forEach(ext => {
        expect(isValidFileExtension(`file.${ext}`)).toBe(false);
      });
    });

    test('should reject files without extensions', () => {
      expect(isValidFileExtension('file')).toBe(false);
      expect(isValidFileExtension('/path/to/file')).toBe(false);
    });

    test('should reject empty file paths', () => {
      expect(isValidFileExtension('')).toBe(false);
    });
  });

  describe('File path edge cases', () => {
    test('should handle paths with multiple dots', () => {
      expect(isValidFileExtension('file.name.txt')).toBe(true);
      expect(isValidFileExtension('file.name.pdf')).toBe(true);
      expect(isValidFileExtension('file.name.docx')).toBe(true);
    });

    test('should handle paths with spaces', () => {
      expect(isValidFileExtension('my document.txt')).toBe(true);
      expect(isValidFileExtension('my document.pdf')).toBe(true);
      expect(isValidFileExtension('/path/to/my document.docx')).toBe(true);
    });

    test('should handle Windows paths', () => {
      expect(isValidFileExtension('C:\\Users\\Documents\\file.txt')).toBe(true);
      expect(isValidFileExtension('C:\\Users\\Documents\\file.pdf')).toBe(true);
    });

    test('should handle Unix paths', () => {
      expect(isValidFileExtension('/home/user/documents/file.txt')).toBe(true);
      expect(isValidFileExtension('/home/user/documents/file.pdf')).toBe(true);
    });
  });

  describe('Supported extensions list', () => {
    test('should include all required document types', () => {
      const requiredTypes = ['txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'md'];
      requiredTypes.forEach(type => {
        expect(SUPPORTED_EXTENSIONS).toContain(type);
      });
    });

    test('should have exactly 10 supported extensions', () => {
      expect(SUPPORTED_EXTENSIONS.length).toBe(10);
    });
  });
});




