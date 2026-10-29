import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';

import { Progress } from '../models/Progress.js';
import { Lecture } from '../models/Lecture.js';
import { requireAuth, validate } from '../middlewares/middleware.js';
import { mergeRange } from '../utils/watchedRanges.js';

const router = Router();

// =========================================================================
// Schemas
// =========================================================================

const heartbeatSchema = z.object({
  // Where the player currently is (for resume)
  positionSeconds: z.number().min(0),

  // A playback chunk the client just watched, e.g. [120, 135]
  rangeStart: z.number().min(0).optional(),
  rangeEnd: z.number().min(0).optional(),

  // Total media duration (client knows it best)
  durationSeconds: z.number().min(0).optional(),
});

// =========================================================================
// Helpers
// =========================================================================

const COMPLETE_RATIO = 0.95;

function computeCompleted(uniqueSeconds, durationSeconds) {
  if (!durationSeconds || durationSeconds <= 0) return false;
  return uniqueSeconds / durationSeconds >= COMPLETE_RATIO;
}

// =========================================================================
// Handlers
// =========================================================================

/**
 * POST /api/progress/:lectureId
 * Called periodically by the player (~every 10–15s) and on pause/unload.
 *
 * Body: { positionSeconds, rangeStart?, rangeEnd?, durationSeconds? }
 *
 * Returns the updated progress document.
 */
async function upsertProgress(req, res, next) {
  try {
    const { lectureId } = req.params;

    if (!mongoose.isValidObjectId(lectureId)) {
      return res.status(400).json({ message: 'Invalid lecture id' });
    }

    const lecture = await Lecture.findById(lectureId).select(
      'parent course book durationSeconds type isPublished'
    );
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }
    if (!lecture.isPublished && req.user.role !== 'admin') {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    const { positionSeconds, rangeStart, rangeEnd, durationSeconds } = req.body;

    // Effective duration: prefer client-reported, fall back to stored
    const effDuration = durationSeconds && durationSeconds > 0
      ? durationSeconds
      : lecture.durationSeconds || 0;

    // Load or create progress doc
    let progress = await Progress.findOne({
      user: req.user._id,
      lecture: lecture._id,
    });

    if (!progress) {
      progress = new Progress({
        user: req.user._id,
        lecture: lecture._id,
        parent: lecture.parent,
        course: lecture.course,
        book: lecture.book,
        lastPositionSeconds: 0,
        uniqueSeconds: 0,
        watchedRanges: [],
        completed: false,
      });
    }

    // Merge in the new watched range (if provided)
    if (
      typeof rangeStart === 'number' &&
      typeof rangeEnd === 'number' &&
      rangeEnd > rangeStart
    ) {
      const { ranges, totalSeconds } = mergeRange(
        progress.watchedRanges,
        rangeStart,
        rangeEnd
      );
      progress.watchedRanges = ranges;
      progress.uniqueSeconds = totalSeconds;
    }

    progress.lastPositionSeconds = positionSeconds;
    progress.lastPlayedAt = new Date();

    // Mark complete?
    if (!progress.completed && computeCompleted(progress.uniqueSeconds, effDuration)) {
      progress.completed = true;
      progress.completedAt = new Date();
    }

    await progress.save();

    // Also persist the duration on the lecture if the client first-time reported it
    if ((!lecture.durationSeconds || lecture.durationSeconds === 0) && effDuration > 0) {
      await Lecture.updateOne({ _id: lecture._id }, { $set: { durationSeconds: Math.round(effDuration) } });
    }

    res.json({ progress });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/progress/lecture/:lectureId
 * Returns the current user's progress for a single lecture.
 * Used on player open to resume from `lastPositionSeconds`.
 */
async function getLectureProgress(req, res, next) {
  try {
    const { lectureId } = req.params;

    if (!mongoose.isValidObjectId(lectureId)) {
      return res.status(400).json({ message: 'Invalid lecture id' });
    }

    const progress = await Progress.findOne({
      user: req.user._id,
      lecture: lectureId,
    });

    // Not an error — it just means they haven't started it yet
    res.json({
      progress: progress || {
        lecture: lectureId,
        lastPositionSeconds: 0,
        uniqueSeconds: 0,
        completed: false,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/progress/me
 * Returns aggregate stats for the logged-in user.
 *
 * Response shape:
 * {
 *   totals: { uniqueSeconds, lecturesStarted, lecturesCompleted },
 *   byParent: [ { parent, lecturesStarted, lecturesCompleted, uniqueSeconds } ],
 *   byCourse: [ { parent, course, ... } ],
 *   byBook:   [ { parent, course, book, ... } ]
 * }
 */
async function mySummary(req, res, next) {
  try {
    const userId = req.user._id;

    const [totalsAgg] = await Progress.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          uniqueSeconds: { $sum: '$uniqueSeconds' },
          lecturesStarted: { $sum: 1 },
          lecturesCompleted: { $sum: { $cond: ['$completed', 1, 0] } },
        },
      },
    ]);

    const totals = totalsAgg || {
      uniqueSeconds: 0,
      lecturesStarted: 0,
      lecturesCompleted: 0,
    };

    const groupBy = (keyFields) =>
      Progress.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: Object.fromEntries(keyFields.map((k) => [k, `$${k}`])),
            uniqueSeconds: { $sum: '$uniqueSeconds' },
            lecturesStarted: { $sum: 1 },
            lecturesCompleted: { $sum: { $cond: ['$completed', 1, 0] } },
          },
        },
        { $sort: { '_id.parent': 1, '_id.course': 1, '_id.book': 1 } },
      ]);

    const [byParent, byCourse, byBook] = await Promise.all([
      groupBy(['parent']),
      groupBy(['parent', 'course']),
      groupBy(['parent', 'course', 'book']),
    ]);

    res.json({
      totals: {
        uniqueSeconds: totals.uniqueSeconds || 0,
        lecturesStarted: totals.lecturesStarted || 0,
        lecturesCompleted: totals.lecturesCompleted || 0,
      },
      byParent: byParent.map((r) => ({ parent: r._id.parent, ...pickStats(r) })),
      byCourse: byCourse.map((r) => ({
        parent: r._id.parent,
        course: r._id.course,
        ...pickStats(r),
      })),
      byBook: byBook.map((r) => ({
        parent: r._id.parent,
        course: r._id.course,
        book: r._id.book,
        ...pickStats(r),
      })),
    });
  } catch (err) {
    next(err);
  }
}

