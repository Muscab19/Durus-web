import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

import { Lecture } from '../models/Lecture.js';
import { Book } from '../models/Book.js';
import { requireAuth, adminOnly, optionalAuth, validate } from '../middlewares/middleware.js';
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '../config/r2.js';

const router = Router();

const ALLOWED_AUDIO = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/webm'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

// ---------- Helpers ----------
function extFromName(name) {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i).toLowerCase().replace(/[^a-z0-9.]/g, '');
}

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'file';
}

function pickMediaFolder(contentType) {
  if (ALLOWED_AUDIO.includes(contentType)) return 'audio';
  if (ALLOWED_VIDEO.includes(contentType)) return 'video';
  return null;
}

// ---------- Streaming Upload via multer-s3 ----------
// This file is NEVER stored on the server disk or in RAM.
// It streams directly from the browser → Node → Cloudflare R2.
const upload = multer({
  storage: multerS3({
    s3: r2,
    bucket: R2_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const folder = pickMediaFolder(file.mimetype);
      if (!folder) {
        return cb(new Error(`Unsupported content type: ${file.mimetype}`));
      }
      const ext = extFromName(file.originalname) || (folder === 'audio' ? '.mp3' : '.mp4');
      const rand = crypto.randomBytes(6).toString('hex');
      const base = slugify(file.originalname.replace(/\.[^.]+$/, ''));
      const mediaKey = `lectures/${folder}/${base}-${rand}${ext}`;
      cb(null, mediaKey);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10 GB max per file
  },
  fileFilter: (req, file, cb) => {
    const allowed = [...ALLOWED_AUDIO, ...ALLOWED_VIDEO];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error(`Unsupported content type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

// ---------- Schemas ----------
const createLectureSchema = z.object({
  parent: z.string().trim().min(1).max(200),
  parentArabic: z.string().trim().max(200).optional().default(''),
  course: z.string().trim().min(1).max(200),
  courseArabic: z.string().trim().max(200).optional().default(''),
  book: z.string().trim().min(1).max(200),
  bookArabic: z.string().trim().max(200).optional().default(''),
  title: z.string().trim().min(1).max(200),
  titleArabic: z.string().trim().max(200).optional().default(''),
  description: z.string().trim().max(5000).optional().default(''),
  type: z.enum(['audio', 'video']),
  mediaKey: z.string().trim().min(1).max(500),
  mediaUrl: z.string().trim().url().max(1000),
  durationSeconds: z.number().int().min(0).optional().default(0),
  sizeBytes: z.number().int().min(0).optional().default(0),
  mimeType: z.string().trim().max(100).optional().default(''),
  order: z.number().int().optional().default(0),
  isPublished: z.boolean().optional().default(true),
  artRef: z.string().trim().optional(),
  bookRef: z.string().trim().optional(),
});

const updateLectureSchema = createLectureSchema.partial();

async function hydrateRefs(body) {
  if (!body.bookRef) return body;
  const book = await Book.findById(body.bookRef).populate('art');
  if (!book) return body;
  body.book = book.name;
  body.bookArabic = book.nameArabic || book.name;
  if (book.art) {
    body.artRef = String(book.art._id);
    body.parent = book.art.name;
    body.parentArabic = book.art.nameArabic || book.art.name;
    body.course = book.name;
    body.courseArabic = book.nameArabic || book.name;
  }
  return body;
}

// =========================================================================
// Handlers
// =========================================================================

/**
 * POST /api/lectures/upload
 * Streams the file directly to R2. No RAM/disk overhead.
 * After multer-s3 finishes, req.file contains:
 *   - key      → the R2 object key
 *   - location → the public URL (we construct it manually because R2)
 *   - size     → size in bytes
 *   - mimetype → content type
 */
async function uploadMedia(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No media file provided.' });
    }

    // multer-s3 populates req.file with the key and metadata
    const mediaKey = req.file.key;
    const mediaUrl = `${R2_PUBLIC_URL}/${mediaKey}`;

    return res.status(201).json({
      mediaKey,
      mediaUrl,
      contentType: req.file.mimetype,
      sizeBytes: req.file.size,
    });
  } catch (err) {
    console.error('[upload error]', err);
    next(err);
  }
}

// ---------- Admin: create lecture ----------
async function createLecture(req, res, next) {
  try {
    const body = await hydrateRefs({ ...req.body });
    const doc = await Lecture.create({ ...body, uploadedBy: req.user._id });
    res.status(201).json({ lecture: doc });
  } catch (err) {
    next(err);
  }
}

// ---------- Student/Admin: grouped browse ----------
async function listLectures(req, res, next) {
  try {
    const { parent, course, book, type, q } = req.query;
    const filter = {};
    if (parent) filter.parent = parent;
    if (course) filter.course = course;
    if (book) filter.book = book;
    if (type) filter.type = type;

    const isAdmin = req.user?.role === 'admin';
    if (!(isAdmin && req.query.includeUnpublished === 'true')) {
      filter.isPublished = true;
    }

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { titleArabic: { $regex: q, $options: 'i' } },
        { book: { $regex: q, $options: 'i' } },
        { course: { $regex: q, $options: 'i' } },
        { parent: { $regex: q, $options: 'i' } },
      ];
    }

    if (req.query.latest) {
      const limit = Math.min(parseInt(req.query.latest, 10) || 6, 24);
      const lectures = await Lecture.find(filter).sort({ createdAt: -1 }).limit(limit).select('-__v');
      return res.json({ lectures, totalLectures: lectures.length });
    }

    const wantFlat = !!(parent || course || book || type || q);
    if (wantFlat) {
      const lectures = await Lecture.find(filter).sort({ parent: 1, course: 1, book: 1, order: 1, createdAt: 1 }).select('-__v');
      return res.json({ lectures, totalLectures: lectures.length });
    }

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: { parent: '$parent', course: '$course', book: '$book' },
          parentArabic: { $first: '$parentArabic' },
          courseArabic: { $first: '$courseArabic' },
          bookArabic: { $first: '$bookArabic' },
          lectureCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.parent': 1, '_id.course': 1, '_id.book': 1 } },
    ];

    const rows = await Lecture.aggregate(pipeline);
    const parents = new Map();
    let totalLectures = 0;

    for (const r of rows) {
      const { parent, course, book } = r._id;
      totalLectures += r.lectureCount;

      if (!parents.has(parent)) {
        parents.set(parent, { parent, parentArabic: r.parentArabic || '', courses: new Map() });
      }
      const pNode = parents.get(parent);

      if (!pNode.courses.has(course)) {
        pNode.courses.set(course, { course, courseArabic: r.courseArabic || '', books: [] });
      }
      const cNode = pNode.courses.get(course);

      cNode.books.push({ book, bookArabic: r.bookArabic || '', lectureCount: r.lectureCount });
    }

    const groups = [...parents.values()].map((p) => ({
      parent: p.parent,
      parentArabic: p.parentArabic,
      courses: [...p.courses.values()],
    }));

    res.json({ groups, totalLectures });
  } catch (err) {
    next(err);
  }
}

async function getLecture(req, res, next) {
  try {
    const lecture = await Lecture.findById(req.params.id).select('-__v');
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
    const isAdmin = req.user?.role === 'admin';
    if (!lecture.isPublished && !isAdmin) return res.status(404).json({ message: 'Lecture not found' });
    res.json({ lecture });
  } catch (err) {
    next(err);
  }
}

async function updateLecture(req, res, next) {
  try {
    const body = await hydrateRefs({ ...req.body });
    const lecture = await Lecture.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true }).select('-__v');
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
    res.json({ lecture });
  } catch (err) {
    next(err);
  }
}

// ---------- Admin: delete (also removes file from R2) ----------
async function deleteLecture(req, res, next) {
  try {
    const lecture = await Lecture.findByIdAndDelete(req.params.id);
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });

    // Also delete the file from R2 to save storage costs
    if (lecture.mediaKey) {
      try {
        await r2.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET,
            Key: lecture.mediaKey,
          })
        );
      } catch (r2Err) {
        console.warn('[R2 delete warning]', r2Err.message);
        // Don't fail the request if R2 delete fails
      }
    }

    res.json({ message: 'Lecture deleted', id: lecture._id });
  } catch (err) {
    next(err);
  }
}

// =========================================================================
// Routes
// =========================================================================

router.post('/upload', requireAuth, adminOnly, upload.single('file'), uploadMedia);
router.post('/', requireAuth, adminOnly, validate(createLectureSchema), createLecture);
router.get('/', optionalAuth, listLectures);
router.get('/:id', optionalAuth, getLecture);
router.patch('/:id', requireAuth, adminOnly, validate(updateLectureSchema), updateLecture);
router.delete('/:id', requireAuth, adminOnly, deleteLecture);

export default router;