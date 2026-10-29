// TrackStudentsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../../api/client.js';

const T = {
  title: 'متابعة الطلاب',
  subtitle: 'تتبّع تقدّم الطلاب، وترتيبهم، والتزامهم بالدروس.',
  searchPlaceholder: 'ابحث بالاسم أو رقم الهاتف...',
  filters: {
    all: 'الكل',
    commitment: 'الالتزام',
    sortBy: 'الترتيب حسب',
  },
  commitment: {
    excellent: 'ممتاز',
    good: 'جيد',
    average: 'متوسط',
    needsAttention: 'يحتاج متابعة',
  },
  sort: {
    rank: 'الترتيب',
    completed: 'الدروس المكتملة',
    hours: 'ساعات الاستماع',
    streak: 'أيام المتابعة',
    lastActive: 'آخر نشاط',
  },
  stats: {
    totalStudents: 'إجمالي الطلاب',
    activeThisWeek: 'نشط هذا الأسبوع',
    avgCompletion: 'متوسط الإكمال',
    totalHours: 'إجمالي الساعات',
  },
  table: {
    rank: 'الترتيب',
    student: 'الطالب',
    progress: 'التقدّم',
    completed: 'مكتملة',
    hours: 'ساعات',
    streak: 'المتابعة',
    commitment: 'الالتزام',
    lastActive: 'آخر نشاط',
    actions: 'إجراءات',
  },
  actions: {
    view: 'عرض',
    message: 'مراسلة',
  },
  topStudents: {
    title: 'أبرز الطلاب',
    subtitle: 'الطلاب الأكثر اجتهادًا والتزامًا هذا الشهر.',
  },
  weeklyActivity: {
    title: 'النشاط الأسبوعي',
    subtitle: 'عدد الدروس المكتملة خلال الأيام السبعة الماضية.',
  },
  empty: {
    title: 'لا يوجد طلاب',
    subtitle: 'لم يتم العثور على طلاب يطابقون معايير البحث.',
  },
  modal: {
    studentTitle: 'تفاصيل الطالب',
    close: 'إغلاق',
    fields: {
      phone: 'رقم الهاتف',
      joined: 'تاريخ الانضمام',
      completed: 'الدروس المكتملة',
      started: 'الدروس المبدوءة',
      hours: 'ساعات الاستماع',
      streak: 'سلسلة المتابعة',
      lastActive: 'آخر نشاط',
      commitment: 'الالتزام',
      rank: 'الترتيب',
    },
    progress: 'نسبة الإكمال',
  },
  days: 'يوم',
  hoursUnit: 'ساعة',
  percent: '%',
  loading: 'جارٍ تحميل بيانات الطلاب...',
  error: 'تعذّر تحميل بيانات الطلاب.',
};

/* =========================================================
   Page
   ========================================================= */

