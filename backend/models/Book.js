import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    art: { type: mongoose.Schema.Types.ObjectId, ref: 'Art', required: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    nameArabic: { type: String, trim: true, default: '' },
    author: { type: String, trim: true, default: '' },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'draft',
      index: true,
    },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Book = mongoose.model('Book', bookSchema);