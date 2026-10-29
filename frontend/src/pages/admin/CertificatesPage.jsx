// CertificatesPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { adminApi, adminTreeApi } from '../../api/client.js';

const T = {
  title: 'الشهادات',
  subtitle: 'إصدار وإدارة شهادات إتمام الكتب والفنون.',
  issueCertificate: 'إصدار شهادة',
  searchPlaceholder: 'ابحث برقم الشهادة، اسم الطالب، أو الجهة...',
  tabs: { all: 'الكل', book: 'شهادات الكتب', art: 'شهادات الفنون' },
  stats: { total: 'إجمالي الشهادات', issued: 'صادرة', pending: 'قيد الانتظار', revoked: 'ملغاة' },
  table: {
    number: 'رقم الشهادة', student: 'الطالب', type: 'النوع', entity: 'الجهة',
    score: 'الدرجة', issuedAt: 'تاريخ الإصدار', status: 'الحالة', actions: 'إجراءات',
  },
  type: { book: 'شهادة كتاب', art: 'شهادة فن' },
  status: { issued: 'صادرة', pending: 'قيد الانتظار', revoked: 'ملغاة' },
  actions: { view: 'عرض', print: 'طباعة', revoke: 'إلغاء', issue: 'إصدار', restore: 'استعادة' },
  empty: { title: 'لا توجد شهادات', subtitle: 'لم يتم العثور على شهادات تطابق معايير البحث.', cta: 'إصدار أول شهادة' },
  modal: {
    issueTitle: 'إصدار شهادة جديدة', viewTitle: 'تفاصيل الشهادة', close: 'إغلاق', cancel: 'إلغاء', save: 'إصدار الشهادة',
    confirmRevokeTitle: 'تأكيد إلغاء الشهادة', confirmRevokeBody: 'سيتم إلغاء هذه الشهادة. هل أنت متأكد؟', confirmRevoke: 'تأكيد الإلغاء',
    fields: { student: 'الطالب', type: 'نوع الشهادة', art: 'الفن', book: 'الكتاب', score: 'الدرجة', examiner: 'الممتحن', notes: 'ملاحظات' },
    certificateNumber: 'رقم الشهادة', issuedDate: 'تاريخ الإصدار', printHint: 'اضغط طباعة لفتح نسخة قابلة للطباعة.',
  },
  grade: { excellent: 'ممتاز', veryGood: 'جيد جدًا', good: 'جيد', pass: 'مقبول' },
  percent: '%',
  loading: 'جارٍ التحميل...',
  error: 'تعذّر تحميل البيانات.',
};

