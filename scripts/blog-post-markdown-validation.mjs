function collectMarkdownLinks(value) {
  return Array.from(value.matchAll(/!?\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g))
    .map((match) => match[1])
    .sort();
}

function collectUrls(value) {
  return Array.from(value.matchAll(/https?:\/\/[^\s)"'<>]+/g))
    .map((match) => match[0].replace(/[.,;:]$/, ""))
    .sort();
}

function collectImagePaths(value) {
  return Array.from(value.matchAll(/\/blog\/[^\s)"'<>]+/g))
    .map((match) => match[0])
    .sort();
}

function collectHeadingLevels(value) {
  return value
    .split(/\r?\n/)
    .filter((line) => /^#{1,6}\s+/.test(line))
    .map((line) => line.match(/^#+/)?.[0].length ?? 0);
}

function countCodeFenceMarkers(value) {
  return Array.from(value.matchAll(/^```/gm)).length;
}

function compareArrays(label, source, target, issues, context) {
  if (source.length !== target.length) {
    issues.push(
      `${context}: ${label} count mismatch (${source.length} -> ${target.length})`,
    );
    return;
  }

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== target[index]) {
      issues.push(`${context}: ${label} changed at index ${index} (${source[index]} -> ${target[index]})`);
    }
  }
}

export function validateMarkdownPair(source, target, context, issues, warnings) {
  if (!target.trim()) {
    issues.push(`${context}: translated markdown is empty`);
    return;
  }

  compareArrays(
    "markdown link targets",
    collectMarkdownLinks(source),
    collectMarkdownLinks(target),
    issues,
    context,
  );
  compareArrays("URLs", collectUrls(source), collectUrls(target), issues, context);
  const placeholders = (text) => Array.from(text.matchAll(/\{[A-Za-z_]\w*\}/g), (match) => match[0]).sort();
  compareArrays("placeholders", placeholders(source), placeholders(target), issues, context);
  const codeBlocks = (text) => Array.from(text.replace(/\r\n/g, "\n").matchAll(/^```[^\n]*\n[\s\S]*?^```/gm), (match) => match[0]);
  compareArrays("code blocks", codeBlocks(source), codeBlocks(target), issues, context);
  compareArrays(
    "blog image paths",
    collectImagePaths(source),
    collectImagePaths(target),
    issues,
    context,
  );
  compareArrays(
    "heading levels",
    collectHeadingLevels(source),
    collectHeadingLevels(target),
    issues,
    context,
  );

  const sourceFenceCount = countCodeFenceMarkers(source);
  const targetFenceCount = countCodeFenceMarkers(target);
  if (sourceFenceCount !== targetFenceCount) {
    issues.push(
      `${context}: code fence marker count mismatch (${sourceFenceCount} -> ${targetFenceCount})`,
    );
  }

  if (source.trim() === target.trim()) {
    warnings.push(`${context}: translation is identical to English`);
  }

  if (target.includes("\u2014")) {
    issues.push(`${context}: translated markdown contains an em dash`);
  }
}
