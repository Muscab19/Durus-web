import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useParams } from 'react-router-dom';
import { lecturesApi } from '../../api/client.js';
import { useAdminLang } from '../../context/AdminLangContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Uploader from './Uploader.jsx';

/* =========================================================
   Admin shell — sidebar + <Outlet />
   ========================================================= */

export function AdminShell() {
  const { t, toggle, dir, lang } = useAdminLang();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const item = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
      isActive
        ? 'bg-[#073A35] text-white shadow-[0_6px_18px_rgba(7,58,53,.18)]'
        : 'text-[#4A5F5A] hover:bg-[#F3F9F7] hover:text-[#0D9E84]'
    }`;

  const onLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div dir={dir} className="min-h-screen bg-[#F7FAF8] text-[#102A27]">
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 sm:px-6 py-6">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col sticky top-6 self-start h-[calc(100vh-3rem)]">
          <Link
            to="/admin"
            className="mb-6 flex items-center gap-3 rounded-2xl border border-[#DDEAE6] bg-white p-3"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#073A35] text-white">
              <BookOpenIcon />
            </div>
            <div className="leading-tight min-w-0">
              <p className="font-amiri text-sm font-bold text-[#083D37] truncate">
                {t.brand}
              </p>
              <p className="text-[10px] text-[#6C8580] truncate">{t.brandSub}</p>
            </div>
          </Link>

          <nav className="space-y-1">
            <NavLink to="/admin" end className={item}>
              <GridIcon /> {t.nav_dashboard}
            </NavLink>
            <NavLink to="/admin/lectures" end className={item}>
              <ListIcon /> {t.nav_lectures}
            </NavLink>
            <NavLink to="/admin/lectures/new" className={item}>
              <PlusIcon /> {t.nav_new}
            </NavLink>
          </nav>

          <div className="mt-auto space-y-2 pt-6">
            <button
              onClick={toggle}
              className="flex w-full items-center justify-between rounded-xl border border-[#DDEAE6] bg-white px-4 py-2.5 text-xs font-bold text-[#173E38] hover:border-[#0D9E84] transition"
              title="Change language"
            >
              <span>{lang === 'ar' ? 'Language' : 'اللغة'}</span>
              <span className="text-[#0D9E84]">{t.lang_toggle}</span>
            </button>

            <Link
              to="/"
              className="flex items-center gap-2 rounded-xl border border-[#DDEAE6] bg-white px-4 py-2.5 text-xs font-bold text-[#173E38] hover:border-[#0D9E84] transition"
            >
              <ArrowLeftIcon /> {t.nav_back}
            </Link>

            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 border border-[#DDEAE6]">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[#EAF7F3] text-xs font-bold text-[#0B8D77]">
                {(user?.name || '؟').charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold text-[#173E38]">
                  {user?.name}
                </p>
                <button
                  onClick={onLogout}
                  className="text-[10px] font-bold text-[#A03030] hover:underline"
                >
                  {t.logout}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* Mobile top bar */}
          <div className="lg:hidden mb-4 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-[#DDEAE6] bg-white p-3">
              <Link to="/admin" className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#073A35] text-white">
                  <BookOpenIcon />
                </div>
                <p className="font-amiri text-sm font-bold text-[#083D37]">{t.brand}</p>
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggle}
                  className="rounded-lg border border-[#C8DCD7] bg-white px-3 py-1.5 text-[10px] font-bold text-[#173E38]"
                >
                  {t.lang_toggle}
                </button>
                <button
                  onClick={onLogout}
                  className="rounded-lg bg-[#0D9E84] px-3 py-1.5 text-[10px] font-bold text-white"
                >
                  {t.logout}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="flex min-w-max gap-1 rounded-2xl border border-[#DDEAE6] bg-white p-2">
                <NavLink to="/admin" end className={item}>
                  <GridIcon /> {t.nav_dashboard}
                </NavLink>
                <NavLink to="/admin/lectures" end className={item}>
                  <ListIcon /> {t.nav_lectures}
                </NavLink>
                <NavLink to="/admin/lectures/new" className={item}>
                  <PlusIcon /> {t.nav_new}
                </NavLink>
              </div>
            </div>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   Page: Dashboard  (/admin)
   ========================================================= */

export function AdminDashboard() {
  const { t } = useAdminLang();
  const [groups, setGroups] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await lecturesApi.list({ includeUnpublished: true });
        if (!cancelled) {
          setGroups(data.groups || []);
          setTotal(data.totalLectures || 0);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalBooks = groups.reduce(
    (s, g) => s + (g.courses || []).reduce((x, c) => x + (c.books?.length || 0), 0),
    0
  );
  const totalCourses = groups.reduce((s, g) => s + (g.courses?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-amiri text-3xl font-bold text-[#073A35]">{t.dash_title}</h1>
          <p className="mt-1 text-sm text-[#70847F]">{t.dash_sub}</p>
        </div>
        <Link
          to="/admin/lectures/new"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[#0D9E84] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_28px_rgba(13,158,132,.22)] hover:bg-[#0A8873] transition"
        >
          {t.dash_add}
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t.stat_arts} value={groups.length} loading={loading} />
        <StatCard label={t.stat_courses} value={totalCourses} loading={loading} />
        <StatCard label={t.stat_books} value={totalBooks} loading={loading} />
        <StatCard label={t.stat_lectures} value={total} loading={loading} accent />
      </div>

      <section className="rounded-2xl border border-[#DDEAE6] bg-white p-6">
        <h2 className="font-amiri text-xl font-bold text-[#073A35]">{t.quick_title}</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <QuickAction to="/admin/lectures/new" title={t.quick_new_title} body={t.quick_new_body} />
          <QuickAction to="/admin/lectures" title={t.quick_manage_title} body={t.quick_manage_body} />
        </div>
      </section>

      <section className="rounded-2xl border border-[#F4E3B5] bg-[#FFFBEB] p-6">
        <p className="font-amiri text-lg font-bold text-[#7A4A00]">{t.notice_title}</p>
        <p className="mt-1.5 text-sm text-[#7A4A00]/80 leading-7">{t.notice_body}</p>
      </section>
    </div>
  );
}

/* =========================================================
   Page: Lectures list  (/admin/lectures)
   ========================================================= */

export function AdminLectures() {
  const { t } = useAdminLang();
  const navigate = useNavigate();
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await lecturesApi.list({ latest: 200, includeUnpublished: true });
      setLectures(data.lectures || []);
    } catch (err) {
      setError(err.userMessage || 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (id) => {
    if (!confirm(t.list_delete_confirm)) return;
    setBusyId(id);
    try {
      await lecturesApi.remove(id);
      setLectures((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert(err.userMessage || 'Error');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = q.trim()
    ? lectures.filter((l) => {
        const n = q.trim().toLowerCase();
        return (
          (l.title || '').toLowerCase().includes(n) ||
          (l.titleArabic || '').toLowerCase().includes(n) ||
          (l.book || '').toLowerCase().includes(n) ||
          (l.bookArabic || '').toLowerCase().includes(n) ||
          (l.course || '').toLowerCase().includes(n) ||
          (l.parent || '').toLowerCase().includes(n)
        );
      })
    : lectures;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-amiri text-3xl font-bold text-[#073A35]">{t.list_title}</h1>
          <p className="mt-1 text-sm text-[#70847F]">{t.list_sub}</p>
        </div>
        <Link
          to="/admin/lectures/new"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[#0D9E84] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_28px_rgba(13,158,132,.22)] hover:bg-[#0A8873] transition"
        >
          {t.list_add}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.list_search}
          className="flex-1 rounded-xl border border-[#CFE1DC] bg-white px-4 py-3 text-sm outline-none focus:border-[#54BDA8] focus:ring-2 focus:ring-[#0D9E84]/15 transition"
        />
        <button
          onClick={load}
          className="rounded-xl border border-[#CFE1DC] bg-white px-5 py-3 text-sm font-bold text-[#173E38] hover:border-[#0D9E84] transition"
        >
          {t.list_refresh}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-[#F4C7C7] bg-[#FDF1F1] px-5 py-4 text-sm text-[#A03030]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-[#DDEAE6] bg-white" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#BFD9D2] bg-white px-8 py-16 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#EAF7F3] text-2xl">
            🎧
          </div>
          <p className="mt-4 font-amiri text-lg font-bold text-[#123D36]">
            {lectures.length === 0 ? t.list_empty_title : t.list_no_match_title}
          </p>
          <p className="mt-1.5 text-sm text-[#70847F]">
            {lectures.length === 0 ? t.list_empty_body : t.list_no_match_body}
          </p>
          {lectures.length === 0 && (
            <Link
              to="/admin/lectures/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0D9E84] px-5 py-3 text-sm font-bold text-white hover:bg-[#0A8873] transition"
            >
              {t.list_add}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => (
            <LectureRow
              key={l.id}
              t={t}
              lecture={l}
              onEdit={() => navigate(`/admin/lectures/${l.id}/edit`)}
              onDelete={() => onDelete(l.id)}
              busy={busyId === l.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   Page: Lecture form  (/admin/lectures/new & /admin/lectures/:id/edit)
   ========================================================= */

const EMPTY = {
  parent: '', parentArabic: '',
  course: '', courseArabic: '',
  book: '', bookArabic: '',
  title: '', titleArabic: '', description: '',
  type: 'audio',
  mediaKey: '', mediaUrl: '',
  durationSeconds: 0, sizeBytes: 0, mimeType: '',
  order: 0,
  isPublished: true,
};

export function AdminLectureForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { t } = useAdminLang();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const { lecture } = await lecturesApi.get(id);
        if (!cancelled) setForm({ ...EMPTY, ...lecture });
      } catch (err) {
        if (!cancelled) setError(err.userMessage || 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  const set = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  const setNum = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: Number(e.target.value) || 0 }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.parent || !form.course || !form.book || !form.title) {
      setError(t.form_error_required);
      return;
    }
    if (!form.mediaUrl) {
      setError(t.form_error_no_media);
      return;
    }
    setSaving(true);
    try {
      if (isEdit) await lecturesApi.update(id, form);
      else await lecturesApi.create(form);
      navigate('/admin/lectures');
    } catch (err) {
      setError(err.userMessage || 'Error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-[#DDEAE6] bg-white" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <header>
        <Link to="/admin/lectures" className="text-xs font-bold text-[#0B806D] hover:underline">
          {t.form_back}
        </Link>
        <h1 className="mt-2 font-amiri text-3xl font-bold text-[#073A35]">
          {isEdit ? t.form_title_edit : t.form_title_new}
        </h1>
        <p className="mt-1 text-sm text-[#70847F]">{t.form_sub}</p>
      </header>

      {error && (
        <div className="rounded-2xl border border-[#F4C7C7] bg-[#FDF1F1] px-5 py-4 text-sm text-[#A03030]">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-[#DDEAE6] bg-white p-5 sm:p-6">
        <h2 className="font-amiri text-lg font-bold text-[#073A35]">{t.form_section_classify}</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <Field label={t.form_field_art} required>
            <input value={form.parent} onChange={set('parent')} placeholder="Arabic Language and Literature" className={inputCls} required />
            <input value={form.parentArabic} onChange={set('parentArabic')} placeholder="اللغة العربية وآدابها" className={`${inputCls} mt-2`} />
          </Field>
          <Field label={t.form_field_course} required>
            <input value={form.course} onChange={set('course')} placeholder="Nahwa" className={inputCls} required />
            <input value={form.courseArabic} onChange={set('courseArabic')} placeholder="النحو" className={`${inputCls} mt-2`} />
          </Field>
          <Field label={t.form_field_book} required>
            <input value={form.book} onChange={set('book')} placeholder="Alfiyah Bin Malik" className={inputCls} required />
            <input value={form.bookArabic} onChange={set('bookArabic')} placeholder="ألفية ابن مالك" className={`${inputCls} mt-2`} />
          </Field>
          <Field label={t.form_field_order}>
            <input type="number" value={form.order} onChange={setNum('order')} className={inputCls} min={0} />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-[#DDEAE6] bg-white p-5 sm:p-6">
        <h2 className="font-amiri text-lg font-bold text-[#073A35]">{t.form_section_data}</h2>
        <div className="mt-4 space-y-4">
          <Field label={t.form_field_title_ar}>
            <input value={form.titleArabic} onChange={set('titleArabic')} placeholder="الدرس الأول — مقدمة" className={inputCls} />
          </Field>
          <Field label={t.form_field_title_en} required>
            <input value={form.title} onChange={set('title')} placeholder="Lesson 01 — Introduction" className={inputCls} required />
          </Field>
          <Field label={t.form_field_desc}>
            <textarea value={form.description} onChange={set('description')} rows={3} className={`${inputCls} resize-none`} />
          </Field>
        </div>
      </section>

      <Uploader
        initialUrl={form.mediaUrl}
        initialKey={form.mediaKey}
        onUploaded={({ mediaUrl, mediaKey, sizeBytes, mimeType, type }) => {
          setForm((f) => ({
            ...f,
            mediaUrl, mediaKey,
            sizeBytes: sizeBytes ?? f.sizeBytes,
            mimeType: mimeType ?? f.mimeType,
            type: type ?? f.type,
          }));
        }}
      />

      <section className="rounded-2xl border border-[#DDEAE6] bg-white p-5 sm:p-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={set('isPublished')}
            className="h-4 w-4 rounded border-[#C8DCD7] text-[#0D9E84] focus:ring-[#0D9E84]"
          />
          <span className="text-sm font-bold text-[#173E38]">{t.form_publish_label}</span>
        </label>
      </section>

      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <Link
          to="/admin/lectures"
          className="inline-flex items-center justify-center rounded-xl border border-[#CFE1DC] bg-white px-6 py-3 text-sm font-bold text-[#173E38] hover:border-[#0D9E84] transition"
        >
          {t.form_cancel}
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D9E84] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_28px_rgba(13,158,132,.22)] hover:bg-[#0A8873] disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {saving ? t.form_saving : isEdit ? t.form_save : t.form_create}
        </button>
      </div>
    </form>
  );
}

/* =========================================================
   Small shared helpers
   ========================================================= */

const inputCls =
  'w-full rounded-xl border border-[#CFE1DC] bg-white px-4 py-3 text-sm outline-none focus:border-[#54BDA8] focus:ring-2 focus:ring-[#0D9E84]/15 transition';

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-[#2E4642]">
        {label}
        {required && <span className="text-[#A03030]">*</span>}
      </span>
      {children}
    </label>
  );
}

function StatCard({ label, value, loading, accent = false }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent
          ? 'border-[#0D9E84]/30 bg-gradient-to-br from-[#0D9E84] to-[#087A4D] text-white'
          : 'border-[#DDEAE6] bg-white'
      }`}
    >
      <p className={`text-xs font-bold ${accent ? 'text-white/80' : 'text-[#70847F]'}`}>{label}</p>
      {loading ? (
        <div className={`mt-2 h-8 w-16 rounded ${accent ? 'bg-white/20' : 'bg-[#EEF5F2]'} animate-pulse`} />
      ) : (
        <p className={`mt-1 font-amiri text-3xl font-bold ${accent ? 'text-white' : 'text-[#073A35]'}`}>
          {Number(value).toLocaleString('ar-EG')}
        </p>
      )}
    </div>
  );
}

