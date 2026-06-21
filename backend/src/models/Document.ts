import mongoose, { Document, Schema } from 'mongoose';

export type DocumentType = 'readme' | 'api_docs' | 'onboarding' | 'folder_structure';

export interface IGeneratedDocument extends Document {
  repositoryId: mongoose.Types.ObjectId;
  type: DocumentType;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const generatedDocumentSchema = new Schema<IGeneratedDocument>(
  {
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true },
    type: {
      type: String,
      enum: ['readme', 'api_docs', 'onboarding', 'folder_structure'],
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

generatedDocumentSchema.index({ repositoryId: 1, type: 1 }, { unique: true });

export const GeneratedDocument = mongoose.model<IGeneratedDocument>(
  'GeneratedDocument',
  generatedDocumentSchema
);
