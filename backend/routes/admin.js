import { Router } from 'express';
import { Lecture } from '../models/Lecture.js';
import { User } from '../models/User.js';
import { Progress } from '../models/Progress.js';
import { Certificate } from '../models/Certificate.js';
import { requireAuth, adminOnly } from '../middlewares/middleware.js';

const router = Router();

router.use(requireAuth, adminOnly);

/**
 * GET /api/admin/overview
 * Returns everything the admin Overview page needs in one shot.
 */
router.get('/overview', async (_req, res, next) => {
  try {
    // Totals
    const [lectureAgg] = await Lecture.aggregate([
      {
        $group: {
          _id: null,
          totalLectures: { $sum: 1 },
          totalSeconds: { $sum: '$durationSeconds' },
        },
      },
    ]);

    const totalLectures = lectureAgg?.totalLectures || 0;
    const totalSeconds = lectureAgg?.totalSeconds || 0;
    const totalHours = Math.round(totalSeconds / 360) / 10; // 1 decimal

    const totalUsers = await User.countDocuments({ role: 'student' });

    // Distinct books
    const bookKeys = await Lecture.distinct('book');
    const totalBooks = bookKeys.length;

    // Arts distribution (grouped by parent)
    const artsAgg = await Lecture.aggregate([
      {
        $group: {
          _id: {
            parent: '$parent',
            parentArabic: '$parentArabic',
          },
          lectures: { $sum: 1 },
          books: { $addToSet: '$book' },
          courses: { $addToSet: '$course' },
        },
      },
      { $sort: { lectures: -1 } },
    ]);

    const arts = artsAgg.map((a) => ({
      parent: a._id.parent,
      parentArabic: a._id.parentArabic || a._id.parent,
      lectures: a.lectures,
      books: a.books.length,
      courses: a.courses.length,
    }));

    // Recent lectures (5 newest)
    const recentLectures = await Lecture.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title titleArabic parent parentArabic course courseArabic book bookArabic type durationSeconds createdAt')
      .lean();

    // Recent users (5 newest students)
    const recentUsers = await User.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name phone email role createdAt')
      .lean();

    // Attach lecture counts per recent user
    const userIds = recentUsers.map((u) => u._id);
    const progressCounts = await Progress.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(progressCounts.map((p) => [String(p._id), p.count]));

    const users = recentUsers.map((u) => ({
      id: String(u._id),
      name: u.name,
      phone: u.phone,
      email: u.email || '',
      role: u.role,
      joined: u.createdAt,
      lectures: countMap.get(String(u._id)) || 0,
    }));

    res.json({
      stats: {
        totalLectures,
        totalBooks,
        totalUsers,
        totalHours,
      },
      arts,
      recentLectures: recentLectures.map((l) => ({
        id: String(l._id),
        title: l.title,
        titleArabic: l.titleArabic,
        parent: l.parent,
        parentArabic: l.parentArabic,
        course: l.course,
        courseArabic: l.courseArabic,
        book: l.book,
        bookArabic: l.bookArabic,
        type: l.type,
        durationSeconds: l.durationSeconds,
      })),
      recentUsers: users,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/students
 * Fetches all students and aggregates their progress data
 */
router.get('/students', async (_req, res, next) => {
  try {
    // 1. Get all students
    const students = await User.find({ role: 'student' }).select('name phone createdAt').lean();

    // 2. Aggregate progress per student
    const progressAgg = await Progress.aggregate([
      {
        $group: {
          _id: '$user',
          lecturesStarted: { $sum: 1 },
          lecturesCompleted: { $sum: { $cond: ['$completed', 1, 0] } },
          uniqueSeconds: { $sum: '$uniqueSeconds' },
          lastActive: { $max: '$lastPlayedAt' }
        }
      }
    ]);

    const progressMap = new Map();
    for (const p of progressAgg) {
      progressMap.set(String(p._id), p);
    }

    // 3. Merge data
    const result = students.map(s => {
      const p = progressMap.get(String(s._id)) || {};
      return {
        id: String(s._id),
        name: s.name,
        phone: s.phone,
        joined: s.createdAt,
        lecturesStarted: p.lecturesStarted || 0,
        lecturesCompleted: p.lecturesCompleted || 0,
        hoursListened: Math.round(((p.uniqueSeconds || 0) / 3600) * 10) / 10,
        lastActive: p.lastActive || s.createdAt, // fallback to join date if no activity
        streak: 0, // TODO: Implement streak calculation logic later
      };
    });

    res.json({ students: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/users
 * Fetches all users (admins, supervisors, students)
 */
router.get('/users', async (_req, res, next) => {
  try {
    const users = await User.find()
      .select('name phone email role isActive createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    // Map isActive -> status for the frontend
    const mapped = users.map(u => ({
      id: String(u._id),
      name: u.name,
      email: u.email || u.phone, // fallback to phone if email missing
      phone: u.phone,
      role: u.role,
      status: u.isActive ? 'active' : 'suspended',
      joined: u.createdAt,
      lastActive: u.updatedAt, // Using updatedAt as a proxy for last activity
      lectures: 0, // Optional: you can aggregate progress here if needed
      certificates: 0,
    }));

    res.json({ users: mapped });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/users/:id
 * Updates a user's role or active status
 */
router.patch('/users/:id', async (req, res, next) => {
  try {
    const { role, status } = req.body;
    const update = {};
    
    if (role) update.role = role;
    if (status) update.isActive = status === 'active';

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/users/:id
 */
router.delete('/users/:id', async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/certificates
 * Fetches all certificates with populated student/art/book data
 */
router.get('/certificates', async (_req, res, next) => {
  try {
    const certs = await Certificate.find()
      .populate('studentId', 'name phone')
      .populate('artId', 'name')
      .populate('bookId', 'name')
      .sort({ issuedAt: -1 })
      .lean();

    res.json({ certificates: certs });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/certificates
 * Issues a new certificate
 */
router.post('/certificates', async (req, res, next) => {
  try {
    const { studentId, type, artId, bookId, score, examiner, notes } = req.body;
    
    // Generate certificate number (e.g., CERT-2026-0001)
    const year = new Date().getFullYear();
    const count = await Certificate.countDocuments();
    const number = `CERT-${year}-${String(count + 1).padStart(4, '0')}`;

    const cert = await Certificate.create({
      number, studentId, type, artId, bookId: type === 'book' ? bookId : undefined, score, examiner, notes
    });

    const populated = await Certificate.findById(cert._id)
      .populate('studentId', 'name phone')
      .populate('artId', 'name')
      .populate('bookId', 'name')
      .lean();

    res.status(201).json({ certificate: populated });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/certificates/:id/status
 * Revokes or restores a certificate
 */
router.patch('/certificates/:id/status', async (req, res, next) => {
  try {
    const cert = await Certificate.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status }, 
      { new: true }
    );
    res.json({ certificate: cert });
  } catch (err) {
    next(err);
  }
});

export default router;