export interface Citation {
  source: string;
  page: number | string;
  block_type: "text" | "table";
  rerank_score: number;
  snippet: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  toolCallsMade?: string[];
  timestamp: Date;
}

export interface ChatResponse {
  session_id: string;
  answer: string;
  citations: Citation[];
  tool_calls_made: string[];
}

export interface UploadResponse {
  filename: string;
  chunks_indexed: number;
  message: string;
}
