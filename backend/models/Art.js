import mongoose from 'mongoose';

const artSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    nameArabic: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
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

export const Art = mongoose.model('Art', artSchema);