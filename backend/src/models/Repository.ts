import mongoose, { Document, Schema } from 'mongoose';

export type RepositoryStatus = 'pending' | 'cloning' | 'parsing' | 'embedding' | 'ready' | 'failed';

export interface IRepository extends Document {
  owner: string;
  repo: string;
  url: string;
  branch: string;
  description?: string;
  status: RepositoryStatus;
  statusMessage?: string;
  fileCount: number;
  chunkCount: number;
  language?: string;
  localPath: string;
  collectionName: string;
  error?: string;
  indexedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const repositorySchema = new Schema<IRepository>(
  {
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    url: { type: String, required: true },
    branch: { type: String, default: 'main' },
    description: { type: String },
    status: {
      type: String,
      enum: ['pending', 'cloning', 'parsing', 'embedding', 'ready', 'failed'],
      default: 'pending',
    },
    statusMessage: { type: String },
    fileCount: { type: Number, default: 0 },
    chunkCount: { type: Number, default: 0 },
    language: { type: String },
    localPath: { type: String, required: true },
    collectionName: { type: String, required: true, unique: true },
    error: { type: String },
    indexedAt: { type: Date },
  },
  { timestamps: true }
);

repositorySchema.index({ owner: 1, repo: 1 }, { unique: true });

export const Repository = mongoose.model<IRepository>('Repository', repositorySchema);
