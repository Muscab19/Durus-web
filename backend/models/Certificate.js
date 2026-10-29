import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['book', 'art'], required: true },
  artId: { type: mongoose.Schema.Types.ObjectId, ref: 'Art', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  score: { type: Number, required: true },
  examiner: { type: String, required: true },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['issued', 'pending', 'revoked'], default: 'issued' },
  issuedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Certificate = mongoose.model('Certificate', certificateSchema);