import Link from "next/link";
import { notFound } from "next/navigation";
import type { ChatImageAttachment } from "src/types/chat";
import { prisma } from "src/server/db/client";
import { readShareToken } from "src/server/chat/share-token";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SharedChatPage({ params }: Props) {
  const { token } = await params;
  const payload = readShareToken(token);

  if (!payload) {
    notFound();
  }

  const session = await prisma.chatSession.findUnique({
    where: { id: payload.sessionId },
    select: {
      id: true,
      title: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          attachments: true,
        },
      },
    },
  });

  if (!session) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white px-5 py-10">
      <div className="mx-auto max-w-[760px]">
        <div className="mb-8 border-b border-black/10 pb-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
            Shared Chat
          </p>
          <h1 className="mt-2 text-[28px] font-normal tracking-[-0.03em] text-slate-900 [font-family:Georgia,serif]">
            {session.title || "Socratic AI chat"}
          </h1>
          <p className="mt-2 text-[12px] text-slate-500">
            Read-only share from Socratic AI.
          </p>
        </div>

        <div className="space-y-4">
          {session.messages.map(
            (message: (typeof session.messages)[number]) => {
              const isUser = message.role === "USER";
              const attachments = Array.isArray(message.attachments)
                ? (message.attachments as unknown as ChatImageAttachment[])
                : [];

              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  {isUser && (
                    <div className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
                      You
                    </div>
                  )}

                  <div
                    className={
                      isUser
                        ? "[font-family:Poppins,sans-serif] max-w-[560px] whitespace-pre-wrap rounded-[14px] border border-slate-300 bg-[#f4f4f4] px-3.5 py-3 text-[13px] text-slate-900"
                        : "max-w-[560px] whitespace-pre-wrap bg-transparent px-1 py-1 text-[13px] leading-[27px] tracking-[0.02em] text-slate-950 [font-family:Georgia,serif]"
                    }
                  >
                    {attachments.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {attachments.map((attachment, attachmentIndex) => (
                          <a
                            key={`${attachment.name}-${attachmentIndex}`}
                            href={attachment.dataUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={attachment.dataUrl}
                              alt={attachment.name}
                              className="h-24 w-24 object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                    {message.content}
                  </div>
                </div>
              );
            },
          )}
        </div>

        <div className="mt-10 border-t border-black/10 pt-5 text-center">
          <Link
            href="/"
            className="inline-flex rounded-[10px] border border-slate-300 px-3.5 py-1.5 text-[11px] text-slate-700 transition hover:bg-slate-50"
          >
            Open Socratic AI
          </Link>
        </div>
      </div>
    </main>
  );
}
