import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { adminTreeApi, lecturesApi } from '../../api/client.js';
import { useI18n } from '../../context/AdminLangContext.jsx'; // <-- IMPORT

const PARALLEL_UPLOADS = 3;

export default function UploadLecturePage() {
  const { t: T } = useI18n(); // <-- USE CONTEXT
  const [arts, setArts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedArtId, setSelectedArtId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');

  const [defaults, setDefaults] = useState({ type: 'audio', status: 'draft', description: '' });
  
  const [files, setFiles] = useState([]); 
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const fileRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await adminTreeApi.tree();
        if (!cancelled) setArts(data.tree || []);
      } catch (err) {
        if (!cancelled) setError(err.userMessage || T.errors.load);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const booksForArt = selectedArtId ? arts.find((a) => a.id === selectedArtId)?.books || [] : [];
  const selectedArt = arts.find((a) => a.id === selectedArtId);
  const selectedBook = booksForArt.find((b) => b.id === selectedBookId);

  const addFiles = (fileList) => {
    const newFiles = Array.from(fileList).map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      file: f,
      title: filenameToTitle(f.name),
      progress: 0,
      status: 'pending',
      error: null,
    }));

    setFiles((prev) => {
      const all = [...prev, ...newFiles];
      all.sort((a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true }));
      return all;
    });
    
    if (newFiles.length > 0) {
      const allAudio = newFiles.every(f => f.file.type.startsWith('audio/'));
      const allVideo = newFiles.every(f => f.file.type.startsWith('video/'));
      if (allAudio) setDefaults(d => ({ ...d, type: 'audio' }));
      if (allVideo) setDefaults(d => ({ ...d, type: 'video' }));
    }
  };

  const filenameToTitle = (filename) => {
    const base = filename.replace(/\.[^.]+$/, '');
    return base.replace(/^[\d\s_-]+/, '').replace(/[_-]+/g, ' ').trim() || base;
  };

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));
  const updateFile = (id, patch) => setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const reset = () => {
    setFiles([]);
    setError('');
    setDone(false);
    setSelectedArtId('');
    setSelectedBookId('');
  };

  const startUpload = async (e) => {
    if (e) e.preventDefault();
    if (files.length === 0) return setError(T.validation.fileRequired);
    if (!selectedArtId || !selectedBookId) return setError(T.errors.noBook);

    setError('');
    setUploading(true);

    setFiles((prev) =>
      prev.map((f) => (f.status === 'done' ? f : { ...f, status: 'pending', progress: 0, error: null }))
    );

    const queue = files.filter((f) => f.status !== 'done');
    let index = 0;

    const processNext = async () => {
      if (index >= queue.length) return;
      const current = queue[index++];
      await uploadOne(current);
      await processNext();
    };

    const workers = [];
    for (let i = 0; i < PARALLEL_UPLOADS; i++) workers.push(processNext());
    await Promise.all(workers);

    setUploading(false);
    
    setFiles((prev) => {
      if (prev.every((f) => f.status === 'done')) setDone(true);
      return prev;
    });
  };

  const uploadOne = async (fileItem) => {
    updateFile(fileItem.id, { status: 'uploading', progress: 0, error: null });

    try {
      const uploaded = await lecturesApi.uploadMedia(fileItem.file, (percent) => {
        updateFile(fileItem.id, { progress: percent });
      });

      updateFile(fileItem.id, { status: 'saving', progress: 100 });

      await lecturesApi.create({
        parent: selectedArt?.nameEn || selectedArt?.name, parentArabic: selectedArt?.name,
        course: selectedBook?.nameEn || selectedBook?.name, courseArabic: selectedBook?.name,
        book: selectedBook?.nameEn || selectedBook?.name, bookArabic: selectedBook?.name,
        title: fileItem.title, titleArabic: fileItem.title, description: defaults.description,
        type: defaults.type, mediaKey: uploaded.mediaKey, mediaUrl: uploaded.mediaUrl,
        durationSeconds: 0, sizeBytes: uploaded.sizeBytes, mimeType: uploaded.contentType,
        order: files.findIndex((f) => f.id === fileItem.id) + 1,
        isPublished: defaults.status === 'published',
        artRef: selectedArtId, bookRef: selectedBookId,
      });

      updateFile(fileItem.id, { status: 'done' });
    } catch (err) {
      updateFile(fileItem.id, { status: 'error', error: err.userMessage || err.message || 'فشل' });
    }
  };

  const retryFailed = () => {
    setFiles((prev) => prev.map((f) => (f.status === 'error' ? { ...f, status: 'pending', progress: 0, error: null } : f)));
    setTimeout(() => startUpload(), 100);
  };

  const stats = {
    total: files.length,
    done: files.filter((f) => f.status === 'done').length,
    error: files.filter((f) => f.status === 'error').length,
    pending: files.filter((f) => f.status === 'pending' || f.status === 'uploading' || f.status === 'saving').length,
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <div className="rounded-2xl border border-[#BFE6DC] bg-white p-8 shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EAF7F3] text-[#0B8D77]"><CheckCircleIcon /></div>
          <h2 className="mt-4 font-amiri text-2xl font-bold text-[#123D36]">{T.success.title}</h2>
          <p className="mt-2 text-sm text-[#6F8580]">{T.success.subtitle} ({stats.done})</p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={reset} className="rounded-lg bg-[#0D9E84] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0A8873]">{T.success.another}</button>
            <Link to="/dashboard/lectures" className="rounded-lg border border-[#DDEAE6] px-5 py-2.5 text-sm font-bold text-[#617873] hover:bg-gray-50">{T.success.toList}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-amiri text-3xl font-bold text-[#123D36]">{T.title}</h1>
          <p className="mt-1 text-sm text-[#70847F]">{T.subtitle}</p>
        </div>
        <Link to="/dashboard/lectures" className="rounded-lg border border-[#DDEAE6] bg-white px-4 py-2.5 text-sm font-bold text-[#617873] hover:border-[#0D9E84] hover:text-[#0D9E84] transition">
          {T.actions.cancel}
        </Link>
      </div>

      {error && <div className="mb-6 rounded-xl border border-[#F4C7C7] bg-[#FDF1F1] p-4 text-sm font-bold text-[#A03030]">{error}</div>}

      <form onSubmit={startUpload} className="space-y-8">
        
        {/* Step 1: Classification */}
        <section className="rounded-3xl border border-[#E0E8E5] bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-[#F0F5F3] pb-4">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#EAF7F3] text-sm font-bold text-[#0B8D77]">1</span>
            <h2 className="font-amiri text-xl font-bold text-[#123D36]">{T.chooseArt}</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Arts */}
            <div>
              <span className="mb-3 block text-xs font-bold text-[#4A5F5A]">{T.chooseArt}</span>
              {loading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-xl bg-[#F8FBFA]" />)}
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {arts.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => { setSelectedArtId(a.id); setSelectedBookId(''); }}
                      className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-right transition ${
                        selectedArtId === a.id 
                          ? 'border-[#0D9E84] bg-[#EAF7F3] shadow-sm' 
                          : 'border-[#DDEAE6] bg-white hover:border-[#0D9E84] hover:bg-[#F8FBFA]'
                      }`}
                    >
                      <span className={`text-sm font-bold ${selectedArtId === a.id ? 'text-[#0B8D77]' : 'text-[#153D36]'}`}>{a.name}</span>
                      {selectedArtId === a.id && <CheckCircleIcon />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Books */}
            <div>
              <span className="mb-3 block text-xs font-bold text-[#4A5F5A]">{T.chooseBook}</span>
              {!selectedArtId ? (
                <div className="rounded-xl border border-dashed border-[#DDEAE6] bg-[#F8FBFA] p-6 text-center text-sm text-[#9AAEAA]">
                  {T.empty.book}
                </div>
              ) : booksForArt.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#DDEAE6] bg-[#F8FBFA] p-6 text-center text-sm text-[#9AAEAA]">
                  {T.empty.book}
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {booksForArt.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBookId(b.id)}
                      className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-right transition ${
                        selectedBookId === b.id 
                          ? 'border-[#0D9E84] bg-[#EAF7F3] shadow-sm' 
                          : 'border-[#DDEAE6] bg-white hover:border-[#0D9E84] hover:bg-[#F8FBFA]'
                      }`}
                    >
                      <span className={`text-sm font-bold ${selectedBookId === b.id ? 'text-[#0B8D77]' : 'text-[#153D36]'}`}>{b.name}</span>
                      {selectedBookId === b.id && <CheckCircleIcon />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Step 2: Defaults */}
        <section className="rounded-3xl border border-[#E0E8E5] bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-[#F0F5F3] pb-4">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#EAF7F3] text-sm font-bold text-[#0B8D77]">2</span>
            <h2 className="font-amiri text-xl font-bold text-[#123D36]">{T.defaults}</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <span className="mb-3 block text-xs font-bold text-[#4A5F5A]">{T.form.type}</span>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setDefaults({...defaults, type: 'audio'})} className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition ${defaults.type === 'audio' ? 'border-[#0D9E84] bg-[#EAF7F3] text-[#0B8D77]' : 'border-[#DDEAE6] bg-white text-[#6F8580] hover:bg-[#F8FBFA]'}`}>
                  <span className="text-2xl">🎧</span>
                  <span className="text-xs font-bold">{T.form.audio}</span>
                </button>
                <button type="button" onClick={() => setDefaults({...defaults, type: 'video'})} className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition ${defaults.type === 'video' ? 'border-[#0D9E84] bg-[#EAF7F3] text-[#0B8D77]' : 'border-[#DDEAE6] bg-white text-[#6F8580] hover:bg-[#F8FBFA]'}`}>
                  <span className="text-2xl">▶</span>
                  <span className="text-xs font-bold">{T.form.video}</span>
                </button>
              </div>
            </div>
            <div>
              <span className="mb-3 block text-xs font-bold text-[#4A5F5A]">{T.form.status}</span>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setDefaults({...defaults, status: 'draft'})} className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition ${defaults.status === 'draft' ? 'border-[#A46E35] bg-[#FFF4E0] text-[#A46E35]' : 'border-[#DDEAE6] bg-white text-[#6F8580] hover:bg-[#F8FBFA]'}`}>
                  <span className="text-2xl">📝</span>
                  <span className="text-xs font-bold">{T.form.draft}</span>
                </button>
                <button type="button" onClick={() => setDefaults({...defaults, status: 'published'})} className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition ${defaults.status === 'published' ? 'border-[#1F8A4C] bg-[#E6F7EC] text-[#1F8A4C]' : 'border-[#DDEAE6] bg-white text-[#6F8580] hover:bg-[#F8FBFA]'}`}>
                  <span className="text-2xl">🌐</span>
                  <span className="text-xs font-bold">{T.form.published}</span>
                </button>
              </div>
            </div>
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-xs font-bold text-[#4A5F5A]">{T.form.description}</span>
              <input value={defaults.description} onChange={(e) => setDefaults({ ...defaults, description: e.target.value })} className="h-12 w-full rounded-xl border border-[#DDEAE6] bg-[#F8FBFA] px-4 text-sm outline-none focus:border-[#0D9E84] focus:bg-white transition" />
            </label>
          </div>
        </section>

        {/* Step 3: Files */}
        <section className="rounded-3xl border border-[#E0E8E5] bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-[#F0F5F3] pb-4">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#EAF7F3] text-sm font-bold text-[#0B8D77]">3</span>
            <h2 className="font-amiri text-xl font-bold text-[#123D36]">{T.queue.title}</h2>
          </div>

          {/* Dropzone */}
          <div 
            onClick={() => !uploading && fileRef.current?.click()} 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (!uploading && e.dataTransfer.files) addFiles(e.dataTransfer.files); }}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${files.length > 0 ? 'border-[#0D9E84] bg-[#EAF7F3]' : 'border-[#C8DCD7] bg-[#F8FBFA] hover:border-[#0D9E84]'}`}
          >
            <input ref={fileRef} type="file" accept="audio/*,video/*" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
            
            <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl transition-colors ${files.length > 0 ? 'bg-[#0D9E84] text-white' : 'bg-white text-[#0B8D77] shadow-sm'}`}>
              <UploadIcon large />
            </div>
            
            <p className="mt-4 text-base font-bold text-[#153D36]">
              {files.length > 0 ? `تم تحديد ${files.length} ملف` : T.form.fileHint}
            </p>
          </div>

          {/* Queue */}
          {files.length > 0 && (
            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-bold text-[#7B908B]">
                  {stats.total} {T.queue.files} · {stats.done} ✅ · {stats.pending} ⏳ · {stats.error} ❌
                </p>
                {!uploading && (
                  <button type="button" onClick={() => setFiles([])} className="text-xs font-bold text-[#A03030] hover:underline">
                    {T.queue.removeAll}
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {files.map((f, i) => (
                  <FileRow
                    key={f.id}
                    file={f}
                    index={i + 1}
                    onRemove={() => removeFile(f.id)}
                    onTitleChange={(title) => updateFile(f.id, { title })}
                    disabled={uploading || f.status === 'done'}
                  />
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end border-t border-[#F0F5F3] pt-6">
                {stats.error > 0 && !uploading && (
                  <button type="button" onClick={retryFailed} className="rounded-xl border border-[#F4C4C4] bg-white px-6 py-3 text-sm font-bold text-[#B91C1C] hover:bg-[#FEF2F2] transition">
                    {T.queue.retryFailed} ({stats.error})
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={uploading || files.length === 0 || !selectedArtId || !selectedBookId} 
                  className="rounded-xl bg-[#0D9E84] px-8 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(13,158,132,.22)] hover:bg-[#0A8873] disabled:opacity-50 transition"
                >
                  {uploading ? `${T.queue.uploading} (${stats.done}/${stats.total})` : T.queue.startUpload}
                </button>
              </div>
            </div>
          )}
        </section>
      </form>
    </div>
  );
}

function FileRow({ file, index, onRemove, onTitleChange, disabled }) {
  const { t: T } = useI18n(); // <-- USE CONTEXT
  const statusColors = {
    pending: 'bg-[#F0F5F3] text-[#6F8580]',
    uploading: 'bg-[#EAF7F3] text-[#0B8D77]',
    saving: 'bg-[#FFF4E0] text-[#A46E35]',
    done: 'bg-[#E6F7EC] text-[#1F8A4C]',
    error: 'bg-[#FEF2F2] text-[#B91C1C]',
  };
  
  return (
    <div className="flex items-start gap-4 rounded-xl border border-[#F0F5F3] bg-white p-4 hover:border-[#DDEAE6] transition">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F8FBFA] text-sm font-bold text-[#9AAEAA] border border-[#E0E8E5]">
        {String(index).padStart(2, '0')}
      </span>

      <div className="min-w-0 flex-1 pt-1">
        <input
          value={file.title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={disabled}
          className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-bold text-[#153D36] outline-none hover:border-[#DDEAE6] focus:border-[#0D9E84] focus:bg-white disabled:cursor-default"
        />
        <p className="mt-1 px-2 truncate text-[11px] text-[#9AAEAA]" dir="ltr">
          {file.file.name} · {(file.file.size / 1024 / 1024).toFixed(1)} MB
        </p>
        {file.error && <p className="mt-1 px-2 text-[11px] font-bold text-[#B91C1C]">{file.error}</p>}

        {(file.status === 'uploading' || file.status === 'saving') && (
          <div className="mt-3 px-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E3EEEB]">
              <div className="h-full rounded-full bg-[#0D9E84] transition-all duration-300" style={{ width: `${file.progress}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-2 pt-1">
        <span className={`rounded-lg px-3 py-1.5 text-[11px] font-bold ${statusColors[file.status]}`}>
          {T.queue.status[file.status]} {file.status === 'uploading' && `${file.progress}%`}
        </span>

        {!disabled && file.status !== 'done' && (
          <button type="button" onClick={onRemove} className="grid h-8 w-8 place-items-center rounded-lg border border-transparent text-[#A03030] hover:bg-[#FEF2F2] hover:border-[#F4C4C4] transition" title="إزالة">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" /></svg>
          </button>
        )}

        {file.status === 'done' && (
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#E6F7EC] text-[#1F8A4C]">
            <CheckIcon />
          </span>
        )}
      </div>
    </div>
  );
}

function UploadIcon({ large = false }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={large ? 'h-8 w-8' : 'h-5 w-5'}><path d="M12 16V4M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 20h16" strokeLinecap="round" /></svg> }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4"><path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function CheckCircleIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg> }