function pickStats(row) {
  return {
    uniqueSeconds: row.uniqueSeconds || 0,
    lecturesStarted: row.lecturesStarted || 0,
    lecturesCompleted: row.lecturesCompleted || 0,
  };
}

/**
 * GET /api/progress/book?parent=&course=&book=
 * Returns aggregated progress for the current user within one book:
 * {
 *   parent, course, book,
 *   totalLectures,          // how many published lectures in this book
 *   lecturesStarted,        // how many the user has begun
 *   lecturesCompleted,      // how many at >= 95%
 *   uniqueSeconds,          // total time spent
 *   percent,                // completed / totalLectures
 *   lectureProgress: [ { lectureId, lastPositionSeconds, uniqueSeconds, completed } ]
 * }
 */
async function bookProgress(req, res, next) {
  try {
    const { parent, course, book } = req.query;
    if (!parent || !course || !book) {
      return res.status(400).json({ message: 'parent, course, and book are required' });
    }

    const lectureFilter = { parent, course, book, isPublished: true };
    const lectureIds = await Lecture.find(lectureFilter).distinct('_id');
    const totalLectures = lectureIds.length;

    const progresses = await Progress.find({
      user: req.user._id,
      lecture: { $in: lectureIds },
    }).select('lecture lastPositionSeconds uniqueSeconds completed lastPlayedAt');

    const lectureProgress = progresses.map((p) => ({
      lectureId: p.lecture,
      lastPositionSeconds: p.lastPositionSeconds,
      uniqueSeconds: p.uniqueSeconds,
      completed: p.completed,
      lastPlayedAt: p.lastPlayedAt,
    }));

    const lecturesCompleted = progresses.filter((p) => p.completed).length;
    const lecturesStarted = progresses.length;
    const uniqueSeconds = progresses.reduce((s, p) => s + (p.uniqueSeconds || 0), 0);

    res.json({
      parent,
      course,
      book,
      totalLectures,
      lecturesStarted,
      lecturesCompleted,
      uniqueSeconds,
      percent: totalLectures > 0 ? lecturesCompleted / totalLectures : 0,
      lectureProgress,
    });
  } catch (err) {
    next(err);
  }
}

// =========================================================================
// Routes — all require auth
// =========================================================================

router.post('/:lectureId', requireAuth, validate(heartbeatSchema), upsertProgress);
router.get('/lecture/:lectureId', requireAuth, getLectureProgress);
router.get('/me', requireAuth, mySummary);
router.get('/book', requireAuth, bookProgress);

export default router;