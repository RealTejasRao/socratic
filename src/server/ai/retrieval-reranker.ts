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

const MAX_CHUNKS_PER_DOC = 1;
const SEMANTIC_CUTOFF = 0.32;
const LEXICAL_CUTOFF = 0.5;

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

function countDistinctDocuments(candidates: RerankedPassage[]) {
  return new Set(candidates.map((candidate) => candidate.documentId)).size;
}

export function rerankRetrievedPassages(input: RerankInput) {
  const minPassages = input.minPassages ?? 4;
  const maxPassages = input.maxPassages ?? 5;
  if (!input.candidates.length) return [];

  const lexicalScores = input.candidates.map(
    (candidate) => candidate.lexicalScore,
  );
  const fusedScores = input.candidates.map((candidate) => candidate.fusedScore);
  const normalizedLexical = normalizeScores(lexicalScores);
  const normalizedFused = normalizeScores(fusedScores);

  const rescored: RerankedPassage[] = input.candidates.map(
    (candidate, index) => {
      const lexicalScore = normalizedLexical[index] ?? 0;
      const fusedScore = normalizedFused[index] ?? 0;
      const semanticScore =
        candidate.semanticScore ?? candidate.embeddingSimilarity ?? 0;
      const relevance =
        semanticScore * 0.75 + lexicalScore * 0.1 + fusedScore * 0.15;

      return {
        ...candidate,
        rerankScore: relevance,
      };
    },
  );

  const filtered = rescored.filter((candidate, index) => {
    const semanticScore =
      candidate.semanticScore ?? candidate.embeddingSimilarity ?? 0;
    const lexicalScore = normalizedLexical[index] ?? 0;
    return !(semanticScore < SEMANTIC_CUTOFF && lexicalScore < LEXICAL_CUTOFF);
  });
  if (!filtered.length) {
    return [];
  }

  filtered.sort((a, b) => b.rerankScore - a.rerankScore);
  const desiredLimit = Math.max(
    minPassages,
    Math.min(maxPassages, filtered.length),
  );
  const sourceFocusedQuery = filtered.some(
    (passage) =>
      containsMetadataMention(input.query, passage.author, passage.title) &&
      passage.rerankScore >= 0.5,
  );
  const shouldPreferDiversity =
    !sourceFocusedQuery || countDistinctDocuments(filtered) > 1;

  const selected: RerankedPassage[] = [];
  const documentCounts = new Map<string, number>();

  if (shouldPreferDiversity) {
    for (const passage of filtered) {
      if (selected.length >= desiredLimit) break;
      const existingCount = documentCounts.get(passage.documentId) ?? 0;
      if (existingCount >= MAX_CHUNKS_PER_DOC) continue;
      selected.push(passage);
      documentCounts.set(passage.documentId, existingCount + 1);
    }
  }

  for (const passage of filtered) {
    if (selected.length >= desiredLimit) break;
    if (selected.some((item) => item.chunkId === passage.chunkId)) continue;
    selected.push(passage);
    documentCounts.set(
      passage.documentId,
      (documentCounts.get(passage.documentId) ?? 0) + 1,
    );
  }

  return selected.slice(0, desiredLimit);
}
