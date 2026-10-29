import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema(
  {
    // ---- Grouping (all plain strings — no separate collections) ----
    parent: {
      type: String,
      required: [true, 'Parent is required'],
      trim: true,
      index: true,
      // e.g. "Arabic Language and Literature"
    },
    parentArabic: { type: String, trim: true, default: '' },

    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
      index: true,
      // e.g. "Nahwa"
    },
    courseArabic: { type: String, trim: true, default: '' },

    book: {
      type: String,
      required: [true, 'Book is required'],
      trim: true,
      index: true,
      // e.g. "Alfiyah Bin Malik"
    },
    bookArabic: { type: String, trim: true, default: '' },

    artRef: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Art', 
      index: true 
    },
    bookRef: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Book', 
      index: true 
    },

    // ---- Lecture info ----
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    titleArabic: { type: String, trim: true, default: '' },

    description: { type: String, trim: true, default: '' },

    // ---- Media ----
    type: {
      type: String,
      enum: ['audio', 'video'],
      required: true,
      index: true,
    },
    mediaKey: {
      type: String,
      required: true, // R2 object key
    },
    mediaUrl: {
      type: String,
      required: true, // R2 public URL
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    sizeBytes: {
      type: Number,
      default: 0,
      min: 0,
    },
    mimeType: {
      type: String,
      default: '',
    },

    // ---- Ordering & visibility ----
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
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

// ---- Compound indexes for the browse views ----
lectureSchema.index({ parent: 1, course: 1, book: 1, order: 1 });
lectureSchema.index({ parent: 1, course: 1 });
lectureSchema.index({ title: 'text', titleArabic: 'text', book: 'text' });

export const Lecture = mongoose.model('Lecture', lectureSchema);