import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { progressApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function MyProgress() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await progressApi.me();
        setSummary(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-20 text-center">جارٍ التحميل...</div>;

  const hours = Math.round((summary?.totals?.uniqueSeconds || 0) / 360) / 10;

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7FAF8] text-[#102A27] py-12">
      <div className="mx-auto max-w-5xl px-5">
        <Link to="/" className="text-sm font-bold text-[#0B806D] hover:underline mb-6 inline-block">← الرئيسية</Link>
        
        <h1 className="font-amiri text-3xl font-bold text-[#073A35] mb-8">سجل التعلّم</h1>

        {/* Top Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          <div className="rounded-2xl bg-gradient-to-br from-[#0D9E84] to-[#087A4D] p-6 text-white shadow-lg">
            <p className="text-white/80 text-xs font-bold">ساعات الاستماع</p>
            <p className="text-4xl font-amiri font-bold mt-2">{hours}</p>
          </div>
          <div className="rounded-2xl bg-white border border-[#E0E8E5] p-6 shadow-sm">
            <p className="text-[#7B908B] text-xs font-bold">دروس بدأتها</p>
            <p className="text-4xl font-amiri font-bold text-[#123D36] mt-2">{summary?.totals?.lecturesStarted || 0}</p>
          </div>
          <div className="rounded-2xl bg-white border border-[#E0E8E5] p-6 shadow-sm">
            <p className="text-[#7B908B] text-xs font-bold">دروس أكملتها</p>
            <p className="text-4xl font-amiri font-bold text-[#0B806D] mt-2">{summary?.totals?.lecturesCompleted || 0}</p>
          </div>
        </div>

        {/* Breakdown by Parent */}
        <h2 className="font-amiri text-2xl font-bold text-[#123D36] mb-4">تقدّمك حسب التخصص</h2>
        <div className="bg-white rounded-2xl border border-[#E0E8E5] overflow-hidden">
          {summary?.byParent?.length === 0 ? (
            <p className="p-8 text-center text-[#7B908B]">لم تبدأ أي درس بعد.</p>
          ) : (
            summary?.byParent?.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-5 border-b border-[#F0F5F3] last:border-0 hover:bg-[#F8FBFA]">
                <div>
                  <p className="font-bold text-[#153D36]">{p.parent}</p>
                  <p className="text-xs text-[#7B908B] mt-1">{p.lecturesCompleted} مكتمل · {Math.round(p.uniqueSeconds/360)/10} ساعة</p>
                </div>
                <Link to={`/browse?parent=${encodeURIComponent(p.parent)}`} className="text-xs font-bold text-[#0D9E84] hover:underline">
                  تصفح
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}