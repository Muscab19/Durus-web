// Lectures.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminTreeApi, lecturesApi } from '../../api/client';

/* =========================================================
   Translations (unchanged)
   ========================================================= */

const T = {
  title: 'إدارة الدروس والمنهج',
  subtitle: 'أنشئ الفنون والكتب، وتحكم في كل ما رُفع إلى المنصة.',
  addArt: 'إضافة فن',
  addBook: 'إضافة كتاب',
  addLecture: 'رفع درس',
  searchPlaceholder: 'ابحث في الفنون، الكتب، أو الدروس...',
  expandAll: 'توسيع الكل',
  collapseAll: 'طي الكل',
  table: {
    name: 'الاسم',
    author: 'المؤلف',
    level: 'المستوى',
    lectures: 'الدروس',
    books: 'الكتب',
    status: 'الحالة',
    type: 'النوع',
    duration: 'المدة',
    actions: 'إجراءات',
  },
  level: { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' },
  status: { published: 'منشور', draft: 'مسودة', archived: 'مؤرشف' },
  type: { audio: 'صوتي', video: 'مرئي' },
  actions: { view: 'عرض', edit: 'تحرير', delete: 'حذف', addBook: 'إضافة كتاب', addLecture: 'إضافة درس' },
  empty: { title: 'لا توجد نتائج', subtitle: 'لم يتم العثور على أي عنصر يطابق بحثك.' },
  confirm: {
    art: { title: 'تأكيد حذف الفن', body: 'سيتم حذف الفن وجميع الكتب والدروس التابعة له. لا يمكن التراجع.' },
    book: { title: 'تأكيد حذف الكتاب', body: 'سيتم حذف الكتاب وجميع دروسه. لا يمكن التراجع.' },
    lecture: { title: 'تأكيد حذف الدرس', body: 'سيتم حذف الدرس نهائيًا. لا يمكن التراجع.' },
    cancel: 'إلغاء',
    confirm: 'تأكيد الحذف',
  },
  modal: {
    addArtTitle: 'إضافة فن جديد',
    editArtTitle: 'تحرير الفن',
    addBookTitle: 'إضافة كتاب جديد',
    editBookTitle: 'تحرير الكتاب',
    addLectureTitle: 'إضافة درس',
    editLectureTitle: 'تحرير الدرس',
    close: 'إغلاق',
    save: 'حفظ',
    fields: {
      artName: 'اسم الفن',
      bookName: 'اسم الكتاب',
      author: 'المؤلف',
      level: 'المستوى',
      status: 'الحالة',
      lectureTitle: 'عنوان الدرس',
      lectureType: 'النوع',
      lectureDuration: 'المدة (بالدقائق)',
    },
  },
  minutes: 'د',
  totals: { arts: 'فنون', books: 'كتب', lectures: 'دروس' },
  errors: {
    load: 'تعذّر تحميل البيانات. حاول مرة أخرى.',
    save: 'تعذّر حفظ التغييرات.',
    delete: 'تعذّر الحذف.',
  },
};

/* =========================================================
   Page
   ========================================================= */

export default function Lectures() {
  const [tree, setTree] = useState([]);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(new Set());
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // ---------- Load tree ----------
  const reload = useCallback(async () => {
    setError('');
    try {
      const data = await adminTreeApi.tree();
      const list = data.tree || [];
      setTree(list);
      setExpanded(new Set(list.map((a) => a.id)));
    } catch (err) {
      setError(err.userMessage || T.errors.load);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const totals = useMemo(() => {
    const arts = tree.length;
    const books = tree.reduce((s, a) => s + a.books.length, 0);
    const lectures = tree.reduce((s, a) => s + a.books.reduce((ss, b) => ss + b.lectures.length, 0), 0);
    return { arts, books, lectures };
  }, [tree]);

  const filteredTree = useMemo(() => {
    if (!query.trim()) return tree;
    const q = query.trim().toLowerCase();
    return tree
      .map((a) => {
        const artMatches = a.name.toLowerCase().includes(q);
        const books = a.books
          .map((b) => {
            const bookMatches =
              b.name.toLowerCase().includes(q) ||
              (b.author || '').toLowerCase().includes(q);
            const lectures = b.lectures.filter((l) =>
              l.title.toLowerCase().includes(q)
            );
            if (bookMatches || lectures.length > 0)
              return { ...b, lectures: bookMatches ? b.lectures : lectures };
            return null;
          })
          .filter(Boolean);
        if (artMatches || books.length > 0)
          return { ...a, books: artMatches ? a.books : books };
        return null;
      })
      .filter(Boolean);
  }, [tree, query]);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const expandAll = () => setExpanded(new Set(tree.map((a) => a.id)));
  const collapseAll = () => setExpanded(new Set());

  /* =========================================================
     Mutations
     ========================================================= */

  // ---------- Arts ----------
  const addArt = async (art) => {
    setBusy(true); setError('');
    try {
      await adminTreeApi.createArt({ name: art.name, status: art.status });
      await reload();
      setModal(null);
    } catch (err) {
      setError(err.userMessage || T.errors.save);
    } finally {
      setBusy(false);
    }
  };

  const updateArt = async (updated) => {
    setBusy(true); setError('');
    try {
      await adminTreeApi.updateArt(updated.id, {
        name: updated.name,
        status: updated.status,
      });
      await reload();
      setModal(null);
    } catch (err) {
      setError(err.userMessage || T.errors.save);
    } finally {
      setBusy(false);
    }
  };

  const deleteArt = async (id) => {
    setBusy(true); setError('');
    try {
      await adminTreeApi.deleteArt(id);
      await reload();
      setModal(null);
    } catch (err) {
      setError(err.userMessage || T.errors.delete);
    } finally {
      setBusy(false);
    }
  };

  // ---------- Books ----------
  const addBook = async (artId, book) => {
    setBusy(true); setError('');
    try {
      await adminTreeApi.createBook(artId, {
        name: book.name,
        author: book.author,
        level: book.level,
        status: book.status,
      });
      await reload();
      setModal(null);
    } catch (err) {
      setError(err.userMessage || T.errors.save);
    } finally {
      setBusy(false);
    }
  };

  const updateBook = async (artId, updated) => {
    setBusy(true); setError('');
    try {
      await adminTreeApi.updateBook(updated.id, {
        name: updated.name,
        author: updated.author,
        level: updated.level,
        status: updated.status,
      });
      await reload();
      setModal(null);
    } catch (err) {
      setError(err.userMessage || T.errors.save);
    } finally {
      setBusy(false);
    }
  };

  const deleteBook = async (artId, bookId) => {
    setBusy(true); setError('');
    try {
      await adminTreeApi.deleteBook(bookId);
      await reload();
      setModal(null);
    } catch (err) {
      setError(err.userMessage || T.errors.delete);
    } finally {
      setBusy(false);
    }
  };

  // ---------- Lectures ----------
  const addLecture = async (artId, bookId, lecture) => {
    setBusy(true); setError('');
    try {
      const art = tree.find((a) => a.id === artId);
      const book = art?.books.find((b) => b.id === bookId);

      await lecturesApi.create({
        title: lecture.title,
        titleArabic: lecture.title,
        type: lecture.type,
        durationSeconds: Number(lecture.duration) * 60,
        isPublished: lecture.status === 'published',
        artRef: artId,
        bookRef: bookId,
        // Placeholders — the backend overwrites them from Book.ref
        parent: art?.nameEn || art?.name || '',
        parentArabic: art?.name || '',
        course: book?.nameEn || book?.name || '',
        courseArabic: book?.name || '',
        book: book?.nameEn || book?.name || '',
        bookArabic: book?.name || '',
        // Placeholder media — the real file gets attached later via
        // the upload form. This keeps the record complete for editing.
        mediaKey: 'pending/' + Date.now(),
        mediaUrl: 'https://example.com/pending.mp3',
      });
      await reload();
      setModal(null);
    } catch (err) {
      setError(err.userMessage || T.errors.save);
    } finally {
      setBusy(false);
    }
  };

  const updateLecture = async (artId, bookId, updated) => {
    setBusy(true); setError('');
    try {
      await adminTreeApi.patchLecture(updated.id, {
        title: updated.title,
        titleArabic: updated.title,
        type: updated.type,
        durationSeconds: Number(updated.duration) * 60,
        status: updated.status,
      });
      await reload();
      setModal(null);
    } catch (err) {
      setError(err.userMessage || T.errors.save);
    } finally {
      setBusy(false);
    }
  };

  const deleteLecture = async (artId, bookId, lectureId) => {
    setBusy(true); setError('');
    try {
      await lecturesApi.remove(lectureId);
      await reload();
      setModal(null);
    } catch (err) {
      setError(err.userMessage || T.errors.delete);
    } finally {
      setBusy(false);
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
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setModal({ type: 'addArt' })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0D9E84] px-3.5 py-2 text-xs font-bold text-white shadow-[0_8px_20px_rgba(13,158,132,.22)] hover:bg-[#0A8873]"
            >
              <PlusIcon /> {T.addArt}
            </button>
            <Link
              to="/dashboard/lectures/new"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DDEAE6] bg-white px-3.5 py-2 text-xs font-bold text-[#617873] hover:border-[#0D9E84] hover:text-[#0D9E84]"
            >
              <UploadIcon /> {T.addLecture}
            </Link>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-2xl border border-[#F4C7C7] bg-[#FDF1F1] px-5 py-4 text-sm text-[#A03030]">
            {error}
          </div>
        )}

        {/* Stat strip */}
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniStat icon={<ArtIcon />} label={T.totals.arts} value={totals.arts} />
          <MiniStat icon={<BookIcon />} label={T.totals.books} value={totals.books} />
          <MiniStat icon={<PlayCircleIcon />} label={T.totals.lectures} value={totals.lectures} />
        </div>

        {/* Search & tools */}
        <div className="rounded-2xl border border-[#E0E8E5] bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-[#8BA09B]">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={T.searchPlaceholder}
                className="h-11 w-full rounded-xl border border-[#DDEAE6] bg-white ps-10 pe-3 text-sm text-[#153B35] outline-none placeholder:text-[#91A39F] focus:border-[#54BDA8]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="h-11 rounded-xl border border-[#DDEAE6] bg-white px-3.5 text-xs font-bold text-[#617873] hover:border-[#0D9E84] hover:text-[#0D9E84]"
              >
                {T.expandAll}
              </button>
              <button
                onClick={collapseAll}
                className="h-11 rounded-xl border border-[#DDEAE6] bg-white px-3.5 text-xs font-bold text-[#617873] hover:border-[#0D9E84] hover:text-[#0D9E84]"
              >
                {T.collapseAll}
              </button>
            </div>
          </div>
        </div>

        {/* Tree */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-2xl border border-[#E0E8E5] bg-white"
                />
              ))}
            </div>
          ) : filteredTree.length === 0 ? (
            <div className="rounded-2xl border border-[#E0E8E5] bg-white p-16 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#F3F9F7] text-[#8BA09B]">
                <ArtIcon large />
              </div>
              <p className="mt-4 font-amiri text-lg font-bold text-[#153D36]">{T.empty.title}</p>
              <p className="mt-1 text-xs text-[#7B908B]">{T.empty.subtitle}</p>
            </div>
          ) : (
            filteredTree.map((art) => (
              <ArtBlock
                key={art.id}
                art={art}
                expanded={expanded.has(art.id)}
                onToggle={() => toggleExpand(art.id)}
                onAddBook={() => setModal({ type: 'addBook', artId: art.id })}
                onEditArt={() => setModal({ type: 'editArt', art })}
                onDeleteArt={() => setModal({ type: 'deleteArt', art })}
                onAddLecture={(bookId) => setModal({ type: 'addLecture', artId: art.id, bookId })}
                onEditBook={(book) => setModal({ type: 'editBook', artId: art.id, book })}
                onDeleteBook={(book) => setModal({ type: 'deleteBook', artId: art.id, book })}
                onEditLecture={(bookId, lecture) => setModal({ type: 'editLecture', artId: art.id, bookId, lecture })}
                onDeleteLecture={(bookId, lecture) => setModal({ type: 'deleteLecture', artId: art.id, bookId, lecture })}
              />
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'addArt' && (
        <ArtModal t={T} onClose={() => setModal(null)} onSave={(a) => addArt(a)} />
      )}
      {modal?.type === 'editArt' && (
        <ArtModal t={T} initial={modal.art} onClose={() => setModal(null)} onSave={(a) => updateArt({ ...modal.art, ...a })} />
      )}
      {modal?.type === 'addBook' && (
        <BookModal t={T} onClose={() => setModal(null)} onSave={(b) => addBook(modal.artId, b)} />
      )}
      {modal?.type === 'editBook' && (
        <BookModal t={T} initial={modal.book} onClose={() => setModal(null)} onSave={(b) => updateBook(modal.artId, { ...modal.book, ...b })} />
      )}
      {modal?.type === 'addLecture' && (
        <LectureModal t={T} onClose={() => setModal(null)} onSave={(l) => addLecture(modal.artId, modal.bookId, l)} />
      )}
      {modal?.type === 'editLecture' && (
        <LectureModal t={T} initial={modal.lecture} onClose={() => setModal(null)} onSave={(l) => updateLecture(modal.artId, modal.bookId, { ...modal.lecture, ...l, duration: Number(l.duration) })} />
      )}
      {modal?.type === 'deleteArt' && (
        <ConfirmModal
          title={T.confirm.art.title}
          body={T.confirm.art.body}
          cancelLabel={T.confirm.cancel}
          confirmLabel={T.confirm.confirm}
          onCancel={() => setModal(null)}
          onConfirm={() => deleteArt(modal.art.id)}
        />
      )}
      {modal?.type === 'deleteBook' && (
        <ConfirmModal
          title={T.confirm.book.title}
          body={T.confirm.book.body}
          cancelLabel={T.confirm.cancel}
          confirmLabel={T.confirm.confirm}
          onCancel={() => setModal(null)}
          onConfirm={() => deleteBook(modal.artId, modal.book.id)}
        />
      )}
      {modal?.type === 'deleteLecture' && (
        <ConfirmModal
          title={T.confirm.lecture.title}
          body={T.confirm.lecture.body}
          cancelLabel={T.confirm.cancel}
          confirmLabel={T.confirm.confirm}
          onCancel={() => setModal(null)}
          onConfirm={() => deleteLecture(modal.artId, modal.bookId, modal.lecture.id)}
        />
      )}
    </div>
  );
}

/* =========================================================
   Blocks (unchanged)
   ========================================================= */

function ArtBlock({ art, expanded, onToggle, onAddBook, onEditArt, onDeleteArt, onAddLecture, onEditBook, onDeleteBook, onEditLecture, onDeleteLecture }) {
  const totalLectures = art.books.reduce((s, b) => s + b.lectures.length, 0);
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E0E8E5] bg-white">
      <div className="flex items-center gap-3 bg-[#F8FBFA] px-4 py-3.5">
        <button onClick={onToggle} className="grid h-8 w-8 place-items-center rounded-lg border border-[#DDEAE6] bg-white text-[#0B8D77] hover:border-[#0D9E84]">
          <span className={`transition ${expanded ? 'rotate-90' : ''}`}><ChevronRight /></span>
        </button>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF7F3] text-[#0B8D77]"><ArtIcon /></div>
        <div className="min-w-0 flex-1">
          <p className="font-amiri text-lg font-bold text-[#123D36]">{art.name}</p>
          <p className="mt-0.5 text-[11px] text-[#7B908B]">
            {art.books.length.toLocaleString('ar-EG')} كتب · {totalLectures.toLocaleString('ar-EG')} درسًا
          </p>
        </div>
        <StatusBadge status={art.status} />
        <div className="hidden items-center gap-1 sm:flex">
          <IconBtn title={T.actions.addBook} onClick={onAddBook}><PlusIcon /></IconBtn>
          <IconBtn title={T.actions.edit} onClick={onEditArt}><EditIcon /></IconBtn>
          <IconBtn title={T.actions.delete} danger onClick={onDeleteArt}><TrashIcon /></IconBtn>
        </div>
      </div>

      {expanded && (
        <div className="divide-y divide-[#F0F5F3]">
          {art.books.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-[#7B908B]">لا توجد كتب في هذا الفن بعد.</p>
              <button onClick={onAddBook} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0D9E84] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0A8873]">
                <PlusIcon /> {T.actions.addBook}
              </button>
            </div>
          ) : (
            art.books.map((book) => (
              <BookBlock
                key={book.id}
                book={book}
                onAddLecture={() => onAddLecture(book.id)}
                onEdit={() => onEditBook(book)}
                onDelete={() => onDeleteBook(book)}
                onEditLecture={(lecture) => onEditLecture(book.id, lecture)}
                onDeleteLecture={(lecture) => onDeleteLecture(book.id, lecture)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function BookBlock({ book, onAddLecture, onEdit, onDelete, onEditLecture, onDeleteLecture }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 ps-16">
        <button onClick={() => setOpen(!open)} className="grid h-7 w-7 place-items-center rounded-lg border border-[#DDEAE6] bg-white text-[#0B8D77] hover:border-[#0D9E84]">
          <span className={`transition ${open ? 'rotate-90' : ''}`}><ChevronRight /></span>
        </button>
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#F0F5F3] text-[#617873]"><BookIcon /></div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[#153D36]">{book.name}</p>
          <p className="mt-0.5 text-[11px] text-[#7B908B]">
            {book.author} · {T.level[book.level]} · {book.lectures.length.toLocaleString('ar-EG')} درسًا
          </p>
        </div>
        <StatusBadge status={book.status} />
        <div className="flex items-center gap-1">
          <IconBtn title={T.actions.addLecture} onClick={onAddLecture}><PlusIcon /></IconBtn>
          <IconBtn title={T.actions.edit} onClick={onEdit}><EditIcon /></IconBtn>
          <IconBtn title={T.actions.delete} danger onClick={onDelete}><TrashIcon /></IconBtn>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#F0F5F3] bg-[#FBFDFC]">
          {book.lectures.length === 0 ? (
            <p className="px-16 py-4 text-[11px] text-[#7B908B]">لا توجد دروس في هذا الكتاب بعد.</p>
          ) : (
            <ul className="divide-y divide-[#F0F5F3]">
              {book.lectures.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-4 py-2.5 ps-24">
                  <div className={`grid h-8 w-8 place-items-center rounded-lg ${l.type === 'audio' ? 'bg-[#EAF7F3] text-[#0B8D77]' : 'bg-[#FFF4E0] text-[#A46E35]'}`}>
                    {l.type === 'audio' ? <HeadphonesIcon small /> : <PlayCircleIcon small />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#153D36]">{l.title}</p>
                    <p className="mt-0.5 text-[10px] text-[#9AAEAA]">
                      {T.type[l.type]} · {Math.round(l.duration / 60).toLocaleString('ar-EG')} {T.minutes}
                    </p>
                  </div>
                  <StatusBadge status={l.status} />
                  <div className="flex items-center gap-1">
                    <IconBtn title={T.actions.edit} onClick={() => onEditLecture(l)}><EditIcon /></IconBtn>
                    <IconBtn title={T.actions.delete} danger onClick={() => onDeleteLecture(l)}><TrashIcon /></IconBtn>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   Modals (unchanged)
   ========================================================= */

function ArtModal({ t, initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || '');
  const [status, setStatus] = useState(initial?.status || 'published');
  return (
    <ModalShell onClose={onClose}>
      <h3 className="font-amiri text-xl font-bold text-[#123D36]">{initial ? t.modal.editArtTitle : t.modal.addArtTitle}</h3>
      <form onSubmit={(e) => { e.preventDefault(); onSave({ name, status }); }} className="mt-5 space-y-4">
        <Field label={t.modal.fields.artName}>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
        </Field>
        <Field label={t.modal.fields.status}>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="published">{t.status.published}</option>
            <option value="draft">{t.status.draft}</option>
            <option value="archived">{t.status.archived}</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#DDEAE6] bg-white px-4 py-2 text-xs font-bold text-[#617873] hover:border-[#0D9E84]">{t.modal.close}</button>
          <button type="submit" className="rounded-lg bg-[#0D9E84] px-4 py-2 text-xs font-bold text-white hover:bg-[#0A8873]">{t.modal.save}</button>
        </div>
      </form>
    </ModalShell>
  );
}

function BookModal({ t, initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || '');
  const [author, setAuthor] = useState(initial?.author || '');
  const [level, setLevel] = useState(initial?.level || 'beginner');
  const [status, setStatus] = useState(initial?.status || 'draft');
  return (
    <ModalShell onClose={onClose}>
      <h3 className="font-amiri text-xl font-bold text-[#123D36]">{initial ? t.modal.editBookTitle : t.modal.addBookTitle}</h3>
      <form onSubmit={(e) => { e.preventDefault(); onSave({ name, author, level, status }); }} className="mt-5 space-y-4">
        <Field label={t.modal.fields.bookName}><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required /></Field>
        <Field label={t.modal.fields.author}><input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.modal.fields.level}>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls}>
              <option value="beginner">{t.level.beginner}</option>
              <option value="intermediate">{t.level.intermediate}</option>
              <option value="advanced">{t.level.advanced}</option>
            </select>
          </Field>
          <Field label={t.modal.fields.status}>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              <option value="draft">{t.status.draft}</option>
              <option value="published">{t.status.published}</option>
              <option value="archived">{t.status.archived}</option>
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#DDEAE6] bg-white px-4 py-2 text-xs font-bold text-[#617873] hover:border-[#0D9E84]">{t.modal.close}</button>
          <button type="submit" className="rounded-lg bg-[#0D9E84] px-4 py-2 text-xs font-bold text-white hover:bg-[#0A8873]">{t.modal.save}</button>
        </div>
      </form>
    </ModalShell>
  );
}

function LectureModal({ t, initial, onClose, onSave }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [type, setType] = useState(initial?.type || 'audio');
  const [duration, setDuration] = useState(initial ? Math.round(initial.duration / 60) : '');
  const [status, setStatus] = useState(initial?.status || 'draft');
  return (
    <ModalShell onClose={onClose}>
      <h3 className="font-amiri text-xl font-bold text-[#123D36]">{initial ? t.modal.editLectureTitle : t.modal.addLectureTitle}</h3>
      <form onSubmit={(e) => { e.preventDefault(); onSave({ title, type, duration, status }); }} className="mt-5 space-y-4">
        <Field label={t.modal.fields.lectureTitle}><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.modal.fields.lectureType}>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              <option value="audio">{t.type.audio}</option>
              <option value="video">{t.type.video}</option>
            </select>
          </Field>
          <Field label={t.modal.fields.lectureDuration}><input type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)} className={inputCls} required /></Field>
        </div>
        <Field label={t.modal.fields.status}>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="draft">{t.status.draft}</option>
            <option value="published">{t.status.published}</option>
            <option value="archived">{t.status.archived}</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#DDEAE6] bg-white px-4 py-2 text-xs font-bold text-[#617873] hover:border-[#0D9E84]">{t.modal.close}</button>
          <button type="submit" className="rounded-lg bg-[#0D9E84] px-4 py-2 text-xs font-bold text-white hover:bg-[#0A8873]">{t.modal.save}</button>
        </div>
      </form>
    </ModalShell>
  );
}

/* =========================================================
   Small shared components (unchanged)
   ========================================================= */

function MiniStat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E0E8E5] bg-white p-4">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#EAF7F3] text-[#0B8D77]">{icon}</div>
      <div>
        <p className="font-amiri text-2xl font-bold text-[#123D36]">{value.toLocaleString('ar-EG')}</p>
        <p className="text-[11px] text-[#7B908B]">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    published: 'bg-[#EAF7F3] text-[#0B8D77]',
    draft: 'bg-[#FFF4E0] text-[#A46E35]',
    archived: 'bg-[#F0F0F0] text-[#6F8580]',
  };
  const label = T.status[status] || status;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status] || styles.draft}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
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

function ModalShell({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#E0E8E5] bg-white p-6 shadow-[0_30px_80px_rgba(6,58,53,.2)]">{children}</div>
    </div>
  );
}

function ConfirmModal({ title, body, onCancel, onConfirm, confirmLabel, cancelLabel }) {
  return (
    <ModalShell onClose={onCancel}>
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FEF2F2] text-[#B91C1C]"><TrashIcon large /></div>
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

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-bold text-[#4A5F5A]">{label}</span>
      {children}
    </label>
  );
}

const inputCls = 'h-11 w-full rounded-xl border border-[#DDEAE6] bg-white px-3 text-sm text-[#153B35] outline-none focus:border-[#54BDA8]';

/* =========================================================
   Icons (unchanged)
   ========================================================= */

function SearchIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" strokeLinecap="round" /></svg> }
function PlusIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg> }
function EditIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 20h4l10-10-4-4L4 16v4Z" strokeLinejoin="round" /><path d="m14 6 4 4" strokeLinecap="round" /></svg> }
function TrashIcon({ large = false }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={large ? 'h-5 w-5' : 'h-4 w-4'}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function ArtIcon({ large = false }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={large ? 'h-6 w-6' : 'h-4 w-4'}><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-.8 2-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.8.6-1.5 1.5-1.5h1.5A4 4 0 0 0 20 12.5C20 7.3 16.4 3 12 3Z" strokeLinejoin="round" /></svg> }
function BookIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M2 4h6a4 4 0 0 1 4 4v12a4 4 0 0 0-4-4H2V4Z" strokeLinejoin="round" /><path d="M22 4h-6a4 4 0 0 0-4 4v12a4 4 0 0 1 4-4h6V4Z" strokeLinejoin="round" /></svg> }
function PlayCircleIcon({ small = false }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={small ? 'h-3 w-3' : 'h-4 w-4'}><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4V8Z" strokeLinejoin="round" /></svg> }
function HeadphonesIcon({ small = false }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={small ? 'h-3 w-3' : 'h-4 w-4'}><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M18 19h1a1 1 0 0 0 1-1v-4h-4v4a1 1 0 0 0 1 1h1ZM6 19H5a1 1 0 0 1-1-1v-4h4v4a1 1 0 0 1-1 1H6Z" /></svg> }
function UploadIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M12 16V4M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 20h16" strokeLinecap="round" /></svg> }
function ChevronRight() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg> }