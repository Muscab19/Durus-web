// ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../api/client.js';

const T = {
  title: 'الملف الشخصي',
  subtitle: 'إدارة معلوماتك الشخصية وكلمة المرور وجلسات الدخول.',
  save: 'حفظ التغييرات',
  saved: 'تم الحفظ بنجاح',
  sections: {
    personal: {
      title: 'المعلومات الشخصية',
      subtitle: 'الاسم، البريد الإلكتروني، والصورة.',
      name: 'الاسم الكامل',
      email: 'البريد الإلكتروني / رقم الهاتف',
      phone: 'رقم الهاتف',
      bio: 'نبذة مختصرة',
      bioPlaceholder: 'اكتب نبذة قصيرة عنك...',
      role: 'الدور',
      changePhoto: 'تغيير الصورة',
      photoHint: 'PNG / JPG — حتى 2 ميجابايت',
    },
    password: {
      title: 'تغيير كلمة المرور',
      subtitle: 'حافظ على أمان حسابك بكلمة مرور قوية.',
      current: 'كلمة المرور الحالية',
      new: 'كلمة المرور الجديدة',
      confirm: 'تأكيد كلمة المرور الجديدة',
      update: 'تحديث كلمة المرور',
      hint: 'يجب أن تكون 8 أحرف على الأقل وتشمل حرفًا كبيرًا ورقمًا.',
      errors: {
        mismatch: 'كلمتا المرور غير متطابقتين',
        tooShort: 'كلمة المرور قصيرة جدًا',
        same: 'كلمة المرور الجديدة مطابقة للحالية',
      },
    },
    sessions: {
      title: 'الجلسات النشطة',
      subtitle: 'الأجهزة التي تستخدم حسابك حاليًا.',
      current: 'الجلسة الحالية',
      revoke: 'إنهاء الجلسة',
      revokeAll: 'إنهاء جميع الجلسات الأخرى',
      unknown: 'جهاز غير معروف',
    },
    activity: {
      title: 'النشاط الأخير',
      subtitle: 'آخر الإجراءات التي قمت بها على المنصة.',
    },
  },
  sessions: [
    { id: 's1', device: 'Chrome — Windows 11', ip: '192.168.1.10', location: 'مقديشو، الصومال', lastActive: new Date().toISOString(), current: true },
    { id: 's2', device: 'Safari — iPhone 15', ip: '192.168.1.24', location: 'مقديشو، الصومال', lastActive: '2026-10-12T18:00:00Z', current: false },
    { id: 's3', device: 'Firefox — Ubuntu', ip: '10.0.0.42', location: 'نيروبي، كينيا', lastActive: '2026-10-05T11:00:00Z', current: false },
  ],
  activity: [
    { id: 'a1', action: 'رفع درس جديد', target: 'الدرس 24 — باب النواسخ', time: '2026-10-13T10:00:00Z', type: 'upload' },
    { id: 'a2', action: 'إصدار شهادة', target: 'شهادة كتاب — أحمد بن عبد الله', time: '2026-10-12T14:00:00Z', type: 'award' },
    { id: 'a3', action: 'تعديل كتاب', target: 'ألفية ابن مالك', time: '2026-10-11T09:00:00Z', type: 'edit' },
    { id: 'a4', action: 'إضافة مستخدم', target: 'خديجة بنت عمر', time: '2026-10-10T16:00:00Z', type: 'user' },
    { id: 'a5', action: 'تسجيل الدخول', target: 'Chrome — Windows 11', time: '2026-10-09T08:00:00Z', type: 'login' },
  ],
  actions: { changePhoto: 'تغيير الصورة', remove: 'إزالة', update: 'تحديث', revoke: 'إنهاء' },
};

