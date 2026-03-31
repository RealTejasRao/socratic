export interface ChatImageAttachment {
  type: "image";
  dataUrl: string;
  mimeType: string;
  name: string;
  publicId?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  attachments?: ChatImageAttachment[];
  createdAt: string; // always string on client
}
