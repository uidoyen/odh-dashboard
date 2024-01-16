import { markdownConverter } from '../markdown';
import DOMPurify from 'dompurify';
import { Converter } from 'showdown';

// Mocking external dependencies
jest.mock('dompurify');
jest.mock('showdown');

describe('markdownConverter', () => {
  it('should convert markdown to sanitized HTML', () => {
    const mockMarkdown = '## Heading\n[Link](https://example.com)';
    const expectedHtml =
      '<h2>Heading</h2><p><a href="https://example.com" target="_blank" rel="noopener noreferrer">Link</a></p>';

    // Mock Converter's makeHtml method
    const converterInstanceMock = { makeHtml: jest.fn().mockReturnValue(expectedHtml) };
    (Converter as jest.Mock).mockImplementation(() => converterInstanceMock);

    // Mock DOMPurify's addHook and sanitize methods
    DOMPurify.addHook = jest.fn();
    (DOMPurify.sanitize as any) = jest.fn((html: any) => html); // Use 'any' type for temporary resolution

    // Call the function to test
    const result = markdownConverter.makeHtml(mockMarkdown);

    // Assertions
    expect(result).toEqual(expectedHtml);
    expect(converterInstanceMock.makeHtml).toHaveBeenCalledWith(mockMarkdown);

    // DOMPurify hooks and sanitize should be called
    expect(DOMPurify.addHook).toHaveBeenCalledWith('beforeSanitizeElements', expect.any(Function));
    expect(DOMPurify.sanitize).toHaveBeenCalledWith(expectedHtml, expect.any(Object));
  });
});
