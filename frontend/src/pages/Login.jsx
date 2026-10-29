import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { PhoneIcon, LockIcon, ArrowIcon } from '../components/icons.jsx';
import { COUNTRIES } from '../data/countries.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [country, setCountry] = useState('+252');
  const [local, setLocal] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const phone = `${country}${local.replace(/\D/g, '').replace(/^0+/, '')}`;
    if (local.replace(/\D/g, '').length < 6) {
      setError('رقم الهاتف غير صحيح');
      return;
    }

    setLoading(true);
    try {
      await login({ phone, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.userMessage || 'تعذّر تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7FAF8] text-[#102A27]">
      <AuthShell
        badge="مرحبًا بك مجددًا"
        title="تسجيل الدخول"
        subtitle="ادخل إلى مكتبتك العلمية وتابع من حيث توقفت."
        footer={
          <>
            ليس لديك حساب؟{' '}
            <Link to="/register" className="font-bold text-[#0D9E84] hover:text-[#0A8873]">
              أنشئ حسابًا مجانيًا
            </Link>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-[#F4C7C7] bg-[#FDF1F1] px-4 py-3 text-sm text-[#A03030]">
              {error}
            </div>
          )}

          <Field label="رقم الهاتف">
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
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-[#153B35] outline-none placeholder:text-[#91A39F]"
                required
              />
              <span className="grid w-11 place-items-center text-[#91A39F]">
                <PhoneIcon />
              </span>
            </div>
          </Field>

          <Field label="كلمة المرور">
            <div className="flex rounded-xl border border-[#CFE1DC] bg-white focus-within:border-[#54BDA8] focus-within:ring-2 focus-within:ring-[#0D9E84]/15 transition">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-[#153B35] outline-none placeholder:text-[#91A39F]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="grid w-11 place-items-center text-[#91A39F] hover:text-[#0D9E84] transition"
                aria-label={showPass ? 'إخفاء' : 'إظهار'}
              >
                {showPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D9E84] px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(13,158,132,.22)] hover:bg-[#0A8873] disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? 'جارٍ الدخول…' : 'تسجيل الدخول'}
            {!loading && <ArrowIcon className="rotate-180" />}
          </button>
        </form>
      </AuthShell>
    </main>
  );
}

/* -------- Shared building blocks (used by Login + Register) -------- */

export function AuthShell({ badge, title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background decorations */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 15% 20%, rgba(19,166,139,.10), transparent 30%), radial-gradient(circle at 85% 10%, rgba(19,166,139,.06), transparent 30%)',
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-5 sm:px-8 py-10">
        <div className="grid w-full lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Visual panel (left on desktop) */}
          <aside className="hidden lg:block order-2">
            <VisualPanel />
          </aside>

          {/* Form panel */}
          <div className="order-1 mx-auto w-full max-w-md">
            <Link to="/" className="mb-8 inline-flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#073A35] text-white">
                <BookOpenMini />
              </div>
              <div>
                <p className="font-amiri text-base font-bold text-[#083D37] leading-tight">
                  مكتبة الشيخ نور علي جامع
                </p>
                <p className="text-[10px] tracking-wide text-[#6C8580]">
                  المكتبة العلمية الرقمية
                </p>
              </div>
            </Link>

            <div className="rounded-[24px] border border-[#DDEAE6] bg-white p-7 sm:p-8 shadow-[0_16px_50px_rgba(18,61,54,.06)]">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#CBE4DE] bg-[#ECF8F4] px-3 py-1 text-[11px] font-bold text-[#0B806D]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0DA58A]" />
                {badge}
              </span>

              <h1 className="mt-4 font-amiri text-3xl font-bold text-[#073A35]">{title}</h1>
              <p className="mt-2 text-sm leading-7 text-[#5F7772]">{subtitle}</p>

              <div className="mt-7">{children}</div>

              <p className="mt-7 text-center text-xs text-[#6F8580]">{footer}</p>
            </div>

            <p className="mt-6 text-center text-[11px] text-[#91A39F]">
              بالمتابعة أنت توافق على سياسة الاستخدام وشروط المنصة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisualPanel() {
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-[#073A35] p-10 text-white shadow-[0_30px_80px_rgba(6,58,53,.16)] min-h-[520px] flex flex-col">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 22% 20%, rgba(16,181,148,.35), transparent 30%), linear-gradient(135deg,#0A4B43 0%,#062E2C 55%,#041E1E 100%)',
        }}
      />
      <div className="absolute -left-16 -bottom-20 h-64 w-64 rounded-full border-[44px] border-[#0DA58A]/10" />
      <div className="absolute left-8 top-8 h-24 w-24 opacity-20">
        <GeometricMini />
      </div>

      <div className="relative">
        <span className="inline-flex rounded-full border border-[#35C3A7]/30 bg-[#0FA589]/10 px-3 py-1 text-[10px] font-bold text-[#5DD8C0]">
          مكتبة علمية موثوقة
        </span>
        <p className="mt-6 font-amiri text-3xl sm:text-4xl font-bold leading-[1.35]">
          اطلب العلم،
          <br />
          <span className="text-[#3CC9AE]">واحفظ ما تعلّمت.</span>
        </p>
        <p className="mt-5 max-w-sm text-sm leading-7 text-[#B8DAD3]">
          مكتبتك الخاصة تتابع تلقائيًا ما استمعت إليه، لتستأنف الدرس من حيث
          توقفت في أي وقت.
        </p>
      </div>

      <div className="relative mt-auto space-y-3">
        {[
          'حفظ تلقائي لموضع التوقف',
          'متابعة تقدمك حسب الكتاب والدروس',
          'دروس صوتية ومرئية في مكان واحد',
        ].map((line) => (
          <div key={line} className="flex items-center gap-3 text-sm text-[#CFE7E1]">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#12A88C]/25 text-[#75D5C2]">
              ✓
            </span>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-[#2E4642]">{label}</span>
      {children}
    </label>
  );
}

/* -------- Icons -------- */
// function PhoneIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
//       <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.4 12.8 12.8 0 0 0 2.8.7 2 2 0 0 1 1.7 2Z" strokeLinejoin="round" />
//     </svg>
//   );
// }
// function LockIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
//       <rect x="4" y="10" width="16" height="10" rx="2" />
//       <path d="M8 10V7a4 4 0 1 1 8 0v3" strokeLinecap="round" />
//     </svg>
//   );
// }
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 4.1M6.2 6.2A17.3 17.3 0 0 0 2 12s3.5 6 10 6a10.9 10.9 0 0 0 4.1-.8" strokeLinecap="round" />
    </svg>
  );
}
// function ArrowIcon({ className = '' }) {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={`h-4 w-4 ${className}`}>
//       <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
//     </svg>
//   );
// }
function BookOpenMini() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" strokeLinejoin="round" />
    </svg>
  );
}
function GeometricMini() {
  return (
    <svg viewBox="0 0 120 120" fill="none" stroke="#64DCC4" strokeWidth="1.2">
      <path d="M60 5 88 21 115 60 88 99 60 115 32 99 5 60 32 21 60 5Z" />
      <circle cx="60" cy="60" r="19" />
    </svg>
  );
}