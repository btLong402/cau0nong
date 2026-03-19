'use client';

import { useState } from 'react';
import { useMonthShuttlecocks, useMembers, useAuth } from '@/shared/hooks';
import { CustomSelect } from '@/shared/components/CustomSelect';

interface ShuttlecockManagementProps {
  monthId: number | null;
  formatCurrency: (value: number) => string;
}

export function ShuttlecockManagement({ monthId, formatCurrency }: ShuttlecockManagementProps) {
  const { user: authUser } = useAuth();
  const { shuttlecocks, loading: shuttlecocksLoading, error, refetch } = useMonthShuttlecocks(monthId);
  const { members, loading: membersLoading } = useMembers(1, 100);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    purchase_date: new Date().toISOString().split('T')[0],
    quantity: 1,
    unit_price: 150000,
    buyer_user_id: '',
    notes: '',
  });

  const memberOptions = members.map(m => ({
    value: m.id,
    label: m.name
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!monthId) return;
    if (!form.buyer_user_id) {
      alert('Vui lòng chọn người mua');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/months/${monthId}/shuttlecocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Không thể thêm lượt mua cầu');
      
      setShowAddForm(false);
      await refetch();
      // Reset form
      setForm({
        ...form,
        quantity: 1,
        notes: '',
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error adding purchase');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Bạn có chắc muốn xóa bản ghi này?')) return;

    try {
      const res = await fetch(`/api/shuttlecocks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Không thể xóa');
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error deleting');
    }
  }

  const totalExpense = shuttlecocks.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0);
  const loading = shuttlecocksLoading || membersLoading;

  return (
    <section className="surface-card">
      <div className="flex items-center justify-between border-b border-[var(--surface-border)] px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Chi phí mua cầu</h2>
          <p className="mt-0.5 text-sm text-[var(--muted)]">Quản lý các đợt mua cầu và người ứng tiền trong tháng.</p>
        </div>
        {authUser?.role === 'admin' && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary flex items-center gap-1.5 text-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Thêm đợt mua
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="border-b border-[var(--surface-border)] bg-[var(--background)] p-5 animate-fade-in">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Ngày mua</label>
              <input 
                type="date" 
                value={form.purchase_date}
                onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                className="input-field" 
                required 
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Số lượng (hộp/quả)</label>
              <input 
                type="number" 
                min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                className="input-field" 
                required 
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Đơn giá (đ)</label>
              <input 
                type="number" 
                min={0}
                step={1000}
                value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })}
                className="input-field" 
                required 
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Người mua (Ứng tiền)</label>
              <CustomSelect
                options={memberOptions}
                value={form.buyer_user_id}
                onChange={(val) => setForm({ ...form, buyer_user_id: val })}
                placeholder="Chọn thành viên"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary text-sm">Hủy</button>
            <button type="submit" disabled={submitting} className="btn-primary text-sm">
              {submitting ? 'Đang lưu...' : 'Lưu bản ghi'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3 p-5">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-12" />)}
        </div>
      ) : shuttlecocks.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-[var(--muted)]">Chưa có bản ghi mua cầu nào cho tháng này.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ngày mua</th>
                  <th>Người mua</th>
                  <th className="text-right">Số lượng</th>
                  <th className="text-right">Đơn giá</th>
                  <th className="text-right">Thành tiền</th>
                  {authUser?.role === 'admin' && <th className="text-center">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {shuttlecocks.map((item: any) => (
                  <tr key={item.id}>
                    <td>{new Date(item.purchase_date).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div className="font-medium text-[var(--foreground)]">{item.buyer_name || 'N/A'}</div>
                      <div className="text-[10px] text-[var(--muted)]">{item.buyer_user_id}</div>
                    </td>
                    <td className="text-right font-medium">{item.quantity}</td>
                    <td className="text-right text-[var(--muted)]">{formatCurrency(item.unit_price)}</td>
                    <td className="text-right font-bold text-[var(--foreground)]">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </td>
                    {authUser?.role === 'admin' && (
                      <td className="text-center">
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--background)] font-bold">
                  <td colSpan={4} className="text-right py-4">Tổng cộng:</td>
                  <td className="text-right py-4 text-[var(--primary)] text-lg">{formatCurrency(totalExpense)}</td>
                  {authUser?.role === 'admin' && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
