import { Prisma } from "@prisma/client";
import { prisma } from "src/server/db/client";
import type {
  LexicalCandidate,
  RetrievedPassage,
  VectorCandidate,
} from "src/server/ai/hybrid-retrieval";
import type { RerankedPassage } from "src/server/ai/retrieval-reranker";

export async function storeRetrievalTrace(params: {
  userId: string;
  sessionId: string;
  sourceMessageId?: string;
  rawUserQuery: string;
  retrievalQuery: string;
  vectorCandidates: VectorCandidate[];
  lexicalCandidates: LexicalCandidate[];
  fusedCandidates: RetrievedPassage[];
  rerankedCandidates: RerankedPassage[];
  selectedPassages: RerankedPassage[];
  retrievalLatencyMs: number;
}) {
  await prisma.retrievalTrace.create({
    data: {
      userId: params.userId,
      sessionId: params.sessionId,
      sourceMessageId: params.sourceMessageId ?? null,
      rawUserQuery: params.rawUserQuery,
      retrievalQuery: params.retrievalQuery,
      vectorCandidates: params.vectorCandidates as unknown as Prisma.InputJsonValue,
      lexicalCandidates: params.lexicalCandidates as unknown as Prisma.InputJsonValue,
      fusedCandidates: params.fusedCandidates as unknown as Prisma.InputJsonValue,
      rerankedCandidates: params.rerankedCandidates as unknown as Prisma.InputJsonValue,
      selectedPassages: params.selectedPassages as unknown as Prisma.InputJsonValue,
      retrievalLatencyMs: params.retrievalLatencyMs,
    },
  });
}
