import mongoose, { Document, Schema } from 'mongoose';

export interface ICitation {
  filePath: string;
  startLine: number;
  endLine: number;
  snippet: string;
  score: number;
}

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: ICitation[];
  createdAt: Date;
}

export interface IChatSession extends Document {
  repositoryId: mongoose.Types.ObjectId;
  title: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const citationSchema = new Schema<ICitation>(
  {
    filePath: { type: String, required: true },
    startLine: { type: Number, required: true },
    endLine: { type: Number, required: true },
    snippet: { type: String, required: true },
    score: { type: Number, required: true },
  },
  { _id: false }
);

const chatMessageSchema = new Schema<IChatMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    citations: [citationSchema],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatSessionSchema = new Schema<IChatSession>(
  {
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true },
    title: { type: String, default: 'New Chat' },
    messages: [chatMessageSchema],
  },
  { timestamps: true }
);

chatSessionSchema.index({ repositoryId: 1, updatedAt: -1 });

export const ChatSession = mongoose.model<IChatSession>('ChatSession', chatSessionSchema);
