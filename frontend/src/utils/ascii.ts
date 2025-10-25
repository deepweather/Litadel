// ASCII Art utilities

export const generateBorder = (width: number, type: 'top' | 'middle' | 'bottom'): string => {
  const chars = {
    top: { left: '┌', middle: '─', right: '┐' },
    middle: { left: '├', middle: '─', right: '┤' },
    bottom: { left: '└', middle: '─', right: '┘' },
  };

  const { left, middle, right } = chars[type];
  return left + middle.repeat(width - 2) + right;
};

export const padText = (text: string, width: number, align: 'left' | 'center' | 'right' = 'left'): string => {
  if (text.length >= width) {
    return text.slice(0, width);
  }

  const padding = width - text.length;

  switch (align) {
    case 'center': {
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
    }
    case 'right':
      return ' '.repeat(padding) + text;
    default:
      return text + ' '.repeat(padding);
  }
};

export const createBox = (title: string, content: string[], width: number): string[] => {
  const lines: string[] = [];

  // Top border
  lines.push(generateBorder(width, 'top'));

  // Title
  if (title) {
    lines.push('│ ' + padText(title, width - 4) + ' │');
    lines.push(generateBorder(width, 'middle'));
  }

  // Content
  content.forEach((line) => {
    lines.push('│ ' + padText(line, width - 4) + ' │');
  });

  // Bottom border
  lines.push(generateBorder(width, 'bottom'));

  return lines;
};

export const generateProgressBar = (percentage: number, width: number = 20): string => {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + '] ' + percentage.toFixed(0) + '%';
};

export const getStatusIcon = (status: string): string => {
  const icons: Record<string, string> = {
    completed: '[✓]',
    running: '[►]',
    pending: '[ ]',
    failed: '[✗]',
    warning: '[!]',
  };
  return icons[status] || '[ ]';
};

export const LOGO_ASCII = `
██      ██ ████████  █████  ██████  ███████ ██
██      ██    ██    ██   ██ ██   ██ ██      ██
██      ██    ██    ███████ ██   ██ █████   ██
██      ██    ██    ██   ██ ██   ██ ██      ██
███████ ██    ██    ██   ██ ██████  ███████ ███████
`;

export const MINI_LOGO = `
██      ██ ████████  █████  ██████  ███████ ██
██      ██    ██    ██   ██ ██   ██ ██      ██
██      ██    ██    ███████ ██   ██ █████   ██
`;

export const createTable = (
  headers: string[],
  rows: string[][],
  columnWidths: number[]
): string[] => {
  const lines: string[] = [];
  const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0) + columnWidths.length + 1;

  // Top border
  lines.push(generateBorder(totalWidth, 'top'));

  // Headers
  let headerLine = '│';
  headers.forEach((header, i) => {
    headerLine += ' ' + padText(header, columnWidths[i]) + '│';
  });
  lines.push(headerLine);
  lines.push(generateBorder(totalWidth, 'middle'));

  // Rows
  rows.forEach((row) => {
    let rowLine = '│';
    row.forEach((cell, i) => {
      rowLine += ' ' + padText(cell, columnWidths[i]) + '│';
    });
    lines.push(rowLine);
  });

  // Bottom border
  lines.push(generateBorder(totalWidth, 'bottom'));

  return lines;
};

