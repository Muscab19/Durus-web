import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { adminApi } from '../../api/client.js';

/* =========================================================
   i18n — Arabic (default) + English
   ========================================================= */

const TRANSLATIONS = {
  ar: {
    dir: 'rtl',
    brand: {
      title: 'لوحة التحكم',
      subtitle: 'مكتبة الشيخ نور علي جامع',
      library: 'مكتبة الشيخ نور علي جامع',
    },
    header: {
      viewSite: 'عرض الموقع',
      admin: 'المشرف',
      adminEmail: 'admin@example.com',
      toggleLang: 'English',
    },
    sidebar: {
      overview: 'نظرة عامة',
      uploadLecture: 'رفع درس جديد',
      lectures: 'إدارة الدروس',
      students: 'متابعة الطلاب',
      users: 'المستخدمون',
      certificates: 'إدارة الشهادات',
      settings: 'الإعدادات العامة',
      profile: 'الملف الشخصي',
      version: 'إصدار 1.0.0',
      versionNote: 'لوحة تحكم مكتبة الشيخ نور علي جامع.',
    },
    overview: {
      title: 'نظرة عامة',
      subtitle: 'ملخص شامل عن محتوى المكتبة والمستخدمين.',
      exportReport: 'تصدير التقرير',
      addLecture: 'إضافة درس',
      stats: {
        totalLectures: 'إجمالي الدروس',
        totalBooks: 'الكتب والمتون',
        totalUsers: 'المستخدمون',
        totalHours: 'ساعات المحتوى',
      },
      recentLectures: {
        title: 'أحدث الدروس',
        subtitle: 'آخر الدروس المضافة إلى المكتبة.',
        viewAll: 'عرض الكل',
      },
      artsBreakdown: {
        title: 'توزيع الفنون',
        subtitle: 'عدد الدروس لكل فن.',
        courses: 'مقررات',
        books: 'كتب',
      },
      recentUsers: {
        title: 'أحدث المستخدمين',
        subtitle: 'آخر من انضم إلى المكتبة.',
        viewAll: 'عرض الكل',
        name: 'المستخدم',
        email: 'البريد الإلكتروني',
        role: 'الدور',
        joined: 'تاريخ الانضمام',
        lectures: 'الدروس',
        view: 'عرض',
      },
      minutes: 'د',
      empty: {
        recentLectures: 'لا توجد دروس بعد.',
        arts: 'لا توجد فنون بعد.',
        users: 'لا يوجد مستخدمون بعد.',
      },
      error: 'تعذّر تحميل البيانات. حاول تحديث الصفحة.',
    },
    roles: {
      student: 'طالب',
      studentF: 'طالبة',
      supervisor: 'مشرفة',
    },
  },
  en: {
    dir: 'ltr',
    brand: {
      title: 'Dashboard',
      subtitle: 'Sheikh Nuur Ali Jami Library',
      library: 'Sheikh Nuur Ali Jami Library',
    },
    header: {
      viewSite: 'View Site',
      admin: 'Admin',
      adminEmail: 'admin@example.com',
      toggleLang: 'العربية',
    },
    sidebar: {
      overview: 'Overview',
      uploadLecture: 'Upload New Lesson',
      lectures: 'Manage Lessons',
      students: 'Track Students',
      users: 'Users',
      certificates: 'Manage Certificates',
      settings: 'General Settings',
      profile: 'Profile',
      version: 'Version 1.0.0',
      versionNote: 'Dashboard for Sheikh Nuur Ali Jami Library.',
    },
    overview: {
      title: 'Overview',
      subtitle: 'A comprehensive summary of library content and users.',
      exportReport: 'Export Report',
      addLecture: 'Add Lecture',
      stats: {
        totalLectures: 'Total Lectures',
        totalBooks: 'Books & Texts',
        totalUsers: 'Users',
        totalHours: 'Content Hours',
      },
      recentLectures: {
        title: 'Recent Lectures',
        subtitle: 'Latest lectures added to the library.',
        viewAll: 'View All',
      },
      artsBreakdown: {
        title: 'Arts Distribution',
        subtitle: 'Number of lectures per art.',
        courses: 'courses',
        books: 'books',
      },
      recentUsers: {
        title: 'Recent Users',
        subtitle: 'Latest members who joined the library.',
        viewAll: 'View All',
        name: 'User',
        email: 'Email',
        role: 'Role',
        joined: 'Joined',
        lectures: 'Lectures',
        view: 'View',
      },
      minutes: 'min',
      empty: {
        recentLectures: 'No lectures yet.',
        arts: 'No arts yet.',
        users: 'No users yet.',
      },
      error: 'Failed to load data. Try refreshing.',
    },
    roles: {
      student: 'Student',
      studentF: 'Student',
      supervisor: 'Supervisor',
    },
  },
};

