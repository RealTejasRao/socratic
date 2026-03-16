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

function overlapScore(a: string, b: string) {
  const aSet = new Set(tokenize(a));
  const bSet = new Set(tokenize(b));
  if (!aSet.size || !bSet.size) return 0;

  let overlap = 0;
  for (const token of aSet) {
    if (bSet.has(token)) overlap += 1;
  }
  return overlap / Math.max(1, Math.min(aSet.size, bSet.size));
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
  const minPassages = input.minPassages ?? 3;
  const maxPassages = input.maxPassages ?? 5;
  if (!input.candidates.length) return [];

  const fusedScores = input.candidates.map((candidate) => candidate.fusedScore);
  const normalizedFused = normalizeScores(fusedScores);

  const rescored: RerankedPassage[] = input.candidates.map((candidate, index) => {
    const queryFit = overlapScore(input.query, candidate.content);
    const userFit = overlapScore(input.userMessage, candidate.content);
    const relevance =
      normalizedFused[index] * 0.55 +
      queryFit * 0.3 +
      userFit * 0.15;

    return {
      ...candidate,
      rerankScore: relevance,
    };
  });

  rescored.sort((a, b) => b.rerankScore - a.rerankScore);

  const selected: RerankedPassage[] = [];
  const seenDocuments = new Set<string>();

  for (const passage of rescored) {
    if (selected.length >= maxPassages) break;
    if (!seenDocuments.has(passage.documentId)) {
      selected.push(passage);
      seenDocuments.add(passage.documentId);
    }
  }

  for (const passage of rescored) {
    if (selected.length >= maxPassages) break;
    if (selected.some((item) => item.chunkId === passage.chunkId)) continue;
    selected.push(passage);
  }

  return selected.slice(0, Math.max(minPassages, Math.min(maxPassages, selected.length)));
}
