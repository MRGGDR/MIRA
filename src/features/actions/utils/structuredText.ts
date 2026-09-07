export type ListStyle = 'bullet' | 'number';

export interface StructuredTextEdit {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

const BULLET_PREFIX = /^(\s*)•\s+/;
const NUMBER_PREFIX = /^(\s*)\d+\.\s+/;
const ANY_LIST_PREFIX = /^(\s*)(?:(?:•|[-*])|\d+[.)])\s+/;

export function applyListFormat(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  style: ListStyle,
): StructuredTextEdit {
  const safeStart = Math.max(0, Math.min(selectionStart, value.length));
  const safeEnd = Math.max(safeStart, Math.min(selectionEnd, value.length));
  const lineStart = safeStart === 0 ? 0 : value.lastIndexOf('\n', safeStart - 1) + 1;
  const effectiveEnd = safeEnd > safeStart && value[safeEnd - 1] === '\n' ? safeEnd - 1 : safeEnd;
  const followingBreak = value.indexOf('\n', effectiveEnd);
  const lineEnd = followingBreak === -1 ? value.length : followingBreak;
  const lines = value.slice(lineStart, lineEnd).split('\n');
  const nonEmptyLines = lines.filter((line) => line.trim());
  const activePrefix = style === 'bullet' ? BULLET_PREFIX : NUMBER_PREFIX;
  const shouldRemove = nonEmptyLines.length > 0 && nonEmptyLines.every((line) => activePrefix.test(line));
  let itemNumber = 0;

  const formattedLines = lines.map((line) => {
    if (!line.trim()) return line;
    const indentation = line.match(/^\s*/)?.[0] ?? '';
    const content = line.replace(ANY_LIST_PREFIX, '$1');
    if (shouldRemove) return content;
    itemNumber += 1;
    const prefix = style === 'bullet' ? '• ' : `${itemNumber}. `;
    return `${indentation}${prefix}${content.slice(indentation.length)}`;
  });
  const formattedBlock = formattedLines.join('\n');

  return {
    value: `${value.slice(0, lineStart)}${formattedBlock}${value.slice(lineEnd)}`,
    selectionStart: lineStart,
    selectionEnd: lineStart + formattedBlock.length,
  };
}