const I18nContext = createContext(null);
const useI18n = () => useContext(I18nContext);

/* =========================================================
   Dashboard Layout
   ========================================================= */

export default function Dashboard({ children, page = 'overview' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lang, setLang] = useState('ar');
  const location = useLocation();

  const t = TRANSLATIONS[lang];
  const activePage = page || getActivePage(location.pathname);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir;
    return () => {
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    };
  }, [lang, t.dir]);

  const toggleLang = () => setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang }}>
      <div dir={t.dir} className="min-h-screen bg-[#F5F7F6] text-[#102A27] font-sans">
        {/* ============ TOP HEADER ============ */}
        <header className="sticky top-0 z-40 border-b border-[#E0E8E5] bg-white/95 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-2 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="grid h-10 w-10 place-items-center rounded-lg border border-[#E0E8E5] text-[#4A5F5A] hover:bg-[#F3F9F7] lg:hidden"
                aria-label="Toggle sidebar"
              >
                <MenuIcon />
              </button>
              <Link to="/" className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#073A35] text-white">
                  <BookOpenIcon />
                </div>
                <div className="hidden sm:block">
                  <p className="font-amiri text-base font-bold leading-tight text-[#083D37]">{t.brand.title}</p>
                  <p className="text-[10px] tracking-wide text-[#6C8580]">{t.brand.subtitle}</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleLang}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8DCD7] bg-white px-3 py-2 text-xs font-bold text-[#173E38] transition hover:border-[#0D9E84] hover:text-[#0D9E84]"
                aria-label="Toggle language"
              >
                <GlobeIcon />
                <span>{t.header.toggleLang}</span>
              </button>

              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#C8DCD7] bg-white px-3.5 py-2 text-xs font-bold text-[#173E38] transition hover:border-[#0D9E84] hover:text-[#0D9E84]"
              >
                <HomeIcon /> {t.header.viewSite}
              </Link>

              <div className="flex items-center gap-2 rounded-lg border border-[#E0E8E5] bg-white px-3 py-1.5">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[#EAF7F3] text-xs font-bold text-[#0B8D77]">
                  {t.header.admin.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-[#153D36]">{t.header.admin}</p>
                  <p className="text-[10px] text-[#7B908B]">{t.header.adminEmail}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* ============ SIDEBAR (fixed) ============ */}
          <aside
            className={`fixed z-50 w-72 transform border-[#E0E8E5] bg-white transition-transform duration-300 ${
              t.dir === 'rtl' ? 'right-0 border-l' : 'left-0 border-r'
            } ${sidebarOpen ? 'translate-x-0' : t.dir === 'rtl' ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            style={{ top: '64px', height: 'calc(100vh - 64px)' }}
          >
            <div className="flex h-full flex-col overflow-y-auto p-4">
              <nav className="space-y-1">
                <SidebarLink to="/dashboard" icon={<GridIcon />} label={t.sidebar.overview} active={activePage === 'overview'} />
                <SidebarLink to="/dashboard/lectures/new" icon={<UploadIcon />} label={t.sidebar.uploadLecture} active={activePage === 'uploadLecture'} />
                <SidebarLink to="/dashboard/lectures" icon={<PlayCircleIcon />} label={t.sidebar.lectures} active={activePage === 'lectures'} />
                <SidebarLink to="/dashboard/students" icon={<UsersIcon />} label={t.sidebar.students} active={activePage === 'students'} />
                <SidebarLink to="/dashboard/users" icon={<UserIcon />} label={t.sidebar.users} active={activePage === 'users'} />
                <SidebarLink to="/dashboard/certificates" icon={<AwardIcon />} label={t.sidebar.certificates} active={activePage === 'certificates'} />
                <SidebarLink to="/dashboard/settings" icon={<SettingsIcon />} label={t.sidebar.settings} active={activePage === 'settings'} />
                <SidebarLink to="/dashboard/profile" icon={<UserCircleIcon />} label={t.sidebar.profile} active={activePage === 'profile'} />
              </nav>

              <div className="mt-auto rounded-xl border border-[#E0E8E5] bg-[#F3F9F7] p-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0D9E84] text-white">
                    <SparkleIcon />
                  </span>
                  <p className="text-xs font-bold text-[#153D36]">{t.sidebar.version}</p>
                </div>
                <p className="mt-2 text-[10px] leading-5 text-[#7B908B]">{t.sidebar.versionNote}</p>
              </div>
            </div>
          </aside>

          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* ============ MAIN CONTENT ============ */}
          <main
            className={`min-w-0 flex-1 p-4 sm:p-6 lg:p-8 ${
              t.dir === 'rtl' ? 'lg:mr-72' : 'lg:ml-72'
            }`}
          >
            {children || <OverviewPage />}
          </main>
        </div>
      </div>
    </I18nContext.Provider>
  );
}

/* =========================================================
   Active page detection
   ========================================================= */

function getActivePage(pathname) {
  if (pathname.includes('/lectures/new')) return 'uploadLecture';
  if (pathname.includes('/lectures')) return 'lectures';
  if (pathname.includes('/students')) return 'students';
  if (pathname.includes('/users')) return 'users';
  if (pathname.includes('/certificates')) return 'certificates';
  if (pathname.includes('/settings')) return 'settings';
  if (pathname.includes('/profile')) return 'profile';
  return 'overview';
}

/* =========================================================
   Overview Page — REAL DATA
   ========================================================= */

function OverviewPage() {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';

  const [stats, setStats] = useState(null);
  const [arts, setArts] = useState([]);
  const [recentLectures, setRecentLectures] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await adminApi.overview();
        if (cancelled) return;
        setStats(data.stats);
        setArts(data.arts || []);
        setRecentLectures(data.recentLectures || []);
        setRecentUsers(data.recentUsers || []);
      } catch (err) {
        if (!cancelled) setError(err.userMessage || t.overview.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [t.overview.error]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-amiri text-2xl font-bold text-[#123D36] sm:text-3xl">{t.overview.title}</h1>
          <p className="mt-1 text-sm text-[#70847F]">{t.overview.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8DCD7] bg-white px-3.5 py-2 text-xs font-bold text-[#173E38] transition hover:border-[#0D9E84] hover:text-[#0D9E84]">
            <DownloadIcon /> {t.overview.exportReport}
          </button>
          <Link
            to="/dashboard/lectures/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0D9E84] px-3.5 py-2 text-xs font-bold text-white shadow-[0_8px_20px_rgba(13,158,132,.22)] transition hover:bg-[#0A8873]"
          >
            <PlusIcon /> {t.overview.addLecture}
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-[#F4C7C7] bg-[#FDF1F1] px-5 py-4 text-sm text-[#A03030]">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<PlayCircleIcon />}
          label={t.overview.stats.totalLectures}
          value={stats?.totalLectures ?? 0}
          color="teal"
          loading={loading}
        />
        <StatCard
          icon={<BookIcon />}
          label={t.overview.stats.totalBooks}
          value={stats?.totalBooks ?? 0}
          color="blue"
          loading={loading}
        />
        <StatCard
          icon={<UsersIcon />}
          label={t.overview.stats.totalUsers}
          value={stats?.totalUsers ?? 0}
          color="amber"
          loading={loading}
        />
        <StatCard
          icon={<ClockIcon />}
          label={t.overview.stats.totalHours}
          value={stats?.totalHours ?? 0}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Recent Lectures */}
        <div className="rounded-2xl border border-[#E0E8E5] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-amiri text-xl font-bold text-[#123D36]">{t.overview.recentLectures.title}</h2>
              <p className="mt-0.5 text-xs text-[#7B908B]">{t.overview.recentLectures.subtitle}</p>
            </div>
            <Link to="/dashboard/lectures" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B806D] hover:underline">
              {t.overview.recentLectures.viewAll} <Arrow />
            </Link>
          </div>
          <div className="mt-5 divide-y divide-[#E8F0EE]">
            {loading ? (
              <LectureRowsSkeleton count={5} />
            ) : recentLectures.length === 0 ? (
              <EmptyRow text={t.overview.empty.recentLectures} />
            ) : (
              recentLectures.map((l) => <LectureRow key={l.id} lecture={l} />)
            )}
          </div>
        </div>

        {/* Arts Breakdown */}
        <div className="rounded-2xl border border-[#E0E8E5] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-amiri text-xl font-bold text-[#123D36]">{t.overview.artsBreakdown.title}</h2>
              <p className="mt-0.5 text-xs text-[#7B908B]">{t.overview.artsBreakdown.subtitle}</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {loading ? (
              <ArtBarsSkeleton count={4} />
            ) : arts.length === 0 ? (
              <EmptyRow text={t.overview.empty.arts} />
            ) : (
              arts.map((a, i) => (
                <ArtBar key={`${a.parent}-${i}`} art={a} max={Math.max(...arts.map((x) => x.lectures), 1)} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-[#E0E8E5] bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-amiri text-xl font-bold text-[#123D36]">{t.overview.recentUsers.title}</h2>
            <p className="mt-0.5 text-xs text-[#7B908B]">{t.overview.recentUsers.subtitle}</p>
          </div>
          <Link to="/dashboard/users" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B806D] hover:underline">
            {t.overview.recentUsers.viewAll} <Arrow />
          </Link>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[600px] text-start">
            <thead>
              <tr className="border-b border-[#E8F0EE] text-[11px] font-bold uppercase tracking-wider text-[#9AAEAA]">
                <th className="pb-3 pe-2 text-start">{t.overview.recentUsers.name}</th>
                <th className="pb-3 text-start">{t.overview.recentUsers.email}</th>
                <th className="pb-3 text-start">{t.overview.recentUsers.role}</th>
                <th className="pb-3 text-start">{t.overview.recentUsers.joined}</th>
                <th className="pb-3 text-start">{t.overview.recentUsers.lectures}</th>
                <th className="pb-3 ps-2 text-end"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F5F3]">
              {loading ? (
                <UserRowsSkeleton cols={6} rows={5} />
              ) : recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[#9AAEAA]">
                    {t.overview.empty.users}
                  </td>
                </tr>
              ) : (
                recentUsers.map((u) => {
                  const name = u.name;
                  const roleLabel = t.roles[u.role] || u.role;
                  const joined = formatDate(u.joined, lang);
                  return (
                    <tr key={u.id} className="text-sm transition hover:bg-[#F8FBFA]">
                      <td className="py-3 pe-2">
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-8 w-8 place-items-center rounded-full bg-[#EAF7F3] text-[11px] font-bold text-[#0B8D77]">
                            {name.charAt(0)}
                          </div>
                          <span className="font-bold text-[#153D36]">{name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-xs text-[#6F8580]" dir="ltr">{u.email || u.phone}</td>
                      <td className="py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          u.role === 'supervisor' ? 'bg-[#FFF4E0] text-[#A46E35]' : 'bg-[#EAF7F3] text-[#0B8D77]'
                        }`}>
                          {roleLabel}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-[#6F8580]">{joined}</td>
                      <td className="py-3 text-xs font-bold text-[#153D36]">{u.lectures}</td>
                      <td className="py-3 ps-2 text-end">
                        <Link to={`/dashboard/users/${u.id}`} className="text-xs font-bold text-[#0B806D] hover:underline">
                          {t.overview.recentUsers.view}
                        </Link>
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
  );
}

/* =========================================================
   Sub-components (design unchanged)
   ========================================================= */

function SidebarLink({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
        active
          ? 'bg-[#EAF7F3] text-[#0B8D77]'
          : 'text-[#4A5F5A] hover:bg-[#F3F9F7] hover:text-[#0D9E84]'
      }`}
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/60">{icon}</span>
      <span className="flex-1">{label}</span>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-[#0D9E84]" />}
    </Link>
  );
}

function StatCard({ icon, label, value, trend, color, loading = false }) {
  const colors = {
    teal: { bg: 'bg-[#EAF7F3]', text: 'text-[#0B8D77]' },
    blue: { bg: 'bg-[#E8F1FA]', text: 'text-[#2B6CB0]' },
    amber: { bg: 'bg-[#FFF4E0]', text: 'text-[#A46E35]' },
    purple: { bg: 'bg-[#F0EBFA]', text: 'text-[#6B46C1]' },
  };
  const c = colors[color] || colors.teal;
  const { lang } = useI18n();

  return (
    <div className="rounded-2xl border border-[#E0E8E5] bg-white p-5">
      <div className="flex items-center justify-between">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${c.bg} ${c.text}`}>{icon}</div>
        {trend && (
          <span className="rounded-full bg-[#EAF7F3] px-2 py-1 text-[10px] font-bold text-[#0B8D77]">{trend}</span>
        )}
      </div>
      {loading ? (
        <div className="mt-4 h-9 w-20 animate-pulse rounded bg-[#F0F5F3]" />
      ) : (
        <p className="mt-4 font-amiri text-3xl font-bold text-[#123D36]">
          {Number(value).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
        </p>
      )}
      <p className="mt-1 text-xs text-[#7B908B]">{label}</p>
    </div>
  );
}

function LectureRow({ lecture }) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const mins = Math.round((lecture.durationSeconds || 0) / 60);
  const title = (isAr && lecture.titleArabic) || lecture.title;
  const book = (isAr && lecture.bookArabic) || lecture.book;
  const course = (isAr && lecture.courseArabic) || lecture.course;

  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EAF7F3] text-[#0B8D77]">
        {lecture.type === 'audio' ? <HeadphonesIcon /> : <PlayCircleIcon />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-amiri text-sm font-bold text-[#153D36]">{title}</p>
        <p className="mt-0.5 truncate text-[11px] text-[#7B908B]">{book} · {course}</p>
      </div>
      <div className="hidden items-center gap-3 text-[11px] text-[#8BA09B] sm:flex">
        <span className="rounded-full bg-[#F3F9F7] px-2.5 py-1">
          {mins.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {t.overview.minutes}
        </span>
      </div>
    </div>
  );
}

function ArtBar({ art, max }) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const percent = Math.round((art.lectures / max) * 100);
  const name = (isAr && art.parentArabic) || art.parent;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[#153D36]">{name}</p>
        <span className="text-[11px] font-bold text-[#0B8D77]">
          {art.lectures.toLocaleString(isAr ? 'ar-EG' : 'en-US')}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F0F5F3]">
        <div className="h-full rounded-full bg-[#0D9E84] transition-all" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-[#9AAEAA]">
        <span>{art.courses} {t.overview.artsBreakdown.courses}</span>
        <span className="h-1 w-1 rounded-full bg-[#C8DCD7]" />
        <span>{art.books} {t.overview.artsBreakdown.books}</span>
      </div>
    </div>
  );
}

/* ---------- Loading / empty helpers (keep same visual language) ---------- */

function LectureRowsSkeleton({ count = 5 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3.5">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-[#F0F5F3]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-[#F0F5F3]" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-[#F0F5F3]" />
          </div>
        </div>
      ))}
    </>
  );
}

