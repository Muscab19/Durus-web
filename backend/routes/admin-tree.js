import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';

import { Art } from '../models/Art.js';
import { Book } from '../models/Book.js';
import { Lecture } from '../models/Lecture.js';
import { requireAuth, adminOnly, validate } from '../middlewares/middleware.js';

const router = Router();
router.use(requireAuth, adminOnly);

/* =========================================================
   Schemas
   ========================================================= */

const artSchema = z.object({
  name: z.string().trim().min(1).max(200),
  nameArabic: z.string().trim().max(200).optional().default(''),
  status: z.enum(['published', 'draft', 'archived']).optional().default('published'),
  order: z.number().int().optional().default(0),
});

const bookSchema = z.object({
  name: z.string().trim().min(1).max(200),
  nameArabic: z.string().trim().max(200).optional().default(''),
  author: z.string().trim().max(200).optional().default(''),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('beginner'),
  status: z.enum(['published', 'draft', 'archived']).optional().default('draft'),
  order: z.number().int().optional().default(0),
});

const lecturePatchSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  titleArabic: z.string().trim().max(300).optional(),
  type: z.enum(['audio', 'video']).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  status: z.enum(['published', 'draft', 'archived']).optional(),
});

/* =========================================================
   GET /api/admin/tree
   Returns the full tree: arts → books → lectures
   ========================================================= */

router.get('/tree', async (_req, res, next) => {
  try {
    const [arts, books, lectures] = await Promise.all([
      Art.find().sort({ order: 1, name: 1 }).lean(),
      Book.find().sort({ order: 1, name: 1 }).lean(),
      Lecture.find()
        .select('title titleArabic type durationSeconds isPublished bookRef artRef course book parent createdAt order')
        .sort({ order: 1, createdAt: 1 })
        .lean(),
    ]);

    const statusOf = (isPublished) => (isPublished ? 'published' : 'draft');

    const lecturesByBook = new Map();
    for (const l of lectures) {
      const key = String(l.bookRef || '');
      if (!lecturesByBook.has(key)) lecturesByBook.set(key, []);
      lecturesByBook.get(key).push({
        id: String(l._id),
        title: l.titleArabic || l.title,
        type: l.type,
        duration: l.durationSeconds || 0,
        status: statusOf(l.isPublished),
        isPublished: l.isPublished,
      });
    }

    const booksByArt = new Map();
    for (const b of books) {
      const key = String(b.art);
      if (!booksByArt.has(key)) booksByArt.set(key, []);
      booksByArt.get(key).push({
        id: String(b._id),
        name: b.nameArabic || b.name,
        nameEn: b.name,
        author: b.author,
        level: b.level,
        status: b.status,
        lectures: lecturesByBook.get(String(b._id)) || [],
      });
    }

    const tree = arts.map((a) => ({
      id: String(a._id),
      name: a.nameArabic || a.name,
      nameEn: a.name,
      status: a.status,
      books: booksByArt.get(String(a._id)) || [],
    }));

    res.json({ tree });
  } catch (err) {
    next(err);
  }
});

/* =========================================================
   Arts — create / update / delete
   ========================================================= */

router.post('/arts', validate(artSchema), async (req, res, next) => {
  try {
    const art = await Art.create(req.body);
    res.status(201).json({ art });
  } catch (err) {
    next(err);
  }
});

router.patch('/arts/:id', validate(artSchema.partial()), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const art = await Art.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!art) return res.status(404).json({ message: 'Art not found' });
    res.json({ art });
  } catch (err) {
    next(err);
  }
});

router.delete('/arts/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const books = await Book.find({ art: id }).select('_id').lean();
    const bookIds = books.map((b) => b._id);

    await Promise.all([
      Lecture.deleteMany({ $or: [{ artRef: id }, { bookRef: { $in: bookIds } }] }),
      Book.deleteMany({ art: id }),
    ]);
    await Art.findByIdAndDelete(id);

    res.json({ message: 'Art deleted', id });
  } catch (err) {
    next(err);
  }
});

/* =========================================================
   Books — create / update / delete
   ========================================================= */

router.post('/arts/:artId/books', validate(bookSchema), async (req, res, next) => {
  try {
    const { artId } = req.params;
    if (!mongoose.isValidObjectId(artId)) {
      return res.status(400).json({ message: 'Invalid art id' });
    }
    const art = await Art.findById(artId);
    if (!art) return res.status(404).json({ message: 'Art not found' });

    const book = await Book.create({ ...req.body, art: artId });
    res.status(201).json({ book });
  } catch (err) {
    next(err);
  }
});

router.patch('/books/:id', validate(bookSchema.partial()), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ book });
  } catch (err) {
    next(err);
  }
});

router.delete('/books/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    await Lecture.deleteMany({ bookRef: id });
    await Book.findByIdAndDelete(id);
    res.json({ message: 'Book deleted', id });
  } catch (err) {
    next(err);
  }
});

/* =========================================================
   Lectures — patch (title, type, duration, status)
   Create is handled by the existing /api/lectures route,
   which now accepts bookRef + artRef in its body.
   ========================================================= */

router.patch('/lectures/:id', validate(lecturePatchSchema), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const patch = { ...req.body };
    if (typeof patch.durationSeconds === 'number') {
      patch.durationSeconds = Math.max(0, patch.durationSeconds);
    }
    if (patch.status) {
      patch.isPublished = patch.status === 'published';
      delete patch.status;
    }
    const lecture = await Lecture.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
    res.json({ lecture });
  } catch (err) {
    next(err);
  }
});

export default router;