// SettingsPage.jsx
import React, { useState, useEffect } from 'react';

const T = {
  title: 'الإعدادات العامة',
  subtitle: 'إدارة معلومات المكتبة والتفضيلات العامة للمنصة.',
  save: 'حفظ التغييرات',
  saved: 'تم الحفظ بنجاح',
  sections: {
    library: {
      title: 'معلومات المكتبة',
      subtitle: 'الاسم، الوصف، والشعار الرسمي.',
      name: 'اسم المكتبة',
      description: 'الوصف',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      address: 'العنوان',
      logo: 'الشعار',
      logoHint: 'PNG / SVG — حتى 500 كيلوبايت',
      uploadLogo: 'رفع الشعار',
    },
    appearance: {
      title: 'المظهر والهوية',
      subtitle: 'الألوان والخط المستخدم في الواجهة.',
      primaryColor: 'اللون الأساسي',
      accentColor: 'اللون الثانوي',
      font: 'الخط الأساسي',
      darkMode: 'تفعيل الوضع الليلي',
      rtl: 'اتجاه الواجهة',
      rtlOptions: { rtl: 'من اليمين إلى اليسار', ltr: 'من اليسار إلى اليمين' },
    },
    notifications: {
      title: 'الإشعارات',
      subtitle: 'تحكم في التنبيهات التي تصلك والبريد التلقائي.',
      newUser: 'إشعار عند تسجيل مستخدم جديد',
      newLecture: 'إشعار عند رفع درس جديد',
      newCertificate: 'إشعار عند إصدار شهادة',
      weeklyReport: 'تقرير أسبوعي بالبريد',
    },
    defaults: {
      title: 'إعدادات المحتوى الافتراضية',
      subtitle: 'القيم الافتراضية عند إنشاء دروس أو كتب جديدة.',
      lectureStatus: 'حالة الدرس الافتراضية',
      bookLevel: 'مستوى الكتاب الافتراضي',
      lectureType: 'نوع الدرس الافتراضي',
      itemsPerPage: 'عدد العناصر في الصفحة',
    },
    danger: {
      title: 'منطقة الخطر',
      subtitle: 'إجراءات لا يمكن التراجع عنها. استخدمها بحذر.',
      clearCache: 'مسح ذاكرة التخزين المؤقت',
      clearCacheHint: 'يمسح جميع الملفات المؤقتة. لن يؤثر على المحتوى.',
      exportData: 'تصدير جميع البيانات',
      exportDataHint: 'سيتم تنزيل نسخة كاملة من قاعدة البيانات.',
      deleteAll: 'حذف جميع الدروس',
      deleteAllHint: 'يحذف جميع الدروس نهائيًا. لا يمكن التراجع.',
      confirmClearTitle: 'تأكيد مسح الذاكرة المؤقتة',
      confirmClearBody: 'سيتم مسح جميع الملفات المؤقتة. هل أنت متأكد؟',
      confirmExportTitle: 'تأكيد تصدير البيانات',
      confirmExportBody: 'سيتم إنشاء نسخة كاملة وتنزيلها. قد يستغرق ذلك بضع دقائق.',
      confirmDeleteAllTitle: 'تأكيد حذف جميع الدروس',
      confirmDeleteAllBody: 'سيتم حذف جميع الدروس نهائيًا. لا يمكن التراجع عن هذا الإجراء.',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      run: 'تنفيذ',
    },
    status: { published: 'منشور', draft: 'مسودة', archived: 'مؤرشف' },
    level: { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' },
    type: { audio: 'صوتي', video: 'مرئي' },
  },
  fonts: { amiri: 'أميري', tajawal: 'تجوّل', cairo: 'القاهرة', ibm: 'IBM Plex Sans Arabic' },
  toast: { unsaved: 'لديك تغييرات غير محفوظة' },
};

const STORAGE_KEY = 'durus.settings';

export default function SettingsPage() {
  const [form, setForm] = useState({
    name: 'مكتبة الشيخ نور علي جامع',
    description: 'مكتبة علمية رقمية تجمع دروس فضيلة الشيخ نور علي جامع.',
    email: 'info@example.com',
    phone: '+252 61 000 0000',
    address: 'مقديشو — الصومال',
    primaryColor: '#0D9E84',
    accentColor: '#073A35',
    font: 'amiri',
    darkMode: false,
    rtl: 'rtl',
    newUser: true,
    newLecture: true,
    newCertificate: true,
    weeklyReport: false,
    lectureStatus: 'draft',
    bookLevel: 'beginner',
    lectureType: 'audio',
    itemsPerPage: 10,
  });
  const [logo, setLogo] = useState(null);
  const [saved, setSaved] = useState(false);
  const [modal, setModal] = useState(null);

  // Load settings from local storage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        setForm(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = (e) => {
    if (e) e.preventDefault();
    
    // Save to local storage so it persists across reloads
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    
    // If dark mode or RTL is toggled, apply to document
    document.documentElement.dir = form.rtl;
    if (form.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-amiri text-2xl font-bold text-[#123D36] sm:text-3xl">{T.title}</h1>
            <p className="mt-1 text-sm text-[#70847F]">{T.subtitle}</p>
          </div>
          <button onClick={save} className="inline-flex items-center gap-1.5 self-start rounded-lg bg-[#0D9E84] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(13,158,132,.22)] hover:bg-[#0A8873]">
            <CheckIcon /> {T.save}
          </button>
        </div>

        {saved && (
          <div className="flex items-center gap-3 rounded-xl border border-[#BFE6DC] bg-[#EAF7F3] p-3.5 text-xs font-bold text-[#0B8D77]">
            <CheckCircleIcon /> {T.saved}
          </div>
        )}

        <form onSubmit={save} className="space-y-6">
          {/* Library info */}
          <Section icon={<LibraryIcon />} title={T.sections.library.title} subtitle={T.sections.library.subtitle}>
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label={T.sections.library.name} className="lg:col-span-2">
                <input value={form.name} onChange={(e) => update('name', e.target.value)} className={inputCls} />
              </Field>
              <Field label={T.sections.library.description} className="lg:col-span-2">
                <textarea rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} className={`${inputCls} h-auto py-2.5`} />
              </Field>
              <Field label={T.sections.library.email}>
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputCls} dir="ltr" />
              </Field>
              <Field label={T.sections.library.phone}>
                <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inputCls} dir="ltr" />
              </Field>
              <Field label={T.sections.library.address} className="lg:col-span-2">
                <input value={form.address} onChange={(e) => update('address', e.target.value)} className={inputCls} />
              </Field>
            </div>

            {/* Logo */}
            <div className="mt-5 flex items-center gap-4 rounded-xl border border-[#E0E8E5] bg-[#F8FBFA] p-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-[#E0E8E5]">
                {logo ? <img src={URL.createObjectURL(logo)} alt="" className="h-full w-full object-cover" /> : <BookIcon large />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#153D36]">{T.sections.library.logo}</p>
                <p className="mt-0.5 text-[10px] text-[#7B908B]">{T.sections.library.logoHint}</p>
                <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#DDEAE6] bg-white px-3 py-2 text-[11px] font-bold text-[#617873] hover:border-[#0D9E84] hover:text-[#0D9E84]">
                  <UploadIcon /> {T.sections.library.uploadLogo}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogo(e.target.files[0])} />
                </label>
              </div>
            </div>
          </Section>

          {/* Appearance */}
          <Section icon={<PaletteIcon />} title={T.sections.appearance.title} subtitle={T.sections.appearance.subtitle}>
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label={T.sections.appearance.primaryColor}>
                <div className="flex items-center gap-2 rounded-xl border border-[#DDEAE6] bg-white p-1.5">
                  <input type="color" value={form.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} className="h-9 w-14 cursor-pointer rounded-lg border-0 bg-transparent" />
                  <input value={form.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} className="flex-1 bg-transparent px-2 text-sm outline-none" dir="ltr" />
                </div>
              </Field>
              <Field label={T.sections.appearance.accentColor}>
                <div className="flex items-center gap-2 rounded-xl border border-[#DDEAE6] bg-white p-1.5">
                  <input type="color" value={form.accentColor} onChange={(e) => update('accentColor', e.target.value)} className="h-9 w-14 cursor-pointer rounded-lg border-0 bg-transparent" />
                  <input value={form.accentColor} onChange={(e) => update('accentColor', e.target.value)} className="flex-1 bg-transparent px-2 text-sm outline-none" dir="ltr" />
                </div>
              </Field>
              <Field label={T.sections.appearance.font}>
                <select value={form.font} onChange={(e) => update('font', e.target.value)} className={inputCls}>
                  {Object.entries(T.fonts).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label={T.sections.appearance.rtl}>
                <select value={form.rtl} onChange={(e) => update('rtl', e.target.value)} className={inputCls}>
                  <option value="rtl">{T.sections.appearance.rtlOptions.rtl}</option>
                  <option value="ltr">{T.sections.appearance.rtlOptions.ltr}</option>
                </select>
              </Field>
              <Toggle label={T.sections.appearance.darkMode} checked={form.darkMode} onChange={(v) => update('darkMode', v)} className="lg:col-span-2" />
            </div>
          </Section>

          {/* Notifications */}
          <Section icon={<BellIcon />} title={T.sections.notifications.title} subtitle={T.sections.notifications.subtitle}>
            <div className="grid gap-3 lg:grid-cols-2">
              <Toggle label={T.sections.notifications.newUser} checked={form.newUser} onChange={(v) => update('newUser', v)} />
              <Toggle label={T.sections.notifications.newLecture} checked={form.newLecture} onChange={(v) => update('newLecture', v)} />
              <Toggle label={T.sections.notifications.newCertificate} checked={form.newCertificate} onChange={(v) => update('newCertificate', v)} />
              <Toggle label={T.sections.notifications.weeklyReport} checked={form.weeklyReport} onChange={(v) => update('weeklyReport', v)} />
            </div>
          </Section>

          {/* Content defaults */}
          <Section icon={<Settings2Icon />} title={T.sections.defaults.title} subtitle={T.sections.defaults.subtitle}>
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label={T.sections.defaults.lectureStatus}>
                <select value={form.lectureStatus} onChange={(e) => update('lectureStatus', e.target.value)} className={inputCls}>
                  <option value="draft">{T.sections.status.draft}</option>
                  <option value="published">{T.sections.status.published}</option>
                  <option value="archived">{T.sections.status.archived}</option>
                </select>
              </Field>
              <Field label={T.sections.defaults.bookLevel}>
                <select value={form.bookLevel} onChange={(e) => update('bookLevel', e.target.value)} className={inputCls}>
                  <option value="beginner">{T.sections.level.beginner}</option>
                  <option value="intermediate">{T.sections.level.intermediate}</option>
                  <option value="advanced">{T.sections.level.advanced}</option>
                </select>
              </Field>
              <Field label={T.sections.defaults.lectureType}>
                <select value={form.lectureType} onChange={(e) => update('lectureType', e.target.value)} className={inputCls}>
                  <option value="audio">{T.sections.type.audio}</option>
                  <option value="video">{T.sections.type.video}</option>
                </select>
              </Field>
              <Field label={T.sections.defaults.itemsPerPage}>
                <input type="number" min="5" max="100" value={form.itemsPerPage} onChange={(e) => update('itemsPerPage', e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* Danger zone */}
          <div className="rounded-2xl border border-[#F4C4C4] bg-[#FEF2F2] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#B91C1C]"><AlertIcon /></div>
              <div>
                <h3 className="font-amiri text-xl font-bold text-[#B91C1C]">{T.sections.danger.title}</h3>
                <p className="mt-0.5 text-xs text-[#A03D3D]">{T.sections.danger.subtitle}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <DangerRow
                title={T.sections.danger.clearCache}
                hint={T.sections.danger.clearCacheHint}
                buttonLabel={T.sections.danger.run}
                onClick={() => setModal({ type: 'clearCache' })}
              />
              <DangerRow
                title={T.sections.danger.exportData}
                hint={T.sections.danger.exportDataHint}
                buttonLabel={T.sections.danger.run}
                onClick={() => setModal({ type: 'exportData' })}
              />
              <DangerRow
                title={T.sections.danger.deleteAll}
                hint={T.sections.danger.deleteAllHint}
                buttonLabel={T.sections.danger.run}
                onClick={() => setModal({ type: 'deleteAll' })}
                strong
              />
            </div>
          </div>
        </form>
      </div>

      {/* Confirm modals */}
      {modal && (
        <ConfirmModal
          title={
            modal.type === 'clearCache' ? T.sections.danger.confirmClearTitle :
            modal.type === 'exportData' ? T.sections.danger.confirmExportTitle :
            T.sections.danger.confirmDeleteAllTitle
          }
          body={
            modal.type === 'clearCache' ? T.sections.danger.confirmClearBody :
            modal.type === 'exportData' ? T.sections.danger.confirmExportBody :
            T.sections.danger.confirmDeleteAllBody
          }
          cancelLabel={T.sections.danger.cancel}
          confirmLabel={T.sections.danger.confirm}
          danger={modal.type === 'deleteAll'}
          onCancel={() => setModal(null)}
          onConfirm={() => {
            // For now, just close the modal. Wire up actual API calls here later.
            setModal(null);
          }}
        />
      )}
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

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-bold text-[#4A5F5A]">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange, className = '' }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-3 rounded-xl border border-[#E0E8E5] bg-white p-3.5 text-start transition hover:border-[#0D9E84] ${className}`}
    >
      <span className="text-xs font-bold text-[#153D36]">{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-[#0D9E84]' : 'bg-[#DDEAE6]'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'start-0.5' : 'start-5'}`} />
      </span>
    </button>
  );
}

function DangerRow({ title, hint, buttonLabel, onClick, strong }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#F4C4C4] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className={`text-sm font-bold ${strong ? 'text-[#B91C1C]' : 'text-[#153D36]'}`}>{title}</p>
        <p className="mt-0.5 text-[11px] text-[#7B908B]">{hint}</p>
      </div>
      <button onClick={onClick} className={`shrink-0 rounded-lg px-3.5 py-2 text-[11px] font-bold text-white transition ${strong ? 'bg-[#B91C1C] hover:bg-[#991B1B]' : 'bg-[#A03D3D] hover:bg-[#8B2F2F]'}`}>
        {buttonLabel}
      </button>
    </div>
  );
}

function ConfirmModal({ title, body, onCancel, onConfirm, confirmLabel, cancelLabel, danger }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#E0E8E5] bg-white p-6 shadow-[0_30px_80px_rgba(6,58,53,.2)]">
        <div className="flex items-start gap-4">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${danger ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-[#FFF4E0] text-[#A46E35]'}`}>
            <AlertIcon large />
          </div>
          <div className="flex-1">
            <h3 className="font-amiri text-xl font-bold text-[#123D36]">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#6F8580]">{body}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-[#DDEAE6] bg-white px-4 py-2 text-xs font-bold text-[#617873] hover:border-[#0D9E84]">{cancelLabel}</button>
          <button onClick={onConfirm} className={`rounded-lg px-4 py-2 text-xs font-bold text-white ${danger ? 'bg-[#B91C1C] hover:bg-[#991B1B]' : 'bg-[#0D9E84] hover:bg-[#0A8873]'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'h-11 w-full rounded-xl border border-[#DDEAE6] bg-white px-3 text-sm text-[#153B35] outline-none focus:border-[#54BDA8]';

/* Icons */
function LibraryIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" strokeLinejoin="round" /><path d="M8 7h8M8 11h6" strokeLinecap="round" /></svg> }
function PaletteIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-.8 2-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.8.6-1.5 1.5-1.5h1.5A4 4 0 0 0 20 12.5C20 7.3 16.4 3 12 3Z" strokeLinejoin="round" /></svg> }
function BellIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10.3 21a1.9 1.9 0 0 0 3.4 0" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function Settings2Icon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4" strokeLinecap="round" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="14" cy="18" r="2" /></svg> }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5"><path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function CheckCircleIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function UploadIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M12 16V4M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 20h16" strokeLinecap="round" /></svg> }
function BookIcon({ large = false }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={large ? 'h-8 w-8' : 'h-4 w-4'}><path d="M2 4h6a4 4 0 0 1 4 4v12a4 4 0 0 0-4-4H2V4Z" strokeLinejoin="round" /><path d="M22 4h-6a4 4 0 0 0-4 4v12a4 4 0 0 1 4-4h6V4Z" strokeLinejoin="round" /></svg> }
function AlertIcon({ large = false }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={large ? 'h-6 w-6' : 'h-5 w-5'}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" /></svg> }