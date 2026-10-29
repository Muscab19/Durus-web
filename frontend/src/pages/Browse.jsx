import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { browseApi } from '../api/client.js';

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const artId = searchParams.get('artId');
  const bookId = searchParams.get('bookId');

  // Determine current level: 1 = arts, 2 = books, 3 = lectures
  const level = bookId ? 3 : artId ? 2 : 1;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    (async () => {
      try {
        const params = {};
        if (bookId) params.bookId = bookId;
        else if (artId) params.artId = artId;

        const res = await browseApi.get(params);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err.userMessage || 'تعذّر تحميل المكتبة');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [artId, bookId]);

  const goToLevel = (newArtId = null, newBookId = null) => {
    const params = {};
    if (newBookId) params.bookId = newBookId;
    else if (newArtId) params.artId = newArtId;
    setSearchParams(params);
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7FAF8] text-[#102A27] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-[#DCEBE6] py-8 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-bold mb-4 flex-wrap">
            <button
              onClick={() => goToLevel()}
              className={`hover:text-[#0D9E84] ${level === 1 ? 'text-[#0D9E84]' : 'text-[#7B908B]'}`}
            >
              المكتبة
            </button>
            {level >= 2 && data?.art && (
              <>
                <span className="text-[#C8DCD7]">/</span>
                <button
                  onClick={() => goToLevel(data.art.id)}
                  className={`hover:text-[#0D9E84] ${level === 2 ? 'text-[#0D9E84]' : 'text-[#7B908B]'}`}
                >
                  {data.art.name}
                </button>
              </>
            )}
            {level === 3 && data?.book && (
              <>
                <span className="text-[#C8DCD7]">/</span>
                <span className="text-[#0D9E84]">{data.book.name}</span>
              </>
            )}
          </nav>

          <h1 className="font-amiri text-2xl sm:text-3xl font-bold text-[#073A35]">
            {level === 1 && 'تصفّح المكتبة'}
            {level === 2 && data?.art?.name}
            {level === 3 && data?.book?.name}
          </h1>
          <p className="mt-1 text-sm text-[#5F7772]">
            {level === 1 && 'اختر العلم الذي تريد دراسته'}
            {level === 2 && `${data?.books?.length || 0} كتب في هذا الفن`}
            {level === 3 && `${data?.lectures?.length || 0} درسًا في هذا الكتاب`}
          </p>

          {/* Back button */}
          {level > 1 && (
            <button
              onClick={() => {
                if (level === 3 && data?.art) goToLevel(data.art.id);
                else goToLevel();
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#0B806D] hover:underline"
            >
              ← العودة
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 sm:px-8 mt-8">
        {error && (
          <div className="rounded-2xl border border-[#F4C7C7] bg-[#FDF1F1] p-5 text-sm text-[#A03030]">
            {error}
          </div>
        )}

        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-white border border-[#DCEBE6]" />
            ))}
          </div>
        )}

        {/* ============ LEVEL 1: ARTS ============ */}
        {!loading && level === 1 && (
          <>
            {data?.arts?.length === 0 ? (
              <EmptyState message="لا توجد فنون بعد" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data?.arts?.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => goToLevel(a.id)}
                    className="group rounded-2xl border border-[#E0E8E5] bg-white p-6 text-right hover:-translate-y-1 hover:border-[#0D9E84] hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF7F3] text-[#0B8D77] font-amiri text-lg font-bold">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <span className="grid h-9 w-9 place-items-center rounded-full border border-[#D9E8E4] text-[#55716B] group-hover:bg-[#0D9E84] group-hover:text-white transition">
                        ←
                      </span>
                    </div>
                    <h3 className="font-amiri text-xl font-bold text-[#153D36] group-hover:text-[#0B8D77]">
                      {a.name}
                    </h3>
                    {a.nameEn && a.nameEn !== a.name && (
                      <p dir="ltr" className="mt-1 text-[10px] text-[#91A39F] text-right">
                        {a.nameEn}
                      </p>
                    )}
                    <div className="mt-4 flex gap-2 border-t border-[#F0F5F3] pt-3 text-[11px] text-[#6F8580]">
                      <span className="rounded-full bg-[#F2F8F6] px-2.5 py-1">
                        {a.bookCount.toLocaleString('ar-EG')} كتب
                      </span>
                      <span className="rounded-full bg-[#F2F8F6] px-2.5 py-1">
                        {a.lectureCount.toLocaleString('ar-EG')} درسًا
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ============ LEVEL 2: BOOKS ============ */}
        {!loading && level === 2 && (
          <>
            {data?.books?.length === 0 ? (
              <EmptyState message="لا توجد كتب في هذا الفن بعد" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data?.books?.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => goToLevel(null, b.id)}
                    className="group rounded-2xl border border-[#E0E8E5] bg-white p-6 text-right hover:-translate-y-1 hover:border-[#0D9E84] hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF7F3] text-[#0B8D77]">
                        <BookIcon />
                      </div>
                      <span className="grid h-9 w-9 place-items-center rounded-full border border-[#D9E8E4] text-[#55716B] group-hover:bg-[#0D9E84] group-hover:text-white transition">
                        ←
                      </span>
                    </div>
                    <h3 className="font-amiri text-xl font-bold text-[#153D36] group-hover:text-[#0B8D77]">
                      {b.name}
                    </h3>
                    {b.author && (
                      <p className="mt-1 text-xs text-[#7B908B]">{b.author}</p>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-[#F0F5F3] pt-3">
                      <span className="rounded-full bg-[#F2F8F6] px-2.5 py-1 text-[11px] text-[#6F8580]">
                        {b.lectureCount.toLocaleString('ar-EG')} درسًا
                      </span>
                      <span className="text-[10px] font-bold text-[#A46E35]">
                        {levelLabel(b.level)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ============ LEVEL 3: LECTURES ============ */}
        {!loading && level === 3 && (
          <>
            {data?.lectures?.length === 0 ? (
              <EmptyState message="لا توجد دروس في هذا الكتاب بعد" />
            ) : (
              <div className="space-y-3">
                {data?.lectures?.map((l, i) => (
                  <Link
                    key={l.id}
                    to={`/lectures/${l.id}`}
                    className="group flex items-center gap-4 rounded-2xl border border-[#E0E8E5] bg-white p-4 hover:border-[#0D9E84] hover:shadow-md transition"
                  >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#EAF7F3] text-[#0B8D77] font-amiri font-bold">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-amiri text-base font-bold text-[#153D36] group-hover:text-[#0B8D77]">
                        {l.titleArabic || l.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#7B908B]">
                        {l.type === 'audio' ? 'درس صوتي' : 'درس مرئي'} ·{' '}
                        {Math.round((l.durationSeconds || 0) / 60).toLocaleString('ar-EG')} دقيقة
                      </p>
                    </div>
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${l.type === 'audio' ? 'bg-[#EAF7F3] text-[#0B8D77]' : 'bg-[#073A35] text-white'}`}>
                      {l.type === 'audio' ? '🎧' : '▶'}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/* ---------- Helpers ---------- */

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#BFD9D2] bg-white px-8 py-16 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#EAF7F3] text-2xl">
        📚
      </div>
      <p className="mt-4 font-amiri text-lg font-bold text-[#123D36]">{message}</p>
      <p className="mt-1.5 text-sm text-[#70847F]">
        بمجرّد أن يُضاف المحتوى، سيظهر هنا.
      </p>
    </div>
  );
}

function levelLabel(level) {
  const labels = { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' };
  return labels[level] || level;
}

/* ---------- Icons ---------- */

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M2 4h6a4 4 0 0 1 4 4v12a4 4 0 0 0-4-4H2V4Z" strokeLinejoin="round" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v12a4 4 0 0 1 4-4h6V4Z" strokeLinejoin="round" />
    </svg>
  );
}