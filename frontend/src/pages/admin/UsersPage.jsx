// UsersPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../../api/client.js';

const T = {
  title: 'المستخدمون',
  subtitle: 'إدارة حسابات المستخدمين، الأدوار، والصلاحيات.',
  searchPlaceholder: 'ابحث بالاسم أو البريد الإلكتروني...',
  filters: { all: 'الكل', role: 'الدور', status: 'الحالة' },
  roles: { student: 'طالب', supervisor: 'مشرف', admin: 'مشرف عام' },
  status: { active: 'نشط', suspended: 'موقوف' },
  table: {
    user: 'المستخدم', role: 'الدور', status: 'الحالة', joined: 'تاريخ الانضمام',
    lastActive: 'آخر نشاط', lectures: 'الدروس', certificates: 'الشهادات', actions: 'إجراءات',
  },
  actions: { view: 'عرض', edit: 'تحرير', suspend: 'إيقاف', activate: 'تنشيط', delete: 'حذف' },
  bulk: {
    selected: 'مستخدم محدد', suspend: 'إيقاف المحدد', activate: 'تنشيط المحدد',
    delete: 'حذف المحدد', clear: 'إلغاء التحديد',
  },
  empty: { title: 'لا يوجد مستخدمون', subtitle: 'لم يتم العثور على مستخدمين يطابقون معايير البحث.' },
  modal: {
    editTitle: 'تحرير المستخدم', viewTitle: 'تفاصيل المستخدم',
    close: 'إغلاق', cancel: 'إلغاء', save: 'حفظ',
    fields: { name: 'الاسم', email: 'البريد / الهاتف', role: 'الدور', status: 'الحالة' },
    confirmDeleteTitle: 'تأكيد حذف المستخدم',
    confirmDeleteBody: 'سيتم حذف هذا المستخدم وجميع بياناته. لا يمكن التراجع.',
    confirmBulkDeleteTitle: 'تأكيد حذف المحدد',
    confirmBulkDeleteBody: 'سيتم حذف جميع المستخدمين المحددين. لا يمكن التراجع.',
    confirm: 'تأكيد الحذف',
  },
  stat: { total: 'إجمالي المستخدمين', active: 'نشط', supervisors: 'المشرفون', suspended: 'موقوفون' },
  loading: 'جارٍ التحميل...',
  error: 'تعذّر تحميل المستخدمين.',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [modal, setModal] = useState(null);
  const locale = 'ar-EG';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.users();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.userMessage || T.error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    supervisors: users.filter((u) => u.role === 'supervisor' || u.role === 'admin').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
  }), [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery = !q || u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allOnPageSelected = paged.length > 0 && paged.every((u) => selected.includes(u.id));
  const toggleSelectAll = () => {
    if (allOnPageSelected) setSelected((prev) => prev.filter((id) => !paged.some((u) => u.id === id)));
    else setSelected((prev) => Array.from(new Set([...prev, ...paged.map((u) => u.id)])));
  };
  const toggleSelect = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const updateUser = async (updated) => {
    try {
      await adminApi.updateUser(updated.id, { role: updated.role, status: updated.status });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
      setModal(null);
    } catch (err) {
      alert(err.userMessage || 'Error updating user');
    }
  };

  const deleteUser = async (id) => {
    try {
      await adminApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setSelected((prev) => prev.filter((x) => x !== id));
      setModal(null);
    } catch (err) {
      alert(err.userMessage || 'Error deleting user');
    }
  };

  const deleteSelected = async () => {
    try {
      await Promise.all(selected.map(id => adminApi.deleteUser(id)));
      setUsers((prev) => prev.filter((u) => !selected.includes(u.id)));
      setSelected([]);
      setModal(null);
    } catch (err) {
      alert(err.userMessage || 'Error deleting users');
    }
  };

  const bulkSetStatus = async (status) => {
    try {
      await Promise.all(selected.map(id => adminApi.updateUser(id, { status })));
      setUsers((prev) => prev.map((u) => (selected.includes(u.id) ? { ...u, status } : u)));
      setSelected([]);
    } catch (err) {
      alert(err.userMessage || 'Error updating users');
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
        </div>

        {error && <div className="rounded-xl border border-[#F4C7C7] bg-[#FDF1F1] p-4 text-sm text-[#A03030]">{error}</div>}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<UsersIcon />} label={T.stat.total} value={stats.total} accent="teal" loading={loading} />
          <StatCard icon={<CheckCircleIcon />} label={T.stat.active} value={stats.active} accent="green" loading={loading} />
          <StatCard icon={<ShieldIcon />} label={T.stat.supervisors} value={stats.supervisors} accent="amber" loading={loading} />
          <StatCard icon={<XCircleIcon />} label={T.stat.suspended} value={stats.suspended} accent="red" loading={loading} />
        </div>

        {/* Search & filters */}
        <div className="rounded-2xl border border-[#E0E8E5] bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-[#8BA09B]"><SearchIcon /></span>
              <input
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder={T.searchPlaceholder}
                className="h-11 w-full rounded-xl border border-[#DDEAE6] bg-white ps-10 pe-3 text-sm text-[#153B35] outline-none placeholder:text-[#91A39F] focus:border-[#54BDA8]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={roleFilter} onChange={(v) => { setRoleFilter(v); setPage(1); }}>
                <option value="all">{T.filters.role}: {T.filters.all}</option>
                <option value="student">{T.roles.student}</option>
                <option value="supervisor">{T.roles.supervisor}</option>
                <option value="admin">{T.roles.admin}</option>
              </Select>
              <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <option value="all">{T.filters.status}: {T.filters.all}</option>
                <option value="active">{T.status.active}</option>
                <option value="suspended">{T.status.suspended}</option>
              </Select>
            </div>
          </div>

          {/* Bulk actions */}
          {selected.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#BFE6DC] bg-[#EAF7F3] p-3">
              <span className="text-xs font-bold text-[#0B8D77]">{selected.length.toLocaleString(locale)} {T.bulk.selected}</span>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => bulkSetStatus('active')} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-[#0B8D77] hover:bg-[#0D9E84] hover:text-white">
                  <CheckIcon /> {T.bulk.activate}
                </button>
                <button onClick={() => bulkSetStatus('suspended')} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-[#A46E35] hover:bg-[#A46E35] hover:text-white">
                  <PauseIcon /> {T.bulk.suspend}
                </button>
                <button onClick={() => setModal({ type: 'bulkDelete' })} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-[#B91C1C] hover:bg-[#B91C1C] hover:text-white">
                  <TrashIcon /> {T.bulk.delete}
                </button>
                <button onClick={() => setSelected([])} className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-[#617873] hover:text-[#0D9E84]">
                  {T.bulk.clear}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-[#E0E8E5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1024px] text-start">
              <thead className="bg-[#F8FBFA] text-[11px] font-bold uppercase tracking-wider text-[#9AAEAA]">
                <tr>
                  <th className="w-12 px-4 py-3 text-start">
                    <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll} className="h-4 w-4 cursor-pointer rounded border-[#C8DCD7] text-[#0D9E84] focus:ring-[#0D9E84]" />
                  </th>
                  <th className="px-4 py-3 text-start">{T.table.user}</th>
                  <th className="px-4 py-3 text-start">{T.table.role}</th>
                  <th className="px-4 py-3 text-start">{T.table.status}</th>
                  <th className="px-4 py-3 text-start">{T.table.joined}</th>
                  <th className="px-4 py-3 text-start">{T.table.lastActive}</th>
                  <th className="px-4 py-3 text-end">{T.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F5F3]">
                {loading ? (
                  [1, 2, 3, 4].map(i => (
                    <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-10 animate-pulse rounded bg-[#F8FBFA]" /></td></tr>
                  ))
                ) : paged.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#F3F9F7] text-[#8BA09B]"><UsersIcon large /></div>
                      <p className="mt-4 font-amiri text-lg font-bold text-[#153D36]">{T.empty.title}</p>
                      <p className="mt-1 text-xs text-[#7B908B]">{T.empty.subtitle}</p>
                    </div>
                  </td></tr>
                ) : paged.map((u) => (
                  <tr key={u.id} className={`text-sm transition ${selected.includes(u.id) ? 'bg-[#F3FBF8]' : 'hover:bg-[#F8FBFA]'}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} className="h-4 w-4 cursor-pointer rounded border-[#C8DCD7] text-[#0D9E84] focus:ring-[#0D9E84]" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#EAF7F3] text-xs font-bold text-[#0B8D77]">{u.name.charAt(0)}</div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-[#153D36]">{u.name}</p>
                          <p className="mt-0.5 truncate text-[10px] text-[#9AAEAA]" dir="ltr">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3 text-xs text-[#6F8580]">{formatDate(u.joined, locale)}</td>
                    <td className="px-4 py-3 text-xs text-[#6F8580]">{relativeTime(u.lastActive, locale)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn title={T.actions.view} onClick={() => setModal({ type: 'view', payload: u })}><EyeIcon /></IconBtn>
                        <IconBtn title={T.actions.edit} onClick={() => setModal({ type: 'edit', payload: u })}><EditIcon /></IconBtn>
                        {u.status === 'active' ? (
                          <IconBtn title={T.actions.suspend} onClick={() => updateUser({ ...u, status: 'suspended' })}><PauseIcon /></IconBtn>
                        ) : (
                          <IconBtn title={T.actions.activate} onClick={() => updateUser({ ...u, status: 'active' })}><CheckIcon /></IconBtn>
                        )}
                        <IconBtn title={T.actions.delete} danger onClick={() => setModal({ type: 'delete', payload: u })}><TrashIcon /></IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-[#F0F5F3] px-4 py-3 sm:flex-row">
              <p className="text-xs text-[#6F8580]">
                عرض <span className="font-bold text-[#153D36]">{((currentPage - 1) * pageSize + 1).toLocaleString(locale)}–{Math.min(currentPage * pageSize, filtered.length).toLocaleString(locale)}</span> من <span className="font-bold text-[#153D36]">{filtered.length.toLocaleString(locale)}</span> نتيجة
              </p>
              <div className="flex items-center gap-1">
                <PageBtn disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronRight /> السابق</PageBtn>
                <span className="px-3 text-xs font-bold text-[#153D36]">صفحة {currentPage.toLocaleString(locale)} / {totalPages.toLocaleString(locale)}</span>
                <PageBtn disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>التالي <ChevronLeft /></PageBtn>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal?.type === 'edit' && <UserFormModal t={T} initial={modal.payload} onClose={() => setModal(null)} onSave={updateUser} />}
      {modal?.type === 'view' && <UserViewModal t={T} user={modal.payload} onClose={() => setModal(null)} />}
      {modal?.type === 'delete' && (
        <ConfirmModal
          title={T.modal.confirmDeleteTitle}
          body={T.modal.confirmDeleteBody}
          cancelLabel={T.modal.cancel}
          confirmLabel={T.modal.confirm}
          onCancel={() => setModal(null)}
          onConfirm={() => deleteUser(modal.payload.id)}
        />
      )}
      {modal?.type === 'bulkDelete' && (
        <ConfirmModal
          title={T.modal.confirmBulkDeleteTitle}
          body={T.modal.confirmBulkDeleteBody}
          cancelLabel={T.modal.cancel}
          confirmLabel={T.modal.confirm}
          onCancel={() => setModal(null)}
          onConfirm={deleteSelected}
        />
      )}
    </div>
  );
}

/* =========================================================
   Sub-components
   ========================================================= */

function StatCard({ icon, label, value, accent, loading }) {
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
        <p className="mt-4 font-amiri text-3xl font-bold text-[#123D36]">{value.toLocaleString('ar-EG')}</p>
      )}
      <p className="mt-1 text-xs text-[#7B908B]">{label}</p>
    </div>
  );
}

function RoleBadge({ role }) {
  const styles = {
    student: 'bg-[#EAF7F3] text-[#0B8D77]',
    supervisor: 'bg-[#FFF4E0] text-[#A46E35]',
    admin: 'bg-[#F0EBFA] text-[#6B46C1]',
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[role]}`}>{T.roles[role]}</span>;
}

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-[#E6F7EC] text-[#1F8A4C]',
    suspended: 'bg-[#FEF2F2] text-[#B91C1C]',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {T.status[status]}
    </span>
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

function PageBtn({ children, disabled, onClick }) {
  return (
    <button disabled={disabled} onClick={onClick} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#DDEAE6] bg-white px-3 text-xs font-bold text-[#617873] hover:border-[#0D9E84] hover:text-[#0D9E84] disabled:cursor-not-allowed disabled:opacity-40">
      {children}
    </button>
  );
}

function UserFormModal({ t, initial, onClose, onSave }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    role: initial?.role || 'student',
    status: initial?.status || 'active',
  });
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <ModalShell onClose={onClose}>
      <h3 className="font-amiri text-xl font-bold text-[#123D36]">{t.modal.editTitle}</h3>
      <form onSubmit={(e) => { e.preventDefault(); onSave({ ...initial, ...form }); }} className="mt-5 space-y-4">
        <Field label={t.modal.fields.name}><input value={form.name} className={inputCls} disabled /></Field>
        <Field label={t.modal.fields.email}><input value={form.email} className={inputCls} disabled dir="ltr" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.modal.fields.role}>
            <select value={form.role} onChange={(e) => update('role', e.target.value)} className={inputCls}>
              <option value="student">{t.roles.student}</option>
              <option value="supervisor">{t.roles.supervisor}</option>
              <option value="admin">{t.roles.admin}</option>
            </select>
          </Field>
          <Field label={t.modal.fields.status}>
            <select value={form.status} onChange={(e) => update('status', e.target.value)} className={inputCls}>
              <option value="active">{t.status.active}</option>
              <option value="suspended">{t.status.suspended}</option>
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#DDEAE6] bg-white px-4 py-2 text-xs font-bold text-[#617873] hover:border-[#0D9E84]">{t.modal.cancel}</button>
          <button type="submit" className="rounded-lg bg-[#0D9E84] px-4 py-2 text-xs font-bold text-white hover:bg-[#0A8873]">{t.modal.save}</button>
        </div>
      </form>
    </ModalShell>
  );
}

function UserViewModal({ t, user, onClose }) {
  return (
    <ModalShell onClose={onClose} wide>
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-[#0D9E84] font-amiri text-2xl font-bold text-white">{user.name.charAt(0)}</div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AAEAA]">{t.modal.viewTitle}</p>
          <h3 className="mt-0.5 font-amiri text-xl font-bold text-[#123D36]">{user.name}</h3>
          <p className="mt-0.5 text-xs text-[#7B908B]" dir="ltr">{user.email}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Detail label={t.table.role} value={<RoleBadge role={user.role} />} />
        <Detail label={t.table.status} value={<StatusBadge status={user.status} />} />
        <Detail label={t.table.joined} value={formatDate(user.joined, 'ar-EG')} />
        <Detail label={t.table.lastActive} value={relativeTime(user.lastActive, 'ar-EG')} />
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={onClose} className="rounded-lg bg-[#0D9E84] px-4 py-2 text-xs font-bold text-white hover:bg-[#0A8873]">{t.modal.close}</button>
      </div>
    </ModalShell>
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

function ModalShell({ children, onClose, wide }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[92vh] overflow-y-auto rounded-2xl border border-[#E0E8E5] bg-white p-6 shadow-[0_30px_80px_rgba(6,58,53,.2)]`}>{children}</div>
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

function Detail({ label, value }) {
  return (
    <div className="rounded-xl border border-[#F0F5F3] bg-[#F8FBFA] p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AAEAA]">{label}</p>
      <div className="mt-1 text-sm font-bold text-[#153D36]">{value}</div>
    </div>
  );
}

const inputCls = 'h-11 w-full rounded-xl border border-[#DDEAE6] bg-white px-3 text-sm text-[#153B35] outline-none focus:border-[#54BDA8] disabled:bg-[#F8FBFA] disabled:text-[#9AAEAA]';

function formatDate(iso, locale) { return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }); }
function relativeTime(iso, locale) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 7) return `قبل ${days.toLocaleString(locale)} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7).toLocaleString(locale)} أسابيع`;
  return formatDate(iso, locale);
}

/* Icons */
function SearchIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" strokeLinecap="round" /></svg> }
function UsersIcon({ large = false }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={large ? 'h-6 w-6' : 'h-5 w-5'}><circle cx="9" cy="8" r="3.5" /><path d="M2 20a7 7 0 0 1 14 0" strokeLinecap="round" /><path d="M17 8.5a3 3 0 1 1 0 5M22 20a6 6 0 0 0-5-5.9" strokeLinecap="round" /></svg> }
function CheckCircleIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function XCircleIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" strokeLinecap="round" /></svg> }
function ShieldIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" strokeLinejoin="round" /></svg> }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function PauseIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg> }
function EditIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 20h4l10-10-4-4L4 16v4Z" strokeLinejoin="round" /><path d="m14 6 4 4" strokeLinecap="round" /></svg> }
function TrashIcon({ large = false }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={large ? 'h-5 w-5' : 'h-4 w-4'}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function EyeIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg> }
function ChevronLeft() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function ChevronRight() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg> }