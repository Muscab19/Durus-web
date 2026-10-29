import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { requireAuth, validate } from '../middlewares/middleware.js';

const router = Router();;

// ---------- Schemas ----------

// E.164: + followed by 7-15 digits, first digit 1-9
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, 'رقم الهاتف يجب أن يكون بالصيغة الدولية، مثال: +252612345678');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'الاسم قصير جدًا').max(100),
  phone: phoneSchema,
  email: z.union([z.string().trim().toLowerCase().email(), z.literal('')]).optional(),
  password: z.string().min(8, 'كلمة المرور 8 أحرف على الأقل').max(128),
});

const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1).max(128),
});

// ---------- Handlers ----------

async function register(req, res, next) {
  try {
    const { name, phone, email, password } = req.body;

    if (await User.findByPhone(phone)) {
      return res.status(409).json({ message: 'رقم الهاتف مسجّل مسبقًا' });
    }

    const user = new User({ name, phone, email: email || '', role: 'student' });
    await user.setPassword(password);
    await user.save();

    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { phone, password } = req.body;

    const user = await User.findByPhone(phone).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'الحساب معطّل' });
    }

    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    res.json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}



const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().optional(),
});

/**
 * PATCH /api/auth/profile
 * Updates the current user's name and phone.
 */
router.patch('/profile', requireAuth, validate(updateProfileSchema), async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.phone = req.body.phone;

    await user.save();
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// ---------- Routes ----------

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', requireAuth, me);

export default router;