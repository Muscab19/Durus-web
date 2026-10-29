import { Router } from 'express';
import mongoose from 'mongoose';
import { Art } from '../models/Art.js';
import { Book } from '../models/Book.js';
import { Lecture } from '../models/Lecture.js';
import { optionalAuth } from '../middlewares/middleware.js';

const router = Router();

/**
 * GET /api/browse
 * GET /api/browse?artId=xxx
 * GET /api/browse?bookId=yyy
 *
 * Three modes:
 *  1. No params      → { arts: [{ id, name, nameEn, bookCount, lectureCount }] }
 *  2. artId=x        → { art: {...}, books: [{ id, name, nameEn, author, lectureCount }] }
 *  3. bookId=y       → { book: {...}, art: {...}, lectures: [{ id, title, type, durationSeconds }] }
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { artId, bookId } = req.query;

    // ---------- Level 3: Book → Lectures ----------
    if (bookId) {
      if (!mongoose.isValidObjectId(bookId)) {
        return res.status(400).json({ message: 'Invalid book id' });
      }

      const book = await Book.findById(bookId).populate('art').lean();
      if (!book) return res.status(404).json({ message: 'Book not found' });

      // Get lectures for this book, only published ones (unless admin)
      const isAdmin = req.user?.role === 'admin';
      const lectureFilter = { bookRef: book._id };
      if (!isAdmin) lectureFilter.isPublished = true;

      const lectures = await Lecture.find(lectureFilter)
        .sort({ order: 1, createdAt: 1 })
        .select('title titleArabic type durationSeconds isPublished order')
        .lean();

      return res.json({
        art: book.art ? {
          id: String(book.art._id),
          name: book.art.name,
          nameEn: book.art.nameEn || book.art.name,
        } : null,
        book: {
          id: String(book._id),
          name: book.name,
          nameEn: book.nameEn || book.name,
          author: book.author || '',
          level: book.level,
        },
        lectures: lectures.map(l => ({
          id: String(l._id),
          title: l.title,
          titleArabic: l.titleArabic,
          type: l.type,
          durationSeconds: l.durationSeconds || 0,
          isPublished: l.isPublished,
        })),
      });
    }

    // ---------- Level 2: Art → Books ----------
    if (artId) {
      if (!mongoose.isValidObjectId(artId)) {
        return res.status(400).json({ message: 'Invalid art id' });
      }

      const art = await Art.findById(artId).lean();
      if (!art) return res.status(404).json({ message: 'Art not found' });

      const books = await Book.find({ art: artId })
        .sort({ order: 1, name: 1 })
        .lean();

      // Count lectures per book
      const bookIds = books.map(b => b._id);
      const lectureCounts = await Lecture.aggregate([
        { $match: { bookRef: { $in: bookIds }, isPublished: true } },
        { $group: { _id: '$bookRef', count: { $sum: 1 } } },
      ]);
      const countMap = new Map(lectureCounts.map(lc => [String(lc._id), lc.count]));

      return res.json({
        art: {
          id: String(art._id),
          name: art.name,
          nameEn: art.nameEn || art.name,
        },
        books: books.map(b => ({
          id: String(b._id),
          name: b.name,
          nameEn: b.nameEn || b.name,
          author: b.author || '',
          level: b.level,
          lectureCount: countMap.get(String(b._id)) || 0,
        })),
      });
    }

    // ---------- Level 1: All Arts ----------
    const arts = await Art.find().sort({ order: 1, name: 1 }).lean();
    const artIds = arts.map(a => a._id);

    const bookCounts = await Book.aggregate([
      { $match: { art: { $in: artIds } } },
      { $group: { _id: '$art', count: { $sum: 1 } } },
    ]);
    const bookCountMap = new Map(bookCounts.map(bc => [String(bc._id), bc.count]));

    // Count published lectures per art
    const lectureCounts = await Lecture.aggregate([
      { $match: { isPublished: true } },
      {
        $group: {
          _id: '$artRef',
          count: { $sum: 1 },
        },
      },
    ]);
    const lectureCountMap = new Map(lectureCounts.map(lc => [String(lc._id), lc.count]));

    res.json({
      arts: arts.map(a => ({
        id: String(a._id),
        name: a.name,
        nameEn: a.nameEn || a.name,
        bookCount: bookCountMap.get(String(a._id)) || 0,
        lectureCount: lectureCountMap.get(String(a._id)) || 0,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;