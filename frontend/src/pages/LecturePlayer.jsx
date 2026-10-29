import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { lecturesApi, progressApi, browseApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import LecturePlayer from '../components/LecturePlayer.jsx';

export default function LecturePlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [lecture, setLecture] = useState(null);
  const [progress, setProgress] = useState(null);
  const [bookLectures, setBookLectures] = useState([]);
  const [book, setBook] = useState(null);
  const [art, setArt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch current lecture + progress + sibling lectures
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    (async () => {
      try {
        const lData = await lecturesApi.get(id);
        if (cancelled) return;
        const currentLecture = lData.lecture;
        setLecture(currentLecture);

        // Fetch progress if authenticated
        if (isAuthenticated) {
          try {
            const pData = await progressApi.forLecture(id);
            if (!cancelled) setProgress(pData.progress);
          } catch {}
        }

        // Fetch sibling lectures from the same book
        if (currentLecture.bookRef) {
          try {
            const bData = await browseApi.get({ bookId: currentLecture.bookRef });
            if (!cancelled) {
              setBook(bData.book);
              setArt(bData.art);
              setBookLectures(bData.lectures || []);
            }
          } catch {}
        }
      } catch (err) {
        if (!cancelled) setError(err.userMessage || 'تعذّر تحميل الدرس.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id, isAuthenticated]);

  // Find prev/next
  const currentIndex = bookLectures.findIndex((l) => l.id === id);
  const nextLecture = currentIndex >= 0 && currentIndex < bookLectures.length - 1
    ? bookLectures[currentIndex + 1]
    : null;

  const handleEnded = () => {
    if (nextLecture) navigate(`/lectures/${nextLecture.id}`);
  };

  const goToLecture = (lectureId) => {
    // Scroll to top when changing lectures
    window.scrollTo(0, 0);
    navigate(`/lectures/${lectureId}`);
  };

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen flex items-center justify-center bg-[#F7FAF8]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#EAF7F3] border-t-[#0D9E84]" />
          <p className="mt-4 text-sm text-[#7B908B]">جارٍ التحميل...</p>
        </div>
      </main>
    );
  }

  if (error || !lecture) {
    return (
      <main dir="rtl" className="min-h-screen flex items-center justify-center bg-[#F7FAF8]">
        <div className="text-center">
          <p className="text-lg font-bold text-[#A03030]">{error || 'الدرس غير موجود'}</p>
          <Link to="/browse" className="mt-4 inline-block text-sm font-bold text-[#0B806D] hover:underline">
            ← العودة للمكتبة
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7FAF8] text-[#102A27] pb-20">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-6">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-bold mb-6 flex-wrap bg-white px-4 py-3 rounded-xl border border-[#E0E8E5]">
          <Link to="/browse" className="text-[#7B908B] hover:text-[#0D9E84] transition">
            المكتبة
          </Link>
          {art && (
            <>
              <span className="text-[#C8DCD7]">/</span>
              <Link to={`/browse?artId=${art.id}`} className="text-[#7B908B] hover:text-[#0D9E84] transition">
                {art.name}
              </Link>
            </>
          )}
          {book && (
            <>
              <span className="text-[#C8DCD7]">/</span>
              <Link to={`/browse?bookId=${book.id}`} className="text-[#7B908B] hover:text-[#0D9E84] transition">
                {book.name}
              </Link>
            </>
          )}
          <span className="text-[#C8DCD7]">/</span>
          <span className="text-[#0D9E84] truncate">
            {lecture.titleArabic || lecture.title}
          </span>
        </nav>

        {/* Main Layout: Player Center, Sidebar Right (RTL) */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] items-start">
          
          {/* Left Column: Player + Info */}
          <div className="space-y-6 min-w-0">
            {/* Player Component */}
            <LecturePlayer
              key={lecture.id}
              lecture={lecture}
              initialPosition={progress?.lastPositionSeconds || 0}
              isAuthenticated={isAuthenticated}
              onEnded={handleEnded}
            />

            {/* Title + description */}
            <div className="rounded-3xl border border-[#E0E8E5] bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex rounded-full bg-[#EAF7F3] px-3 py-1 text-[11px] font-bold text-[#0B8D77]">
                  {lecture.type === 'audio' ? 'درس صوتي' : 'درس مرئي'}
                </span>
                <span className="text-xs text-[#9AAEAA]">
                  {Math.round((lecture.durationSeconds || 0) / 60).toLocaleString('ar-EG')} دقيقة
                </span>
              </div>
              <h1 className="font-amiri text-2xl sm:text-3xl font-bold text-[#123D36]">
                {lecture.titleArabic || lecture.title}
              </h1>
              <p className="mt-2 text-sm font-semibold text-[#A46E35]">
                {lecture.parentArabic || lecture.parent} · {lecture.bookArabic || lecture.book}
              </p>
              {lecture.description && (
                <p className="mt-4 text-sm text-[#6F8580] leading-relaxed">
                  {lecture.description}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Sidebar with all lectures in book */}
          <aside className="lg:sticky lg:top-6 h-[calc(100vh-3rem)] flex flex-col">
            <div className="rounded-3xl border border-[#E0E8E5] bg-white overflow-hidden flex flex-col shadow-sm h-full">
              
              <div className="p-5 border-b border-[#F0F5F3] bg-[#F8FBFA] flex items-center justify-between shrink-0">
                <h2 className="font-amiri text-lg font-bold text-[#123D36]">
                  محتوى الكتاب
                </h2>
                <span className="rounded-full bg-white border border-[#DDEAE6] px-2.5 py-0.5 text-[10px] font-bold text-[#6F8580]">
                  {bookLectures.length} دروس
                </span>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {bookLectures.map((l, i) => {
                  const isActive = l.id === lecture.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => goToLecture(l.id)}
                      className={`group w-full rounded-2xl p-3 text-right transition border ${
                        isActive
                          ? 'bg-[#EAF7F3] border-[#0D9E84] shadow-sm'
                          : 'bg-transparent border-transparent hover:bg-[#F8FBFA] hover:border-[#E0E8E5]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-bold ${
                            isActive
                              ? 'bg-[#0D9E84] text-white'
                              : 'bg-[#F0F5F3] text-[#6F8580] group-hover:bg-[#EAF7F3] group-hover:text-[#0B8D77]'
                          }`}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-bold leading-snug line-clamp-2 ${
                              isActive ? 'text-[#0B8D77]' : 'text-[#153D36] group-hover:text-[#0B8D77]'
                            }`}
                          >
                            {l.titleArabic || l.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-[#9AAEAA]">
                            <span>{l.type === 'audio' ? '🎧 صوتي' : '▶ مرئي'}</span>
                            <span className="h-1 w-1 rounded-full bg-[#DDEAE6]" />
                            <span>{Math.round((l.durationSeconds || 0) / 60)} دقيقة</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}