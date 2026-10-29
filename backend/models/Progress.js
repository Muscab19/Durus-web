import mongoose from 'mongoose';

const rangeSchema = new mongoose.Schema(
  {
    start: { type: Number, required: true, min: 0 },
    end: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture',
      required: true,
      index: true,
    },

    // Denormalized for fast aggregate queries (avoids $lookup)
    parent: { type: String, required: true, index: true },
    course: { type: String, required: true, index: true },
    book: { type: String, required: true, index: true },

    // ---- Playback state ----
    lastPositionSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    watchedRanges: {
      type: [rangeSchema],
      default: [],
    },

    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },

    lastPlayedAt: {
      type: Date,
      default: Date.now,
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

// One progress doc per user per lecture
progressSchema.index({ user: 1, lecture: 1 }, { unique: true });

// For aggregates: "all progress of user X in book Y"
progressSchema.index({ user: 1, book: 1 });
progressSchema.index({ user: 1, course: 1 });
progressSchema.index({ user: 1, parent: 1 });

export const Progress = mongoose.model('Progress', progressSchema);