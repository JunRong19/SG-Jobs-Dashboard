// Some scraped job descriptions have a text-corruption artifact: the last
// 1-3 characters of a bullet's final word are glued to the start of the
// next bullet instead of staying at the end of the word they complete, e.g.
//   "...a related fiel" / "d.Minimum 8 years..."
// should read
//   "...a related field." / "Minimum 8 years..."
// This repairs that specific, narrow signature (a short lowercase run
// immediately butting an uppercase letter with no space, or standing alone
// as the final line) without touching normal prose.

const BULLET_PREFIX = /^(\s*[-*]\s+)/;
const FRAGMENT_PREFIX = /^([a-z]{1,3}[).:,;]{0,1})(?=[A-Z])/;
const FRAGMENT_ONLY = /^([a-z]{1,3}[).:,;]{0,1})$/;

const isBullet = (line: string) => BULLET_PREFIX.test(line);
const endsMidWord = (line: string) => /[a-zA-Z]$/.test(line.trimEnd());

export function repairShiftedListText(text: string): string {
  const lines = text.split("\n");
  const toRemove = new Set<number>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;

    const bulletMatch = line.match(BULLET_PREFIX);
    const isLastNonBlank = lines.slice(i + 1).every((l) => l.trim() === "");

    if (!bulletMatch && !isLastNonBlank) continue;

    const marker = bulletMatch ? bulletMatch[1] : "";
    const content = bulletMatch ? line.slice(marker.length) : line;

    let fragment: string | null = null;
    let rest = "";

    const fullMatch = bulletMatch ? content.match(FRAGMENT_PREFIX) : null;
    const onlyMatch = !bulletMatch ? content.match(FRAGMENT_ONLY) : null;

    if (fullMatch) {
      fragment = fullMatch[1];
      rest = content.slice(fragment.length);
    } else if (onlyMatch) {
      fragment = onlyMatch[1];
    } else {
      continue;
    }

    let j = i - 1;
    while (j >= 0 && lines[j].trim() === "") j--;
    if (j < 0 || toRemove.has(j) || !isBullet(lines[j]) || !endsMidWord(lines[j])) {
      continue;
    }

    lines[j] = lines[j] + fragment;
    if (rest) {
      lines[i] = marker + rest;
    } else {
      toRemove.add(i);
    }
  }

  return lines.filter((_, idx) => !toRemove.has(idx)).join("\n");
}

// Some scraped descriptions are missing the blank line between a bold
// "heading" (the scraper's stand-in for a <h3>/<strong> section title) and
// the paragraph or next heading that immediately follows it, e.g.
//   "**Who We Are**As Singapore's longest established bank..."
// should read
//   "**Who We Are**\n\nAs Singapore's longest established bank..."
// Two adjacent headings glued together ("**A****B**") additionally fail to
// render as two bold spans in most markdown parsers and show up as literal
// asterisks. Inserting a break after every bold span that is immediately
// followed by a letter or another bold span (no space) fixes both, while
// leaving normal inline emphasis — which always has a space or punctuation
// after it — untouched. The lookbehind rejects starting a "match" at a
// closing ** that belongs to an earlier, unrelated bold phrase (e.g. two
// separate "**word** ... **word**" emphasis spans in one sentence): a
// genuine opening ** is never immediately preceded by a letter or digit.
const HEADING_GLUE = /(?<![A-Za-z0-9])\*\*([^*\n]+)\*\*(?=[A-Za-z]|\*\*)/g;

export function repairMissingHeadingBreaks(text: string): string {
  return text.replace(HEADING_GLUE, (match) => `${match}\n\n`);
}
