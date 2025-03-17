import { Schema, model, Document } from 'mongoose';

export interface IImage extends Document {
  userId: string;
  identifier: string;
  filePath: string;
  height: number;
  width: number;
  fileSize: number;
  imageType: string;
  uploadDate: Date;
  filename: string;
}

const ImageSchema = new Schema<IImage>({
  userId: { type: String, required: true, index: true },
  identifier: { type: String, required: true, unique: true },
  filePath: { type: String, required: true },
  height: { type: Number, required: true },
  width: { type: Number, required: true },
  fileSize: { type: Number, required: true },
  imageType: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  filename: { type: String, required: true }
});

// Add indexes for faster queries
ImageSchema.index({ userId: 1 });
ImageSchema.index({ identifier: 1 }, { unique: true });

export const Image = model<IImage>('Image', ImageSchema); 