export default function CertificatesPage() {
  const [tab, setTab] = useState('all');
  const [certificates, setCertificates] = useState([]);
  const [students, setStudents] = useState([]);
  const [arts, setArts] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const locale = 'ar-EG';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [certData, studentsData, treeData] = await Promise.all([
          adminApi.certificates(),
          adminApi.students(),
          adminTreeApi.tree()
        ]);
        
        if (!cancelled) {
          setCertificates(certData.certificates || []);
          setStudents(studentsData.students || []);
          
          // Flatten arts and books for the dropdowns
          const flatArts = [];
          const flatBooks = [];
          (treeData.tree || []).forEach(art => {
            flatArts.push({ id: art.id, name: art.name });
            (art.books || []).forEach(book => {
              flatBooks.push({ id: book.id, name: book.name, artId: art.id });
            });
          });
          setArts(flatArts);
          setBooks(flatBooks);
        }
      } catch (err) {
        if (!cancelled) setError(err.userMessage || T.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => ({
    total: certificates.length,
    issued: certificates.filter((c) => c.status === 'issued').length,
    pending: certificates.filter((c) => c.status === 'pending').length,
    revoked: certificates.filter((c) => c.status === 'revoked').length,
  }), [certificates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return certificates
      .filter((c) => tab === 'all' || c.type === tab)
      .filter((c) => {
        if (!q) return true;
        const studentName = c.studentId?.name || '';
        const entity = c.type === 'art' ? c.artId?.name : c.bookId?.name;
        return c.number.toLowerCase().includes(q) ||
          studentName.toLowerCase().includes(q) ||
          (entity || '').toLowerCase().includes(q);
      });
  }, [certificates, tab, query]);

  const issueCertificate = async (certData) => {
    try {
      const res = await adminApi.issueCertificate(certData);
      setCertificates(prev => [res.certificate, ...prev]);
      setModal(null);
    } catch (err) {
      alert(err.userMessage || 'Error issuing certificate');
    }
  };

  const revokeCertificate = async (id) => {
    try {
      await adminApi.updateCertificateStatus(id, 'revoked');
      setCertificates(prev => prev.map(c => c._id === id ? { ...c, status: 'revoked' } : c));
      setModal(null);
    } catch (err) {
      alert(err.userMessage || 'Error revoking certificate');
    }
  };

  const restoreCertificate = async (id) => {
    try {
      await adminApi.updateCertificateStatus(id, 'issued');
      setCertificates(prev => prev.map(c => c._id === id ? { ...c, status: 'issued' } : c));
    } catch (err) {
      alert(err.userMessage || 'Error restoring certificate');
    }
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
          <button onClick={() => setModal({ type: 'issue' })} className="inline-flex items-center gap-1.5 self-start rounded-lg bg-[#0D9E84] px-3.5 py-2 text-xs font-bold text-white shadow-[0_8px_20px_rgba(13,158,132,.22)] hover:bg-[#0A8873]">
            <AwardIcon /> {T.issueCertificate}
          </button>
        </div>

        {error && <div className="rounded-xl border border-[#F4C7C7] bg-[#FDF1F1] p-4 text-sm text-[#A03030]">{error}</div>}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<AwardIcon />} label={T.stats.total} value={stats.total} accent="teal" loading={loading} />
          <StatCard icon={<CheckCircleIcon />} label={T.stats.issued} value={stats.issued} accent="green" loading={loading} />
          <StatCard icon={<ClockIcon />} label={T.stats.pending} value={stats.pending} accent="amber" loading={loading} />
          <StatCard icon={<XCircleIcon />} label={T.stats.revoked} value={stats.revoked} accent="red" loading={loading} />
        </div>

        {/* Tabs + Search */}
        <div className="rounded-2xl border border-[#E0E8E5] bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-[#E0E8E5] bg-[#F8FBFA] p-1">
              <TabBtn active={tab === 'all'} onClick={() => setTab('all')}>{T.tabs.all}</TabBtn>
              <TabBtn active={tab === 'book'} onClick={() => setTab('book')}>{T.tabs.book}</TabBtn>
              <TabBtn active={tab === 'art'} onClick={() => setTab('art')}>{T.tabs.art}</TabBtn>
            </div>
            <div className="relative lg:w-80">
              <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-[#8BA09B]"><SearchIcon /></span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={T.searchPlaceholder}
                className="h-11 w-full rounded-xl border border-[#DDEAE6] bg-white ps-10 pe-3 text-sm text-[#153B35] outline-none placeholder:text-[#91A39F] focus:border-[#54BDA8]"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-[#E0E8E5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1024px] text-start">
              <thead className="bg-[#F8FBFA] text-[11px] font-bold uppercase tracking-wider text-[#9AAEAA]">
                <tr>
                  <th className="px-4 py-3 text-start">{T.table.number}</th>
                  <th className="px-4 py-3 text-start">{T.table.student}</th>
                  <th className="px-4 py-3 text-start">{T.table.type}</th>
                  <th className="px-4 py-3 text-start">{T.table.entity}</th>
                  <th className="px-4 py-3 text-start">{T.table.score}</th>
                  <th className="px-4 py-3 text-start">{T.table.issuedAt}</th>
                  <th className="px-4 py-3 text-start">{T.table.status}</th>
                  <th className="px-4 py-3 text-end">{T.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F5F3]">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i}><td colSpan={8} className="px-4 py-4"><div className="h-10 animate-pulse rounded bg-[#F8FBFA]" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#F3F9F7] text-[#8BA09B]"><AwardIcon large /></div>
                      <p className="mt-4 font-amiri text-lg font-bold text-[#153D36]">{T.empty.title}</p>
                      <p className="mt-1 text-xs text-[#7B908B]">{T.empty.subtitle}</p>
                      <button onClick={() => setModal({ type: 'issue' })} className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[#0D9E84] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0A8873]">
                        <AwardIcon /> {T.empty.cta}
                      </button>
                    </div>
                  </td></tr>
                ) : (
                  filtered.map((c) => {
                    const entity = c.type === 'art' ? c.artId?.name : c.bookId?.name;
                    return (
                      <tr key={c._id} className="text-sm transition hover:bg-[#F8FBFA]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`grid h-9 w-9 place-items-center rounded-xl ${c.type === 'art' ? 'bg-[#F0EBFA] text-[#6B46C1]' : 'bg-[#EAF7F3] text-[#0B8D77]'}`}>
                              {c.type === 'art' ? <ArtIcon /> : <BookIcon />}
                            </div>
                            <span className="font-mono text-xs font-bold text-[#153D36]">{c.number}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#EAF7F3] text-[11px] font-bold text-[#0B8D77]">
                              {c.studentId?.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-[#153D36]">{c.studentId?.name}</p>
                              <p className="mt-0.5 truncate text-[10px] text-[#9AAEAA]">{c.studentId?.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <TypeBadge type={c.type} label={T.type[c.type]} />
                        </td>
                        <td className="px-4 py-3 text-xs text-[#6F8580]">{entity}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#153D36]">{c.score}</span>
                            <span className="text-[10px] text-[#9AAEAA]">({gradeFor(c.score)})</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#6F8580]">{formatDate(c.issuedAt, locale)}</td>
                        <td className="px-4 py-3"><CertStatusBadge status={c.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <IconBtn title={T.actions.view} onClick={() => setModal({ type: 'view', payload: c })}><EyeIcon /></IconBtn>
                            <IconBtn title={T.actions.print}><PrintIcon /></IconBtn>
                            {c.status === 'issued' && (
                              <IconBtn title={T.actions.revoke} danger onClick={() => setModal({ type: 'revoke', payload: c })}><XCircleIcon /></IconBtn>
                            )}
                            {c.status === 'revoked' && (
                              <IconBtn title={T.actions.restore} onClick={() => restoreCertificate(c._id)}><RefreshIcon /></IconBtn>
                            )}
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

      {modal?.type === 'issue' && (
        <IssueModal t={T} students={students} arts={arts} books={books} onClose={() => setModal(null)} onSave={issueCertificate} />
      )}
      {modal?.type === 'view' && (
        <ViewCertModal t={T} cert={modal.payload} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'revoke' && (
        <ConfirmModal
          title={T.modal.confirmRevokeTitle}
          body={T.modal.confirmRevokeBody}
          cancelLabel={T.modal.cancel}
          confirmLabel={T.modal.confirmRevoke}
          onCancel={() => setModal(null)}
          onConfirm={() => revokeCertificate(modal.payload._id)}
        />
      )}
    </div>
  );
}

/* =========================================================
   Sub-components
   ========================================================= */

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${active ? 'bg-white text-[#0B8D77] shadow-sm' : 'text-[#617873] hover:text-[#0D9E84]'}`}>
      {children}
    </button>
  );
}

function StatCard({ icon, label, value, accent = 'teal', loading }) {
  const accents = {
    teal: 'bg-[#EAF7F3] text-[#0B8D77]',
    green: 'bg-[#E6F7EC] text-[#1F8A4C]',
    amber: 'bg-[#FFF4E0] text-[#A46E35]',
    red: 'bg-[#FEF2F2] text-[#B91C1C]',
  };
  return (
    <div className="rounded-2xl border border-[#E0E8E5] bg-white p-5">
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${accents[accent]}`}>{icon}</div>
      {loading ? (
        <div className="mt-4 h-9 w-16 animate-pulse rounded bg-[#F0F5F3]" />
      ) : (
        <p className="mt-4 font-amiri text-3xl font-bold text-[#123D36]">{typeof value === 'number' ? value.toLocaleString('ar-EG') : value}</p>
      )}
      <p className="mt-1 text-xs text-[#7B908B]">{label}</p>
    </div>
  );
}

function TypeBadge({ type, label }) {
  const styles = { book: 'bg-[#EAF7F3] text-[#0B8D77]', art: 'bg-[#F0EBFA] text-[#6B46C1]' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[type]}`}>
      {type === 'art' ? <ArtIcon small /> : <BookIcon small />}
      {label}
    </span>
  );
}

function CertStatusBadge({ status }) {
  const styles = { issued: 'bg-[#E6F7EC] text-[#1F8A4C]', pending: 'bg-[#FFF4E0] text-[#A46E35]', revoked: 'bg-[#FEF2F2] text-[#B91C1C]' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {T.status[status]}
    </span>
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

function IssueModal({ t, students, arts, books, onClose, onSave }) {
  const [type, setType] = useState('book');
  const [studentId, setStudentId] = useState('');
  const [artId, setArtId] = useState('');
  const [bookId, setBookId] = useState('');
  const [score, setScore] = useState('');
  const [examiner, setExaminer] = useState('الشيخ نور علي جامع');
  const [notes, setNotes] = useState('');

  const filteredBooks = useMemo(() => (artId ? books.filter((b) => b.artId === artId) : books), [artId, books]);

  const submit = (e) => {
    e.preventDefault();
    if (!studentId || !artId) return;
    if (type === 'book' && !bookId) return;
    onSave({
      studentId, type, artId,
      bookId: type === 'book' ? bookId : null,
      score: Number(score), examiner, notes,
    });
  };

  return (
    <ModalShell onClose={onClose} wide>
      <h3 className="font-amiri text-xl font-bold text-[#123D36]">{t.modal.issueTitle}</h3>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label={t.modal.fields.type}>
          <div className="grid grid-cols-2 gap-2">
            <RadioCard active={type === 'book'} onClick={() => setType('book')} icon={<BookIcon />} label={t.type.book} />
            <RadioCard active={type === 'art'} onClick={() => setType('art')} icon={<ArtIcon />} label={t.type.art} />
          </div>
        </Field>

        <Field label={t.modal.fields.student}>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={inputCls} required>
            <option value="">— اختر الطالب —</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.modal.fields.art}>
            <select value={artId} onChange={(e) => { setArtId(e.target.value); setBookId(''); }} className={inputCls} required>
              <option value="">— اختر الفن —</option>
              {arts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>

          {type === 'book' && (
            <Field label={t.modal.fields.book}>
              <select value={bookId} onChange={(e) => setBookId(e.target.value)} className={inputCls} required>
                <option value="">— اختر الكتاب —</option>
                {filteredBooks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
          )}

          <Field label={t.modal.fields.score}>
            <input type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} className={inputCls} required />
          </Field>
          <Field label={t.modal.fields.examiner}>
            <input value={examiner} onChange={(e) => setExaminer(e.target.value)} className={inputCls} />
          </Field>
        </div>

        <Field label={t.modal.fields.notes}>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputCls} h-auto py-2.5`} />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#DDEAE6] bg-white px-4 py-2 text-xs font-bold text-[#617873] hover:border-[#0D9E84]">{t.modal.cancel}</button>
          <button type="submit" className="rounded-lg bg-[#0D9E84] px-4 py-2 text-xs font-bold text-white hover:bg-[#0A8873]">{t.modal.save}</button>
        </div>
      </form>
    </ModalShell>
  );
}

function ViewCertModal({ t, cert, onClose }) {
  const locale = 'ar-EG';
  const student = cert.studentId;
  const entity = cert.type === 'art' ? cert.artId?.name : cert.bookId?.name;

  return (
    <ModalShell onClose={onClose} wide>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF7F3] text-[#0B8D77]"><AwardIcon large /></div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AAEAA]">{t.modal.viewTitle}</p>
            <h3 className="mt-0.5 font-amiri text-xl font-bold text-[#123D36]">{cert.number}</h3>
          </div>
        </div>
        <CertStatusBadge status={cert.status} />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border-2 border-[#D6A15C] bg-gradient-to-br from-[#FBFDFC] via-white to-[#FFF9EC] p-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#0D9E84] text-white"><AwardIcon large /></div>
        <p className="mt-3 font-amiri text-sm text-[#A46E35]">مكتبة الشيخ نور علي جامع</p>
        <h4 className="mt-1 font-amiri text-2xl font-bold text-[#123D36]">شهادة {cert.type === 'art' ? 'إتمام فن' : 'إتمام كتاب'}</h4>
        <p className="mt-3 text-xs text-[#6F8580]">تشهد المكتبة بأن الطالب</p>
        <p className="mt-2 font-amiri text-2xl font-bold text-[#0D9E84]">{student?.name}</p>
        <p className="mt-3 text-xs text-[#6F8580]">قد أتم بنجاح</p>
        <p className="mt-2 font-amiri text-xl font-bold text-[#123D36]">{entity}</p>
        <p className="mt-3 text-xs text-[#6F8580]">بتقدير</p>
        <p className="mt-1 font-amiri text-lg font-bold text-[#A46E35]">{gradeFor(cert.score)} ({cert.score}{t.percent})</p>

        <div className="mt-6 flex items-center justify-between border-t border-[#E0E8E5] pt-4 text-[10px] text-[#7B908B]">
          <span>{t.modal.issuedDate}: {formatDate(cert.issuedAt, locale)}</span>
          <span>{t.modal.fields.examiner}: {cert.examiner}</span>
          <span className="font-mono">{cert.number}</span>
        </div>
      </div>

      <div className="mt-6 flex justify-between gap-2">
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-[#DDEAE6] bg-white px-4 py-2 text-xs font-bold text-[#617873] hover:border-[#0D9E84]">
          <PrintIcon /> {t.actions.print}
        </button>
        <button onClick={onClose} className="rounded-lg bg-[#0D9E84] px-4 py-2 text-xs font-bold text-white hover:bg-[#0A8873]">{t.modal.close}</button>
      </div>
    </ModalShell>
  );
}

function ConfirmModal({ title, body, onCancel, onConfirm, confirmLabel, cancelLabel }) {
  return (
    <ModalShell onClose={onCancel}>
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FEF2F2] text-[#B91C1C]"><XCircleIcon large /></div>
        <div className="flex-1">
          <h3 className="font-amiri text-xl font-bold text-[#123D36]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#6F8580]">{body}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg border border-[#DDEAE6] bg-white px-4 py-2 text-xs font-bold text-[#617873] hover:border-[#0D9E84]">{cancelLabel}</button>
        <button onClick={onConfirm} className="rounded-lg bg-[#B91C1C] px-4 py-2 text-xs font-bold text-white hover:bg-[#991B1B]">{confirmLabel}</button>
      </div>
    </ModalShell>
  );
}

function ModalShell({ children, onClose, wide }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[92vh] overflow-y-auto rounded-2xl border border-[#E0E8E5] bg-white p-6 shadow-[0_30px_80px_rgba(6,58,53,.2)]`}>
        {children}
      </div>
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

function RadioCard({ active, onClick, icon, label }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-bold transition ${active ? 'border-[#0D9E84] bg-[#EAF7F3] text-[#0B8D77]' : 'border-[#DDEAE6] bg-white text-[#617873] hover:border-[#0D9E84]'}`}>
      {icon}
      {label}
    </button>
  );
}

function gradeFor(score) {
  if (score >= 90) return T.grade.excellent;
  if (score >= 80) return T.grade.veryGood;
  if (score >= 70) return T.grade.good;
  return T.grade.pass;
}

function formatDate(iso, locale) {
  return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

const inputCls = 'h-11 w-full rounded-xl border border-[#DDEAE6] bg-white px-3 text-sm text-[#153B35] outline-none focus:border-[#54BDA8]';

/* Icons */
function SearchIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" strokeLinecap="round" /></svg> }
function AwardIcon({ large = false }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={large ? 'h-6 w-6' : 'h-5 w-5'}><circle cx="12" cy="9" r="6" /><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8" strokeLinejoin="round" /></svg> }
function ArtIcon({ small = false }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={small ? 'h-3 w-3' : 'h-4 w-4'}><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-.8 2-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.8.6-1.5 1.5-1.5h1.5A4 4 0 0 0 20 12.5C20 7.3 16.4 3 12 3Z" strokeLinejoin="round" /></svg> }
function BookIcon({ small = false }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={small ? 'h-3 w-3' : 'h-4 w-4'}><path d="M2 4h6a4 4 0 0 1 4 4v12a4 4 0 0 0-4-4H2V4Z" strokeLinejoin="round" /><path d="M22 4h-6a4 4 0 0 0-4 4v12a4 4 0 0 1 4-4h6V4Z" strokeLinejoin="round" /></svg> }
function CheckCircleIcon({ large = false }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={large ? 'h-6 w-6' : 'h-5 w-5'}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function XCircleIcon({ large = false }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={large ? 'h-6 w-6' : 'h-5 w-5'}><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" strokeLinecap="round" /></svg> }
function ClockIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function EyeIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg> }
function PrintIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M6 9V4h12v5M6 18H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2" strokeLinejoin="round" /><rect x="6" y="14" width="12" height="7" rx="1" /></svg> }
function RefreshIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 12a8 8 0 0 1 14-5.3L20 8M4 16l2-1.3A8 8 0 0 0 20 12" strokeLinecap="round" strokeLinejoin="round" /></svg> }