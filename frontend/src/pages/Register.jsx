import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthShell } from './Login.jsx';
import { COUNTRIES } from '../data/countries.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [country, setCountry] = useState('+252');
  const [local, setLocal] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('الاسم قصير جدًا');
      return;
    }
    if (local.replace(/\D/g, '').length < 6) {
      setError('رقم الهاتف غير صحيح');
      return;
    }
    if (password.length < 8) {
      setError('كلمة المرور 8 أحرف على الأقل');
      return;
    }
    if (password !== confirm) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }
    if (!agree) {
      setError('يجب الموافقة على شروط الاستخدام');
      return;
    }

    const phone = `${country}${local.replace(/\D/g, '').replace(/^0+/, '')}`;

    setLoading(true);
    try {
      await register({ name: name.trim(), phone, email: email.trim(), password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.userMessage || 'تعذّر إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7FAF8] text-[#102A27]">
      <AuthShell
        badge="حساب جديد"
        title="إنشاء حساب"
        subtitle="أنشئ حسابًا مجانيًا لحفظ تقدمك في الدروس ومتابعة ما بدأته."
        footer={
          <>
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="font-bold text-[#0D9E84] hover:text-[#0A8873]">
              سجّل الدخول
            </Link>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-[#F4C7C7] bg-[#FDF1F1] px-4 py-3 text-sm text-[#A03030]">
              {error}
            </div>
          )}

          {/* Name */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#2E4642]">الاسم الكامل</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: أحمد بن عبد الله"
              autoComplete="name"
              className="w-full rounded-xl border border-[#CFE1DC] bg-white px-4 py-3 text-sm outline-none focus:border-[#54BDA8] focus:ring-2 focus:ring-[#0D9E84]/15 transition"
              required
            />
          </label>

          {/* Phone */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#2E4642]">رقم الهاتف</span>
            <div className="flex rounded-xl border border-[#CFE1DC] bg-white focus-within:border-[#54BDA8] focus-within:ring-2 focus-within:ring-[#0D9E84]/15 transition">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="rounded-s-xl border-e border-[#E3EEEB] bg-[#F3F9F7] px-3 text-sm font-bold text-[#173E38] outline-none"
                dir="ltr"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                inputMode="numeric"
                value={local}
                onChange={(e) => setLocal(e.target.value.replace(/\D/g, ''))}
                placeholder="612345678"
                autoComplete="tel-national"
                dir="ltr"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[#91A39F]"
                required
              />
            </div>
          </label>

          {/* Email (optional) */}
          <label className="block">
            <span className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#2E4642]">
              البريد الإلكتروني
              <span className="text-[10px] font-normal text-[#91A39F]">اختياري</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              autoComplete="email"
              dir="ltr"
              className="w-full rounded-xl border border-[#CFE1DC] bg-white px-4 py-3 text-sm outline-none focus:border-[#54BDA8] focus:ring-2 focus:ring-[#0D9E84]/15 transition text-right"
            />
          </label>

          {/* Password */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#2E4642]">كلمة المرور</span>
            <div className="flex rounded-xl border border-[#CFE1DC] bg-white focus-within:border-[#54BDA8] focus-within:ring-2 focus-within:ring-[#0D9E84]/15 transition">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 أحرف على الأقل"
                autoComplete="new-password"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[#91A39F]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="grid w-11 place-items-center text-[#91A39F] hover:text-[#0D9E84] transition"
                aria-label={showPass ? 'إخفاء' : 'إظهار'}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </label>

          {/* Confirm password */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#2E4642]">تأكيد كلمة المرور</span>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full rounded-xl border border-[#CFE1DC] bg-white px-4 py-3 text-sm outline-none focus:border-[#54BDA8] focus:ring-2 focus:ring-[#0D9E84]/15 transition"
              required
            />
          </label>

          {/* Agree */}
          <label className="flex items-start gap-3 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#C8DCD7] text-[#0D9E84] focus:ring-[#0D9E84]"
            />
            <span className="text-xs leading-6 text-[#5F7772]">
              أوافق على{' '}
              <Link to="/terms" className="font-bold text-[#0B806D] hover:underline">
                شروط الاستخدام
              </Link>{' '}
              و{' '}
              <Link to="/privacy" className="font-bold text-[#0B806D] hover:underline">
                سياسة الخصوصية
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D9E84] px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(13,158,132,.22)] hover:bg-[#0A8873] disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? 'جارٍ الإنشاء…' : 'إنشاء الحساب'}
          </button>
        </form>
      </AuthShell>
    </main>
  );
}