function ArtBarsSkeleton({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-1/2 animate-pulse rounded bg-[#F0F5F3]" />
          <div className="h-2 w-full animate-pulse rounded-full bg-[#F0F5F3]" />
        </div>
      ))}
    </>
  );
}

function UserRowsSkeleton({ cols = 6, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="py-3 pe-2">
              <div className="h-3 w-20 animate-pulse rounded bg-[#F0F5F3]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function EmptyRow({ text }) {
  return (
    <div className="py-10 text-center text-sm text-[#9AAEAA]">{text}</div>
  );
}

/* ---------- Date helper ---------- */

function formatDate(iso, lang) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

/* =========================================================
   Icons (unchanged)
   ========================================================= */

function MenuIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" /></svg> }
function BookOpenIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" strokeLinejoin="round" /></svg> }
function HomeIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Z" strokeLinejoin="round" /><path d="M9 22V12h6v10" strokeLinejoin="round" /></svg> }
function GridIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg> }
function PlayCircleIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4V8Z" strokeLinejoin="round" /></svg> }
function BookIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M2 4h6a4 4 0 0 1 4 4v12a4 4 0 0 0-4-4H2V4Z" strokeLinejoin="round" /><path d="M22 4h-6a4 4 0 0 0-4 4v12a4 4 0 0 1 4-4h6V4Z" strokeLinejoin="round" /></svg> }
function LayersIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="m12 2 9 5-9 5-9-5 9-5Z" strokeLinejoin="round" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" strokeLinejoin="round" /></svg> }
function BrushIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M9.5 14.5 3 21l6.5-6.5M14.5 4.5l5 5-7 7-5-5 7-7Z" strokeLinejoin="round" /><path d="m17 2 5 5" strokeLinecap="round" /></svg> }
function UsersIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><circle cx="9" cy="8" r="3.5" /><path d="M2 20a7 7 0 0 1 14 0" strokeLinecap="round" /><path d="M17 8.5a3 3 0 1 1 0 5M22 20a6 6 0 0 0-5-5.9" strokeLinecap="round" /></svg> }
function ChartIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" /></svg> }
function SettingsIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" strokeLinejoin="round" /></svg> }
function UserIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" /></svg> }
function UserCircleIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="3" /><path d="M6.5 19a6 6 0 0 1 11 0" strokeLinecap="round" /></svg> }
function SparkleIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" strokeLinecap="round" /></svg> }
function PlusIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg> }
function DownloadIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function GlobeIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" strokeLinecap="round" /></svg> }
function Arrow() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function HeadphonesIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M18 19h1a1 1 0 0 0 1-1v-4h-4v4a1 1 0 0 0 1 1h1ZM6 19H5a1 1 0 0 1-1-1v-4h4v4a1 1 0 0 1-1 1H6Z" /></svg> }
function ClockIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function UploadIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M12 16V4M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 20h16" strokeLinecap="round" /></svg> }
function AwardIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><circle cx="12" cy="9" r="6" /><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8" strokeLinejoin="round" /></svg> }