export default function TrackStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [query, setQuery] = useState('');
  const [commitmentFilter, setCommitmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rank');
  const [modal, setModal] = useState(null);
  const locale = 'ar-EG';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await adminApi.students();
        if (!cancelled) setStudents(data.students || []);
      } catch (err) {
        if (!cancelled) setError(err.userMessage || T.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Process students to calculate rank, commitment, and completion based on real data
  const processedStudents = useMemo(() => {
    // 1. Sort by completion to determine rank
    const sorted = [...students].sort((a, b) => b.lecturesCompleted - a.lecturesCompleted);
    
    // 2. Map and add rank/commitment
    return sorted.map((s, index) => {
      const rank = index + 1;
      const completion = Math.round((s.lecturesCompleted / Math.max(s.lecturesStarted, 1)) * 100);
      
      let commitment = 'needsAttention';
      if (completion >= 90 && s.lecturesCompleted > 5) commitment = 'excellent';
      else if (completion >= 70) commitment = 'good';
      else if (completion >= 40) commitment = 'average';

      return { ...s, rank, completion, commitment };
    });
  }, [students]);

  const stats = useMemo(() => {
    if (processedStudents.length === 0) return { total: 0, activeThisWeek: 0, avgCompletion: 0, totalHours: 0 };
    
    const total = processedStudents.length;
    const activeThisWeek = processedStudents.filter((s) => (Date.now() - new Date(s.lastActive).getTime()) < 7 * 86400000).length;
    const avgCompletion = Math.round(processedStudents.reduce((sum, s) => sum + s.completion, 0) / total);
    const totalHours = processedStudents.reduce((sum, s) => sum + s.hoursListened, 0);
    
    return { total, activeThisWeek, avgCompletion, totalHours };
  }, [processedStudents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = processedStudents.filter((s) => {
      const matchesQuery = !q || s.name.toLowerCase().includes(q) || s.phone.toLowerCase().includes(q);
      const matchesCommitment = commitmentFilter === 'all' || s.commitment === commitmentFilter;
      return matchesQuery && matchesCommitment;
    });
    
    list.sort((a, b) => {
      switch (sortBy) {
        case 'completed': return b.lecturesCompleted - a.lecturesCompleted;
        case 'hours': return b.hoursListened - a.hoursListened;
        case 'streak': return b.streak - a.streak;
        case 'lastActive': return new Date(b.lastActive) - new Date(a.lastActive);
        default: return a.rank - b.rank;
      }
    });
    return list;
  }, [processedStudents, query, commitmentFilter, sortBy]);

  const topThree = processedStudents.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-amiri text-2xl font-bold text-[#123D36] sm:text-3xl">{T.title}</h1>
          <p className="mt-1 text-sm text-[#70847F]">{T.subtitle}</p>
        </div>

        {error && (
          <div className="rounded-2xl border border-[#F4C7C7] bg-[#FDF1F1] px-5 py-4 text-sm text-[#A03030]">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<UsersIcon />} label={T.stats.totalStudents} value={stats.total} />
          <StatCard icon={<ActivityIcon />} label={T.stats.activeThisWeek} value={stats.activeThisWeek} accent="green" />
          <StatCard icon={<ChartIcon />} label={T.stats.avgCompletion} value={`${stats.avgCompletion}${T.percent}`} accent="blue" />
          <StatCard icon={<ClockIcon />} label={T.stats.totalHours} value={`${stats.totalHours.toFixed(1)}`} accent="amber" />
        </div>

        {/* Top students + Weekly activity */}
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          {/* Top students */}
          <div className="rounded-2xl border border-[#E0E8E5] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-amiri text-xl font-bold text-[#123D36]">{T.topStudents.title}</h2>
                <p className="mt-0.5 text-xs text-[#7B908B]">{T.topStudents.subtitle}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl bg-[#F8FBFA]" />)
              ) : topThree.length === 0 ? (
                <div className="col-span-3 py-10 text-center text-sm text-[#9AAEAA]">لا يوجد طلاب بعد</div>
              ) : (
                topThree.map((s, i) => {
                  const rankColors = ['bg-[#FFF4E0] text-[#A46E35]', 'bg-[#F0F5F3] text-[#617873]', 'bg-[#F5EFE0] text-[#8B6E32]'];
                  return (
                    <div key={s.id} className="rounded-2xl border border-[#F0F5F3] bg-[#FBFDFC] p-4 text-center">
                      <div className={`mx-auto grid h-11 w-11 place-items-center rounded-xl font-amiri text-lg font-bold ${rankColors[i]}`}>
                        {s.rank}
                      </div>
                      <div className="mx-auto mt-3 grid h-14 w-14 place-items-center rounded-full bg-[#0D9E84] font-amiri text-lg font-bold text-white">
                        {s.name.charAt(0)}
                      </div>
                      <p className="mt-3 truncate font-amiri text-sm font-bold text-[#153D36]">{s.name}</p>
                      <p className="mt-0.5 text-[10px] text-[#7B908B]">{s.lecturesCompleted.toLocaleString(locale)} درسًا مكتملًا</p>
                      <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-bold text-[#0B8D77]">
                        <FlameIcon /> {s.streak.toLocaleString(locale)} {T.days}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Weekly activity */}
          <div className="rounded-2xl border border-[#E0E8E5] bg-white p-5 sm:p-6">
            <div>
              <h2 className="font-amiri text-xl font-bold text-[#123D36]">{T.weeklyActivity.title}</h2>
              <p className="mt-0.5 text-xs text-[#7B908B]">{T.weeklyActivity.subtitle}</p>
            </div>
            <WeeklyChart />
          </div>
        </div>

        {/* Search & filters */}
        <div className="rounded-2xl border border-[#E0E8E5] bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-[#8BA09B]"><SearchIcon /></span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={T.searchPlaceholder}
                className="h-11 w-full rounded-xl border border-[#DDEAE6] bg-white ps-10 pe-3 text-sm text-[#153B35] outline-none placeholder:text-[#91A39F] focus:border-[#54BDA8]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={commitmentFilter} onChange={setCommitmentFilter}>
                <option value="all">{T.filters.commitment}: {T.filters.all}</option>
                <option value="excellent">{T.commitment.excellent}</option>
                <option value="good">{T.commitment.good}</option>
                <option value="average">{T.commitment.average}</option>
                <option value="needsAttention">{T.commitment.needsAttention}</option>
              </Select>
              <Select value={sortBy} onChange={setSortBy}>
                <option value="rank">{T.sort.rank}</option>
                <option value="completed">{T.sort.completed}</option>
                <option value="hours">{T.sort.hours}</option>
                <option value="streak">{T.sort.streak}</option>
                <option value="lastActive">{T.sort.lastActive}</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-[#E0E8E5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1024px] text-start">
              <thead className="bg-[#F8FBFA] text-[11px] font-bold uppercase tracking-wider text-[#9AAEAA]">
                <tr>
                  <th className="px-4 py-3 text-start">{T.table.rank}</th>
                  <th className="px-4 py-3 text-start">{T.table.student}</th>
                  <th className="px-4 py-3 text-start">{T.table.progress}</th>
                  <th className="px-4 py-3 text-start">{T.table.completed}</th>
                  <th className="px-4 py-3 text-start">{T.table.hours}</th>
                  <th className="px-4 py-3 text-start">{T.table.streak}</th>
                  <th className="px-4 py-3 text-start">{T.table.commitment}</th>
                  <th className="px-4 py-3 text-start">{T.table.lastActive}</th>
                  <th className="px-4 py-3 text-end">{T.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F5F3]">
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i}><td colSpan={9} className="px-4 py-4"><div className="h-10 animate-pulse rounded bg-[#F8FBFA]" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#F3F9F7] text-[#8BA09B]"><UsersIcon large /></div>
                      <p className="mt-4 font-amiri text-lg font-bold text-[#153D36]">{T.empty.title}</p>
                      <p className="mt-1 text-xs text-[#7B908B]">{T.empty.subtitle}</p>
                    </div>
                  </td></tr>
                ) : (
                  filtered.map((s) => {
                    return (
                      <tr key={s.id} className="text-sm transition hover:bg-[#F8FBFA]">
                        <td className="px-4 py-3">
                          <span className={`inline-grid h-8 w-8 place-items-center rounded-lg font-amiri text-sm font-bold ${
                            s.rank === 1 ? 'bg-[#FFF4E0] text-[#A46E35]' :
                            s.rank === 2 ? 'bg-[#F0F5F3] text-[#617873]' :
                            s.rank === 3 ? 'bg-[#F5EFE0] text-[#8B6E32]' :
                            'bg-[#F8FBFA] text-[#9AAEAA]'
                          }`}>{s.rank}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#EAF7F3] text-xs font-bold text-[#0B8D77]">
                              {s.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-[#153D36]">{s.name}</p>
                              <p className="mt-0.5 truncate text-[10px] text-[#9AAEAA]">{s.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#F0F5F3]">
                              <div className="h-full rounded-full bg-[#0D9E84]" style={{ width: `${s.completion}%` }} />
                            </div>
                            <span className="text-[11px] font-bold text-[#0B8D77]">{s.completion}{T.percent}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-[#153D36]">{s.lecturesCompleted.toLocaleString(locale)}</td>
                        <td className="px-4 py-3 text-xs text-[#6F8580]">{s.hoursListened.toFixed(1)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#A46E35]">
                            <FlameIcon /> {s.streak.toLocaleString(locale)}
                          </span>
                        </td>
                        <td className="px-4 py-3"><CommitmentBadge commitment={s.commitment} /></td>
                        <td className="px-4 py-3 text-xs text-[#6F8580]">{relativeTime(s.lastActive, locale)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <IconBtn title={T.actions.view} onClick={() => setModal({ type: 'view', payload: s })}><EyeIcon /></IconBtn>
                            <IconBtn title={T.actions.message}><MessageIcon /></IconBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal?.type === 'view' && <StudentModal t={T} student={modal.payload} onClose={() => setModal(null)} />}
    </div>
  );
}

/* =========================================================
   Sub-components
   ========================================================= */

function StatCard({ icon, label, value, accent = 'teal' }) {
  const accents = {
    teal: 'bg-[#EAF7F3] text-[#0B8D77]',
    green: 'bg-[#E6F7EC] text-[#1F8A4C]',
    blue: 'bg-[#E8F1FA] text-[#2B6CB0]',
    amber: 'bg-[#FFF4E0] text-[#A46E35]',
  };
  return (
    <div className="rounded-2xl border border-[#E0E8E5] bg-white p-5">
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${accents[accent]}`}>{icon}</div>
      <p className="mt-4 font-amiri text-3xl font-bold text-[#123D36]">{typeof value === 'number' ? value.toLocaleString('ar-EG') : value}</p>
      <p className="mt-1 text-xs text-[#7B908B]">{label}</p>
    </div>
  );
}

function WeeklyChart() {
  const data = [8, 12, 15, 10, 18, 22, 14];
  const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  const max = Math.max(...data);
  return (
    <div className="mt-5 flex h-40 items-end gap-2">
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-32 w-full items-end">
            <div className="w-full rounded-t-lg bg-gradient-to-t from-[#0D9E84] to-[#54BDA8] transition-all hover:opacity-80" style={{ height: `${(v / max) * 100}%` }} title={`${v} درسًا`} />
          </div>
          <span className="text-[10px] font-bold text-[#7B908B]">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

function CommitmentBadge({ commitment }) {
  const styles = {
    excellent: 'bg-[#E6F7EC] text-[#1F8A4C]',
    good: 'bg-[#EAF7F3] text-[#0B8D77]',
    average: 'bg-[#FFF4E0] text-[#A46E35]',
    needsAttention: 'bg-[#FEF2F2] text-[#B91C1C]',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[commitment]}`}>
      {T.commitment[commitment]}
    </span>
  );
}

function StudentModal({ t, student, onClose }) {
  const locale = 'ar-EG';
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E0E8E5] bg-white p-6 shadow-[0_30px_80px_rgba(6,58,53,.2)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[#0D9E84] font-amiri text-xl font-bold text-white">
              {student.name.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AAEAA]">{t.modal.studentTitle}</p>
              <h3 className="mt-0.5 font-amiri text-xl font-bold text-[#123D36]">{student.name}</h3>
              <p className="mt-0.5 text-xs text-[#7B908B]">{student.phone}</p>
            </div>
          </div>
          <div className="text-center">
            <span className="inline-grid h-11 w-11 place-items-center rounded-xl bg-[#FFF4E0] font-amiri text-lg font-bold text-[#A46E35]">
              {student.rank}
            </span>
            <p className="mt-1 text-[10px] text-[#7B908B]">{t.modal.fields.rank}</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[#F0F5F3] bg-[#F8FBFA] p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#4A5F5A]">{t.modal.progress}</p>
            <span className="text-sm font-bold text-[#0B8D77]">{student.completion}{t.percent}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F0F5F3]">
            <div className="h-full rounded-full bg-[#0D9E84]" style={{ width: `${student.completion}%` }} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Detail label={t.modal.fields.joined} value={formatDate(student.joined, locale)} />
          <Detail label={t.modal.fields.completed} value={`${student.lecturesCompleted.toLocaleString(locale)} درسًا`} />
          <Detail label={t.modal.fields.started} value={`${student.lecturesStarted.toLocaleString(locale)} درسًا`} />
          <Detail label={t.modal.fields.hours} value={`${student.hoursListened.toFixed(1)} ${t.hoursUnit}`} />
          <Detail label={t.modal.fields.streak} value={`${student.streak.toLocaleString(locale)} ${t.days}`} />
          <Detail label={t.modal.fields.lastActive} value={relativeTime(student.lastActive, locale)} />
          <Detail label={t.modal.fields.commitment} value={<CommitmentBadge commitment={student.commitment} />} className="sm:col-span-2" />
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="rounded-lg bg-[#0D9E84] px-4 py-2 text-xs font-bold text-white hover:bg-[#0A8873]">{t.modal.close}</button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, className = '' }) {
  return (
    <div className={`rounded-xl border border-[#F0F5F3] bg-[#F8FBFA] p-3.5 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AAEAA]">{label}</p>
      <div className="mt-1 text-sm font-bold text-[#153D36]">{value}</div>
    </div>
  );
}

function Select({ value, onChange, children }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 cursor-pointer rounded-xl border border-[#DDEAE6] bg-white px-3 text-xs font-bold text-[#153B35] outline-none focus:border-[#54BDA8]">
      {children}
    </select>
  );
}

function IconBtn({ children, title, onClick, danger }) {
  return (
    <button onClick={onClick} title={title} aria-label={title}
      className={`grid h-8 w-8 place-items-center rounded-lg border transition ${danger ? 'border-transparent text-[#B91C1C] hover:border-[#F4C4C4] hover:bg-[#FEF2F2]' : 'border-transparent text-[#617873] hover:border-[#C8DCD7] hover:bg-[#F3F9F7] hover:text-[#0D9E84]'}`}>
      {children}
    </button>
  );
}

function formatDate(iso, locale) {
  return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

function relativeTime(iso, locale) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 7) return `قبل ${days.toLocaleString(locale)} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7).toLocaleString(locale)} أسابيع`;
  return formatDate(iso, locale);
}

/* =========================================================
   Icons
   ========================================================= */

function SearchIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" strokeLinecap="round" /></svg> }
function UsersIcon({ large = false }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={large ? 'h-6 w-6' : 'h-5 w-5'}><circle cx="9" cy="8" r="3.5" /><path d="M2 20a7 7 0 0 1 14 0" strokeLinecap="round" /><path d="M17 8.5a3 3 0 1 1 0 5M22 20a6 6 0 0 0-5-5.9" strokeLinecap="round" /></svg> }
function ActivityIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M3 12h4l3-8 4 16 3-8h4" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function ChartIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" /></svg> }
function ClockIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function FlameIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9Z" strokeLinejoin="round" /></svg> }
function EyeIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg> }
function MessageIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 5h16v12H8l-4 4V5Z" strokeLinejoin="round" /></svg> }