function QuickAction({ to, title, body }) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-[#DDEAE6] bg-[#F8FBF9] p-5 hover:border-[#86C8B9] hover:bg-white transition"
    >
      <p className="font-amiri text-lg font-bold text-[#073A35] group-hover:text-[#0D9E84]">{title}</p>
      <p className="mt-1 text-xs text-[#70847F]">{body}</p>
    </Link>
  );
}

function LectureRow({ t, lecture, onEdit, onDelete, busy }) {
  const mins = Math.round((lecture.durationSeconds || 0) / 60);
  const title = lecture.titleArabic || lecture.title;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-[#DDEAE6] bg-white p-4 sm:p-5">
      <div
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
          lecture.type === 'audio' ? 'bg-[#EAF7F3] text-[#0B8D77]' : 'bg-[#073A35] text-white'
        }`}
      >
        {lecture.type === 'audio' ? '🎧' : '▶'}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-amiri text-lg font-bold text-[#153D36]">{title}</p>
        <p className="mt-0.5 truncate text-[11px] text-[#7A908B]">
          {lecture.parentArabic || lecture.parent} ·{' '}
          {lecture.courseArabic || lecture.course} ·{' '}
          {lecture.bookArabic || lecture.book}
        </p>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-[#6F8580]">
        <span className="rounded-full bg-[#F2F8F6] px-2.5 py-1">
          {mins.toLocaleString('ar-EG')} د
        </span>
        <span
          className={`rounded-full px-2.5 py-1 ${
            lecture.isPublished ? 'bg-[#EAF7F3] text-[#0B8D77]' : 'bg-[#FDEEEE] text-[#A03030]'
          }`}
        >
          {lecture.isPublished ? t.list_published : t.list_draft}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          className="rounded-lg border border-[#CFE1DC] bg-white px-3.5 py-2 text-xs font-bold text-[#173E38] hover:border-[#0D9E84] transition"
        >
          {t.list_edit}
        </button>
        <button
          onClick={onDelete}
          disabled={busy}
          className="rounded-lg border border-[#F4C7C7] bg-[#FDF1F1] px-3.5 py-2 text-xs font-bold text-[#A03030] hover:bg-[#FAE0E0] disabled:opacity-50 transition"
        >
          {busy ? '…' : t.list_delete}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   Icons
   ========================================================= */

function BookOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" strokeLinejoin="round" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}