type HighlightedTextProps = {
  text: string;
  ranges: readonly { start: number; end: number }[];
  className: string;
  offset?: number;
};

// Keep connected scripts in text runs instead of wrapping every letter.
export function HighlightedText({ text, ranges, className, offset = 0 }: HighlightedTextProps) {
  const boundaries = new Set([0, text.length]);
  for (const range of ranges) {
    boundaries.add(Math.max(0, Math.min(text.length, range.start - offset)));
    boundaries.add(Math.max(0, Math.min(text.length, range.end - offset)));
  }
  const positions = [...boundaries].sort((a, b) => a - b);

  return positions.slice(0, -1).map((start, index) => {
    const end = positions[index + 1];
    const highlighted = ranges.some((range) => start + offset >= range.start && start + offset < range.end);
    return <span key={start} className={highlighted ? className : undefined}>{text.slice(start, end)}</span>;
  });
}
