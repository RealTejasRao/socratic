import type { RetrievedPassage } from "src/server/ai/hybrid-retrieval";

type RerankInput = {
  query: string;
  userMessage: string;
  candidates: RetrievedPassage[];
  minPassages?: number;
  maxPassages?: number;
};

export type RerankedPassage = RetrievedPassage & {
  rerankScore: number;
};

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function containsMetadataMention(query: string, author: string, title: string) {
  const queryTokens = new Set(tokenize(query));
  const metadataTokens = tokenize(`${author} ${title}`);
  if (!metadataTokens.length) return false;
  return metadataTokens.some((token) => queryTokens.has(token));
}

function normalizeScores(values: number[]) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return values.map(() => 1);
  }
  return values.map((value) => (value - min) / (max - min));
}

export function rerankRetrievedPassages(input: RerankInput) {
  const minPassages = input.minPassages ?? 2;
  const maxPassages = input.maxPassages ?? 3;
  if (!input.candidates.length) return [];

  const lexicalScores = input.candidates.map((candidate) => candidate.lexicalScore);
  const fusedScores = input.candidates.map((candidate) => candidate.fusedScore);
  const normalizedLexical = normalizeScores(lexicalScores);
  const normalizedFused = normalizeScores(fusedScores);

  const rescored: RerankedPassage[] = input.candidates.map((candidate, index) => {
    const lexicalScore = normalizedLexical[index] ?? 0;
    const fusedScore = normalizedFused[index] ?? 0;
    const semanticScore = candidate.semanticScore ?? candidate.embeddingSimilarity ?? 0;
    const relevance =
      semanticScore * 0.6 + fusedScore * 0.25 + lexicalScore * 0.15;

    return {
      ...candidate,
      rerankScore: relevance,
    };
  });

  const filtered = rescored.filter((candidate) => candidate.semanticScore >= 0.4);
  if (!filtered.length) {
    return [];
  }

  filtered.sort((a, b) => b.rerankScore - a.rerankScore);

  const sourceFocusedQuery = filtered.some(
    (passage) =>
      containsMetadataMention(input.query, passage.author, passage.title) &&
      passage.rerankScore >= 0.5,
  );

  if (sourceFocusedQuery) {
    return filtered.slice(
      0,
      Math.max(minPassages, Math.min(maxPassages, filtered.length)),
    );
  }

  const selected: RerankedPassage[] = [];
  const seenDocuments = new Set<string>();

  for (const passage of filtered) {
    if (selected.length >= maxPassages) break;
    if (!seenDocuments.has(passage.documentId)) {
      selected.push(passage);
      seenDocuments.add(passage.documentId);
    }
  }

  for (const passage of filtered) {
    if (selected.length >= maxPassages) break;
    if (selected.some((item) => item.chunkId === passage.chunkId)) continue;
    selected.push(passage);
  }

  return selected.slice(0, Math.max(minPassages, Math.min(maxPassages, selected.length)));
}