export default function ProfilePage() {
  const { user } = useAuth(); // Get real logged-in user
  
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.phone || '', // Using phone as the identifier
    phone: user?.phone || '',
    bio: '',
    role: user?.role || 'admin',
  });
  
  const [avatar, setAvatar] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [pwd, setPwd] = useState({ current: '', new: '', confirm: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdSaved, setPwdSaved] = useState(false);
  
  const [sessions, setSessions] = useState(T.sessions);
  const locale = 'ar-EG';

  // Sync profile state when user loads from context
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.name,
        email: user.phone,
        phone: user.phone,
        role: user.role,
      }));
    }
  }, [user]);

  const update = (k, v) => setProfile((p) => ({ ...p, [k]: v }));

  const save = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    
    try {
      await authApi.updateProfile({ 
        name: profile.name, 
        phone: profile.phone 
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(err.userMessage || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const submitPassword = (e) => {
    e.preventDefault();
    const err = {};
    if (pwd.new.length < 8) err.new = T.sections.password.errors.tooShort;
    if (pwd.new !== pwd.confirm) err.confirm = T.sections.password.errors.mismatch;
    if (pwd.current === pwd.new && pwd.new) err.new = T.sections.password.errors.same;
    setPwdErrors(err);
    
    if (Object.keys(err).length === 0) {
      // Note: Wire this to a real PATCH /api/auth/password endpoint when ready
      setPwdSaved(true);
      setPwd({ current: '', new: '', confirm: '' });
      setTimeout(() => setPwdSaved(false), 2500);
    }
  };

  const revokeSession = (id) => setSessions((prev) => prev.filter((s) => s.id !== id));
  const revokeAllOther = () => setSessions((prev) => prev.filter((s) => s.current));

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-amiri text-2xl font-bold text-[#123D36] sm:text-3xl">{T.title}</h1>
            <p className="mt-1 text-sm text-[#70847F]">{T.subtitle}</p>
          </div>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 self-start rounded-lg bg-[#0D9E84] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(13,158,132,.22)] hover:bg-[#0A8873] disabled:opacity-50">
            <CheckIcon /> {saving ? 'جارٍ الحفظ...' : T.save}
          </button>
        </div>

        {saved && (
          <div className="flex items-center gap-3 rounded-xl border border-[#BFE6DC] bg-[#EAF7F3] p-3.5 text-xs font-bold text-[#0B8D77]">
            <CheckCircleIcon /> {T.saved}
          </div>
        )}

        {/* Hero card */}
        <div className="overflow-hidden rounded-2xl border border-[#E0E8E5] bg-white">
          <div className="h-24 bg-gradient-to-l from-[#0D9E84] via-[#0B8D77] to-[#073A35]" />
          <div className="px-6 pb-6">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="relative">
                <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-[#0D9E84] font-amiri text-4xl font-bold text-white shadow-md">
                  {avatar ? <img src={URL.createObjectURL(avatar)} alt="" className="h-full w-full object-cover" /> : profile.name.charAt(0)}
                </div>
                <label className="absolute bottom-1 end-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full border-2 border-white bg-white text-[#0B8D77] shadow">
                  <CameraIcon />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatar(e.target.files[0])} />
                </label>
              </div>
              <div className="flex-1 pb-1">
                <h2 className="font-amiri text-2xl font-bold text-[#123D36]">{profile.name}</h2>
                <p className="mt-0.5 text-xs text-[#7B908B]" dir="ltr">{profile.email}</p>
                <span className="mt-2 inline-flex rounded-full bg-[#F0EBFA] px-2.5 py-1 text-[10px] font-bold text-[#6B46C1]">
                  {T.sections.personal.role}: {profile.role === 'admin' ? 'مشرف عام' : profile.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal info */}
        <Section icon={<UserIcon />} title={T.sections.personal.title} subtitle={T.sections.personal.subtitle}>
          <form onSubmit={save} className="grid gap-4 lg:grid-cols-2">
            <Field label={T.sections.personal.name}>
              <input value={profile.name} onChange={(e) => update('name', e.target.value)} className={inputCls} />
            </Field>
            <Field label={T.sections.personal.email}>
              <input type="text" value={profile.email} className={`${inputCls} bg-gray-50 text-gray-500`} dir="ltr" disabled />
            </Field>
            <Field label={T.sections.personal.phone}>
              <input value={profile.phone} onChange={(e) => update('phone', e.target.value)} className={inputCls} dir="ltr" />
            </Field>
            <Field label={T.sections.personal.bio} className="lg:col-span-2">
              <textarea rows={3} value={profile.bio} onChange={(e) => update('bio', e.target.value)} placeholder={T.sections.personal.bioPlaceholder} className={`${inputCls} h-auto py-2.5`} />
            </Field>
          </form>
        </Section>

        {/* Password */}
        <Section icon={<LockIcon />} title={T.sections.password.title} subtitle={T.sections.password.subtitle}>
          {pwdSaved && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#BFE6DC] bg-[#EAF7F3] p-3 text-xs font-bold text-[#0B8D77]">
              <CheckCircleIcon /> {T.saved}
            </div>
          )}
          <form onSubmit={submitPassword} className="grid gap-4 lg:grid-cols-2">
            <Field label={T.sections.password.current} className="lg:col-span-2">
              <input type="password" value={pwd.current} onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))} className={inputCls} dir="ltr" required />
            </Field>
            <Field label={T.sections.password.new} error={pwdErrors.new}>
              <input type="password" value={pwd.new} onChange={(e) => setPwd((p) => ({ ...p, new: e.target.value }))} className={inputCls} dir="ltr" required />
            </Field>
            <Field label={T.sections.password.confirm} error={pwdErrors.confirm}>
              <input type="password" value={pwd.confirm} onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))} className={inputCls} dir="ltr" required />
            </Field>
            <div className="lg:col-span-2">
              <p className="rounded-xl bg-[#F8FBFA] p-3 text-[11px] text-[#7B908B]">{T.sections.password.hint}</p>
            </div>
            <div className="lg:col-span-2 flex justify-end">
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-[#0D9E84] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0A8873]">
                <LockIcon /> {T.sections.password.update}
              </button>
            </div>
          </form>
        </Section>

        {/* Sessions (Mock for now until you implement session tracking) */}
        <Section icon={<DevicesIcon />} title={T.sections.sessions.title} subtitle={T.sections.sessions.subtitle}>
          <div className="divide-y divide-[#F0F5F3] rounded-xl border border-[#F0F5F3]">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-4 p-4">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${s.current ? 'bg-[#EAF7F3] text-[#0B8D77]' : 'bg-[#F0F5F3] text-[#617873]'}`}>
                  <DeviceIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold text-[#153D36]">{s.device}</p>
                    {s.current && <span className="rounded-full bg-[#E6F7EC] px-2 py-0.5 text-[9px] font-bold text-[#1F8A4C]">{T.sections.sessions.current}</span>}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-[#7B908B]">{s.location} · <span dir="ltr">{s.ip}</span></p>
                </div>
                <span className="hidden text-[11px] text-[#9AAEAA] sm:block">{relativeTime(s.lastActive, locale)}</span>
                {!s.current && (
                  <button onClick={() => revokeSession(s.id)} className="shrink-0 rounded-lg border border-[#F4C4C4] bg-white px-3 py-1.5 text-[11px] font-bold text-[#B91C1C] hover:bg-[#FEF2F2]">
                    {T.sections.sessions.revoke}
                  </button>
                )}
              </div>
            ))}
          </div>
          {sessions.some((s) => !s.current) && (
            <div className="mt-3 flex justify-end">
              <button onClick={revokeAllOther} className="rounded-lg border border-[#DDEAE6] bg-white px-3.5 py-2 text-[11px] font-bold text-[#617873] hover:border-[#B91C1C] hover:text-[#B91C1C]">
                {T.sections.sessions.revokeAll}
              </button>
            </div>
          )}
        </Section>

        {/* Activity (Mock) */}
        <Section icon={<ActivityIcon />} title={T.sections.activity.title} subtitle={T.sections.activity.subtitle}>
          <div className="divide-y divide-[#F0F5F3] rounded-xl border border-[#F0F5F3]">
            {T.activity.map((a) => {
              const colors = {
                upload: 'bg-[#EAF7F3] text-[#0B8D77]',
                award: 'bg-[#FFF4E0] text-[#A46E35]',
                edit: 'bg-[#E8F1FA] text-[#2B6CB0]',
                user: 'bg-[#F0EBFA] text-[#6B46C1]',
                login: 'bg-[#F0F5F3] text-[#617873]',
              };
              return (
                <div key={a.id} className="flex items-center gap-4 p-4">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${colors[a.type]}`}>
                    <ActivityDotIcon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#153D36]">{a.action}</p>
                    <p className="mt-0.5 truncate text-[11px] text-[#7B908B]">{a.target}</p>
                  </div>
                  <span className="hidden text-[11px] text-[#9AAEAA] sm:block">{relativeTime(a.time, locale)}</span>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </div>
  );
}

/* =========================================================
   Sub-components
   ========================================================= */

function Section({ icon, title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-[#E0E8E5] bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3 border-b border-[#F0F5F3] pb-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EAF7F3] text-[#0B8D77]">{icon}</div>
        <div>
          <h2 className="font-amiri text-xl font-bold text-[#123D36]">{title}</h2>
          <p className="mt-0.5 text-xs text-[#7B908B]">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Field({ label, children, error, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-bold text-[#4A5F5A]">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] font-bold text-[#B91C1C]">{error}</span>}
    </label>
  );
}

const inputCls = 'h-11 w-full rounded-xl border border-[#DDEAE6] bg-white px-3 text-sm text-[#153B35] outline-none focus:border-[#54BDA8] disabled:bg-[#F8FBFA] disabled:text-[#9AAEAA]';

function relativeTime(iso, locale) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 7) return `قبل ${days.toLocaleString(locale)} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7).toLocaleString(locale)} أسابيع`;
  return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

/* Icons */
function UserIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" /></svg> }
function LockIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" /></svg> }
function DevicesIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><rect x="3" y="5" width="14" height="10" rx="2" /><rect x="18" y="9" width="3" height="11" rx="1" /><path d="M8 19h6" strokeLinecap="round" /></svg> }
function DeviceIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><rect x="4" y="5" width="16" height="12" rx="2" /><path d="M8 20h8" strokeLinecap="round" /></svg> }
function ActivityIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M3 12h4l3-8 4 16 3-8h4" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function ActivityDotIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><circle cx="12" cy="12" r="4" /></svg> }
function CameraIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" strokeLinejoin="round" /><circle cx="12" cy="13" r="3.5" /></svg> }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5"><path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function CheckCircleIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg> }