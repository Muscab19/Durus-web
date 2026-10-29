import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { lecturesApi, progressApi, browseApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import shaykhImage from '../../src/shaykh-image.jpg';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [arts, setArts] = useState([]);
  const [latest, setLatest] = useState([]);
  const [summary, setSummary] = useState(null);
  const [totalStats, setTotalStats] = useState({ arts: 0, books: 0, lectures: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Fetch real Arts, Books, and Stats ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const browseData = await browseApi.get();
        if (!cancelled) {
          setArts(browseData.arts || []);
          const artsCount = browseData.arts?.length || 0;
          const booksCount = (browseData.arts || []).reduce((sum, a) => sum + (a.bookCount || 0), 0);
          const lecturesCount = (browseData.arts || []).reduce((sum, a) => sum + (a.lectureCount || 0), 0);
          setTotalStats({ arts: artsCount, books: booksCount, lectures: lecturesCount });
        }
      } catch (err) {
        if (!cancelled) setError(err.userMessage || 'تعذّر تحميل المكتبة');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // --- Fetch Latest 6 Lectures ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await lecturesApi.list({ latest: 6 });
        if (!cancelled) setLatest(data.lectures || []);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // --- Fetch Progress Summary ---
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await progressApi.me();
        if (!cancelled) setSummary(data);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7FAF8] text-[#102A27]">
      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-50 border-b border-[#DCEBE6] bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#073A35] text-white shadow-sm">
                <BookOpenIcon />
              </div>
              <div className="hidden sm:block">
                <p className="font-amiri text-base font-bold text-[#083D37] leading-tight">
                  مكتبة الشيخ نور علي جامع
                </p>
                <p className="text-[10px] tracking-wide text-[#6C8580]">
                  المكتبة العلمية الرقمية
                </p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              <NavTab to="/" icon={<HomeIcon />} label="الرئيسية" active />
              <NavTab to="/browse" icon={<LibraryIcon />} label="المكتبة" />
              <NavTab to="/me" icon={<UserIcon />} label="تقدّمي" />
            </nav>

            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/login" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#C8DCD7] bg-white px-3.5 py-2 text-xs font-bold text-[#173E38] hover:border-[#0D9E84] hover:text-[#0D9E84] transition">
                  <LoginIcon /> تسجيل الدخول
                </Link>
                <Link to="/register" className="inline-flex items-center gap-1.5 rounded-lg bg-[#0D9E84] px-3.5 py-2 text-xs font-bold text-white shadow-[0_8px_20px_rgba(13,158,132,.22)] hover:bg-[#0A8873] transition">
                  <UserPlusIcon /> تسجيل مجاني
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-xs text-[#5F7772]">أهلًا، {user?.name}</span>
                <Link to="/me" className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8DCD7] bg-white px-3.5 py-2 text-xs font-bold text-[#173E38] hover:border-[#0D9E84] transition">
                  <UserIcon /> تقدّمي
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

{/* ============ HERO — DESIGN 2: CINEMATIC ============ */}
<section className="relative isolate min-h-[650px] overflow-hidden bg-[#062F2B] lg:min-h-[700px]">

  {/* Full background image */}
  <div className="absolute inset-0">
    <img
      src={shaykhImage}
      alt="فضيلة الشيخ نور علي جامع"
      className="h-full w-full object-cover object-center lg:object-left"
    />

    {/* RTL readability overlays */}
    <div className="absolute inset-0 bg-[#052D29]/25" />
    <div className="absolute inset-0 bg-gradient-to-l from-[#052E2A]/95 via-[#052E2A]/80 via-50% to-[#052E2A]/15" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#041F1D]/65 via-transparent to-[#041F1D]/15" />
  </div>

  {/* Fine texture */}
  <div
    className="pointer-events-none absolute inset-0 opacity-[0.06]"
    style={{
      backgroundImage:
        'radial-gradient(circle, rgba(255,255,255,.8) .7px, transparent .7px)',
      backgroundSize: '25px 25px',
    }}
  />

  {/* Gold decorative lines */}
  <div className="absolute right-0 top-[20%] hidden h-px w-[9%] bg-gradient-to-l from-[#D4B96B] to-transparent lg:block" />
  <div className="absolute right-[8%] top-[20%] hidden h-2 w-2 translate-y-[-3.5px] rounded-full bg-[#D4B96B] lg:block" />

  <div className="relative mx-auto flex min-h-[650px] max-w-7xl items-center px-5 py-14 sm:px-8 lg:min-h-[700px]">
    <div className="w-full max-w-[680px]">

      {/* Eyebrow */}
      <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-[#64DCC4]" />
        <span className="text-[10px] font-bold text-[#D9EEE9]">
          مكتبة الشيخ نور علي جامع
        </span>
      </div>

      {/* Main heading */}
      <h1 className="mt-7 font-amiri text-[44px] font-bold leading-[1.22] text-white sm:text-[58px] lg:text-[72px]">
        إرثٌ علمي
        <span className="block text-[#65D9C2]">
          محفوظٌ بين يديك
        </span>
      </h1>

      <p className="mt-5 max-w-xl text-sm leading-8 text-[#C3DAD5] sm:text-[15px]">
        استمع وشاهد دروس فضيلة الشيخ نور علي جامع، وتصفّح الشروح
        والكتب والسلاسل العلمية ضمن مكتبة رقمية منظمة وسهلة الوصول.
      </p>

      {/* Search glass panel */}
      <div className="relative z-50 mt-8 max-w-[620px] rounded-[22px] border border-white/15 bg-white/[0.09] p-2.5 shadow-[0_20px_60px_rgba(0,0,0,.18)] backdrop-blur-xl">
        <LiveSearch />
      </div>

      {/* CTAs */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/browse"
          className="group inline-flex items-center gap-3 rounded-xl bg-[#11A98C] px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_35px_rgba(17,169,140,.25)] transition hover:bg-[#16B99B]"
        >
          دخول المكتبة
          <span className="transition-transform group-hover:-translate-x-1">
            <Arrow light />
          </span>
        </Link>

        {isAuthenticated ? (
          <Link
            to="/me"
            className="inline-flex items-center rounded-xl border border-white/20 bg-white/[0.08] px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/[0.14]"
          >
            متابعة تقدّمي
          </Link>
        ) : (
          <Link
            to="/register"
            className="inline-flex items-center rounded-xl border border-white/20 bg-white/[0.08] px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/[0.14]"
          >
            إنشاء حساب مجاني
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="mt-10 grid max-w-[610px] grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-black/[0.10] backdrop-blur-md">
        <div className="px-4 py-4 text-center">
          <strong className="block text-xl font-extrabold text-white sm:text-2xl">
            {Number(totalStats.arts).toLocaleString('ar-EG')}
          </strong>
          <span className="mt-1 block text-[10px] font-bold text-[#A8C9C2]">
            تخصصات
          </span>
        </div>

        <div className="border-x border-white/10 px-4 py-4 text-center">
          <strong className="block text-xl font-extrabold text-white sm:text-2xl">
            {Number(totalStats.books).toLocaleString('ar-EG')}
          </strong>
          <span className="mt-1 block text-[10px] font-bold text-[#A8C9C2]">
            كتب ومتون
          </span>
        </div>

        <div className="px-4 py-4 text-center">
          <strong className="block text-xl font-extrabold text-white sm:text-2xl">
            {Number(totalStats.lectures).toLocaleString('ar-EG')}
          </strong>
          <span className="mt-1 block text-[10px] font-bold text-[#A8C9C2]">
            دروس
          </span>
        </div>
      </div>
    </div>
  </div>

  {/* Bottom fade into next white/light section */}
  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/10 to-transparent" />
</section>

      {/* ============ PROGRESS STRIP ============ */}
      {isAuthenticated && summary && (
        <section className="mx-auto max-w-7xl px-5 sm:px-8 pt-10 relative z-10">
          <div className="grid lg:grid-cols-[1.3fr_.7fr] overflow-hidden rounded-[24px] border border-[#DDEAE6] bg-white shadow-[0_12px_40px_rgba(18,61,54,.05)]">
            <div className="p-7 border-b lg:border-b-0 lg:border-l border-[#E3EEEB]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <div>
                  <p className="text-[11px] font-bold text-[#0D9E84]">مساحتك العلمية</p>
                  <h2 className="mt-1 font-amiri text-2xl font-bold text-[#123D36]">أهلًا بعودتك، {user?.name}</h2>
                  <p className="mt-1 text-sm text-[#738782]">واصل تعلّمك من حيث توقفت.</p>
                </div>
                <Link to="/me" className="inline-flex items-center gap-2 text-sm font-bold text-[#0B806D] hover:text-[#0D9E84]">عرض سجل التعلّم <Arrow /></Link>
              </div>
            </div>
            <div className="grid grid-cols-3 bg-[#F3F9F7] divide-x-reverse divide-x divide-[#DDEAE6]">
              <Stat value={Math.round((summary.totals?.uniqueSeconds || 0) / 360) / 10} label="ساعة استماع" />
              <Stat value={summary.totals?.lecturesStarted || 0} label="بدأتها" />
              <Stat value={summary.totals?.lecturesCompleted || 0} label="أكملتها" />
            </div>
          </div>
        </section>
      )}

      {/* ============ LATEST LECTURES ============ */}
      {latest.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 sm:px-8 py-14 sm:py-20">
          <SectionTitle eyebrow="الجديد في المكتبة" title="أحدث الدروس" description="تابع آخر ما أضيف من الدروس والشروح." to="/browse" />
          <div className="mt-8 grid lg:grid-cols-[1.05fr_.95fr] gap-6">
            <FeaturedLecture lecture={latest[0]} />
            <div className="grid sm:grid-cols-2 gap-4">
              {latest.slice(1, 5).map((l) => <CompactLecture key={l.id} lecture={l} />)}
            </div>
          </div>
        </section>
      )}

      {/* ============ ALL ARTS ============ */}
      <section className="bg-[#EDF6F3] border-y border-[#DDEAE6]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-20">
          <SectionTitle eyebrow="الفهرس العلمي" title="تصفّح حسب التخصص" description="اختر العلم الذي تريد، ثم انتقل إلى كتبه ودروسه مباشرة." to="/browse" />

          {loading && <DisciplineSkeleton />}

          {!loading && error && (
            <div className="rounded-2xl border border-[#F4C7C7] bg-[#FDF1F1] px-5 py-4 text-sm text-[#A03030]">{error}</div>
          )}

          {!loading && !error && arts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#BFD9D2] bg-white px-8 py-16 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#EAF7F3] text-3xl">📚</div>
              <p className="mt-4 font-amiri text-xl font-bold text-[#123D36]">المكتبة قيد التجهيز</p>
              <p className="mt-2 text-sm text-[#70847F]">بمجرّد أن يرفع فريق الشيخ أولى المحاضرات، ستظهر هنا.</p>
            </div>
          )}

          {!loading && !error && arts.length > 0 && (
            <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {arts.map((a, i) => (
                <DisciplineCard key={a.id} art={a} index={i + 1} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ VERSE ============ */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-20">
        <div className="relative overflow-hidden rounded-[32px] bg-[#073A35] px-8 sm:px-12 py-12 sm:py-16 text-white shadow-xl">
          <div className="absolute inset-0 opacity-[.08]" style={{ backgroundImage: 'radial-gradient(circle,#50D3B8 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-right">
            <div>
              <p className="font-amiri text-3xl sm:text-4xl font-bold leading-relaxed">﴿ وَقُل رَّبِّ زِدْنِي عِلْمًا ﴾</p>
              <p className="mt-3 text-sm text-[#A9CEC6]">سورة طه — الآية ١١٤</p>
            </div>
            <Link to="/browse" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#11A98C] px-8 py-4 text-base font-bold text-white hover:bg-[#16B99B] transition shadow-lg shrink-0">
              دخول المكتبة <Arrow light />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-[#DDEAE6] bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#073A35] text-white shadow-md"><BookOpenIcon large /></div>
            <div>
              <p className="font-amiri text-xl font-bold text-[#123D36]">مكتبة الشيخ نور علي جامع</p>
              <p className="text-xs text-[#7B908B] mt-1">حفظ العلم · ترتيب الدروس · تيسير الوصول</p>
            </div>
          </div>
          <div className="flex gap-8 text-sm font-semibold text-[#617873]">
            <Link to="/browse" className="hover:text-[#0D9E84] transition">المكتبة</Link>
            <Link to="/me" className="hover:text-[#0D9E84] transition">تقدّمي</Link>
            <Link to="/login" className="hover:text-[#0D9E84] transition">تسجيل الدخول</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* =========================================================
   Sub-components
   ========================================================= */

function LiveSearch() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await browseApi.get({ q: q.trim() });
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [q]);

  return (
    <div className="relative">
      <form
        onSubmit={(e) => { e.preventDefault(); if (q.trim()) navigate(`/browse?q=${encodeURIComponent(q.trim())}`); }}
        className="flex rounded-2xl border border-[#CFE1DC] bg-white p-2 shadow-[0_12px_35px_rgba(18,61,54,.08)] focus-within:border-[#54BDA8] focus-within:ring-4 focus-within:ring-[#0D9E84]/10 transition"
      >
        <input
          dir="rtl"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن كتاب، متن، أو درس..."
          className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-[#153B35] outline-none placeholder:text-[#91A39F]"
        />
        <button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#073A35] text-white hover:bg-[#0D9E84] transition" aria-label="بحث">
          <SearchIcon />
        </button>
      </form>

      {/* Live Search Results Dropdown */}
      {q.trim() && (
        <div className="absolute top-full inset-x-0 mt-2 rounded-2xl border border-[#E0E8E5] bg-white shadow-2xl overflow-hidden z-50">
          {loading ? (
            <div className="p-4 text-center text-sm text-[#7B908B]">جارٍ البحث...</div>
          ) : results && (results.lectures?.length > 0 || results.books?.length > 0) ? (
            <div className="max-h-80 overflow-y-auto">
              {/* Lectures */}
              {results.lectures?.map(l => (
                <button key={l.id} onClick={() => navigate(`/lectures/${l.id}`)} className="w-full text-right p-4 border-b border-[#F0F5F3] hover:bg-[#F8FBFA] flex items-center gap-3 transition">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#EAF7F3] text-[#0B8D77] text-xs">{l.type === 'audio' ? '🎧' : '▶'}</span>
                  <div>
                    <p className="font-bold text-sm text-[#153D36]">{l.titleArabic || l.title}</p>
                    <p className="text-xs text-[#7B908B]">درس</p>
                  </div>
                </button>
              ))}
              {/* Books */}
              {results.books?.map(b => (
                <button key={b.id} onClick={() => navigate(`/browse?bookId=${b.id}`)} className="w-full text-right p-4 border-b border-[#F0F5F3] hover:bg-[#F8FBFA] flex items-center gap-3 transition">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#EAF7F3] text-[#0B8D77]"><BookIcon /></span>
                  <div>
                    <p className="font-bold text-sm text-[#153D36]">{b.name}</p>
                    <p className="text-xs text-[#7B908B]">كتاب · {b.author}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-[#7B908B]">لا توجد نتائج مطابقة.</div>
          )}
        </div>
      )}
    </div>
  );
}

function NavTab({ to, icon, label, active = false }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${active ? 'bg-[#EAF7F3] text-[#0B8D77]' : 'text-[#4A5F5A] hover:bg-[#F3F9F7] hover:text-[#0D9E84]'}`}>
      <span className="h-4 w-4">{icon}</span>
      {label}
    </Link>
  );
}

function SectionTitle({ eyebrow, title, description, to }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-px w-8 bg-[#0D9E84]" />
          <p className="text-[11px] font-bold text-[#0B8D77]">{eyebrow}</p>
        </div>
        <h2 className="mt-2 font-amiri text-3xl sm:text-[38px] font-bold text-[#123D36]">{title}</h2>
        {description && <p className="mt-2 text-sm text-[#70847F]">{description}</p>}
      </div>
      {to && (
        <Link to={to} className="inline-flex items-center gap-2 text-sm font-bold text-[#0B806D] hover:text-[#0D9E84] transition">
          عرض الكل <Arrow />
        </Link>
      )}
    </div>
  );
}

function HeroStat({ value, label }) {
  return (
    <div className="px-4 first:pr-0 text-center sm:text-right">
      <strong className="block text-2xl font-extrabold text-[#073A35]">{Number(value).toLocaleString('ar-EG')}</strong>
      <span className="mt-1 block text-[11px] text-[#7A908B] font-bold">{label}</span>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="grid place-items-center p-6 text-center">
      <strong className="text-2xl sm:text-3xl text-[#0B806D] font-amiri">{Number(value).toLocaleString('ar-EG')}</strong>
      <span className="mt-2 text-xs font-bold text-[#718680]">{label}</span>
    </div>
  );
}

function DisciplineSkeleton() {
  return (
    <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-56 animate-pulse rounded-3xl border border-[#D8E8E3] bg-white" />)}
    </div>
  );
}

function FeaturedLecture({ lecture }) {
  const mins = Math.round((lecture.durationSeconds || 0) / 60);
  const title = lecture.titleArabic || lecture.title;
  return (
    <Link to={`/lectures/${lecture.id}`} className="group relative min-h-[360px] overflow-hidden rounded-[32px] bg-[#073A35] p-8 text-white shadow-[0_20px_60px_rgba(7,58,53,.2)] flex flex-col justify-between transition-transform hover:-translate-y-1">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 12% 10%,rgba(22,185,155,.32),transparent 28%),linear-gradient(145deg,transparent 35%,rgba(0,0,0,.18))' }} />
      <div className="absolute -left-10 -bottom-12 h-64 w-64 rounded-full border-[40px] border-[#13A98D]/10" />
      <div className="relative flex items-center justify-between z-10">
        <span className="rounded-full border border-[#56CBB4]/25 bg-[#0C7E6D]/20 px-4 py-1.5 text-[11px] font-bold text-[#83E0CE]">{lecture.type === 'audio' ? 'درس صوتي' : 'درس مرئي'}</span>
        <span className="text-[12px] font-bold text-white/60">{mins.toLocaleString('ar-EG')} دقيقة</span>
      </div>
      <div className="relative mt-20 z-10">
        <p className="text-sm font-semibold text-[#4ED0B7] mb-2">{lecture.courseArabic || lecture.course} · {lecture.bookArabic || lecture.book}</p>
        <h3 className="max-w-xl font-amiri text-3xl sm:text-[40px] font-bold leading-snug">{title}</h3>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white group-hover:text-[#83E0CE] transition">فتح الدرس <Arrow light /></span>
      </div>
    </Link>
  );
}

function CompactLecture({ lecture }) {
  const mins = Math.round((lecture.durationSeconds || 0) / 60);
  const title = lecture.titleArabic || lecture.title;
  return (
    <Link to={`/lectures/${lecture.id}`} className="group flex flex-col justify-between rounded-3xl border border-[#DDEAE6] bg-white p-6 hover:-translate-y-1 hover:border-[#8BCBBC] hover:shadow-[0_16px_40px_rgba(18,61,54,.08)] transition">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EAF7F3] text-[#0B8D77]"><PlayIcon /></div>
        <span className="text-[11px] font-bold text-[#8BA09B] bg-[#F8FBFA] px-2 py-1 rounded-md">{mins.toLocaleString('ar-EG')} د</span>
      </div>
      <div>
        <p className="font-amiri text-lg font-bold leading-snug text-[#173F38] group-hover:text-[#0B8D77] line-clamp-2">{title}</p>
        <p className="mt-2 text-[11px] text-[#829691] truncate">{lecture.bookArabic || lecture.book}</p>
      </div>
    </Link>
  );
}

function DisciplineCard({ art, index }) {
  return (
    <Link to={`/browse?artId=${art.id}`} className="group flex flex-col justify-between rounded-[24px] border border-[#D8E8E3] bg-white p-6 hover:-translate-y-1 hover:border-[#86C8B9] hover:shadow-[0_20px_40px_rgba(18,61,54,.08)] transition min-h-[200px]">
      <div>
        <div className="flex items-center justify-between mb-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF7F3] text-xs font-extrabold text-[#0B8D77]">{String(index).padStart(2, '0')}</span>
          <span className="grid h-9 w-9 place-items-center rounded-full border border-[#D9E8E4] text-[#55716B] group-hover:bg-[#0D9E84] group-hover:text-white transition"><Arrow /></span>
        </div>
        <h3 className="font-amiri text-2xl font-bold text-[#153D36] group-hover:text-[#0B8D77] line-clamp-2">{art.name}</h3>
        {art.nameEn && art.nameEn !== art.name && <p dir="ltr" className="mt-1 text-xs text-[#91A39F] text-right truncate">{art.nameEn}</p>}
      </div>
      <div className="mt-6 flex flex-wrap gap-2 border-t border-[#F0F5F3] pt-4">
        <span className="rounded-lg bg-[#F2F8F6] px-3 py-1.5 text-[11px] font-bold text-[#6F8580]">{art.bookCount.toLocaleString('ar-EG')} كتب</span>
        <span className="rounded-lg bg-[#F2F8F6] px-3 py-1.5 text-[11px] font-bold text-[#6F8580]">{art.lectureCount.toLocaleString('ar-EG')} دروس</span>
      </div>
    </Link>
  );
}

/* =========================================================
   Icons
   ========================================================= */

function Arrow({ light = false }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 ${light ? 'text-white' : ''}`}><path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" strokeLinecap="round" /></svg>;
}
function PlayIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="m9 7 8 5-8 5V7Z" strokeLinejoin="round" /></svg>;
}
function BookOpenIcon({ large = false }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={large ? 'h-7 w-7' : 'h-5 w-5'}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" strokeLinejoin="round" /></svg>;
}
function BookIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M2 4h6a4 4 0 0 1 4 4v12a4 4 0 0 0-4-4H2V4Z" strokeLinejoin="round" /><path d="M22 4h-6a4 4 0 0 0-4 4v12a4 4 0 0 1 4-4h6V4Z" strokeLinejoin="round" /></svg>;
}
function GeometricMark() {
  return <svg viewBox="0 0 120 120" fill="none" stroke="#64DCC4" strokeWidth="1.2"><path d="M60 5 88 21 115 60 88 99 60 115 32 99 5 60 32 21 60 5Z" /><path d="M60 20 78 42 100 60 78 78 60 100 42 78 20 60 42 42 60 20Z" /><circle cx="60" cy="60" r="19" /><path d="M5 60h110M60 5v110" /></svg>;
}
function HomeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Z" strokeLinejoin="round" /><path d="M9 22V12h6v10" strokeLinejoin="round" /></svg>;
}
function LibraryIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" strokeLinejoin="round" /><path d="M8 7h8M8 11h6" strokeLinecap="round" /></svg>;
}
function UserIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" /></svg>;
}
function LoginIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" strokeLinecap="round" /><path d="M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function UserPlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0" strokeLinecap="round" /><path d="M19 8v6M22 11h-6" strokeLinecap="round" /></svg>;
}