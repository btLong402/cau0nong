'use client';

import { useState } from 'react';
import type { EventParticipantWithUser } from '../types';

interface EventParticipantsPanelProps {
  eventId: number;
  participants: EventParticipantWithUser[];
  isSettled: boolean;
  onSettleEvent: () => Promise<void>;
  onAddParticipants: (userIds: string[]) => Promise<void>;
  onRemoveParticipant: (userId: string) => Promise<void>;
  onMarkPaid: (userId: string) => Promise<void>;
  members: Array<{ id: string; name: string; email: string }>;
  loading?: boolean;
}

export function EventParticipantsPanel({
  eventId,
  participants,
  isSettled,
  onSettleEvent,
  onAddParticipants,
  onRemoveParticipant,
  onMarkPaid,
  members,
  loading = false,
}: EventParticipantsPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [settleLoading, setSettleLoading] = useState(false);

  const existingUserIds = new Set(participants.map((p) => p.user_id));
  const availableMembers = members.filter((m) => !existingUserIds.has(m.id));

  async function handleSettle() {
    setSettleLoading(true);
    try {
      await onSettleEvent();
    } finally {
      setSettleLoading(false);
    }
  }

  async function handleAddParticipants() {
    if (selectedUserIds.length === 0) return;
    await onAddParticipants(selectedUserIds);
    setSelectedUserIds([]);
    setShowAddForm(false);
  }

  function toggleUser(userId: string) {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  const paidCount = participants.filter((p) => p.is_paid).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          Người tham gia ({participants.length})
        </h3>
        <div className="flex gap-2">
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-secondary text-sm"
              disabled={loading || availableMembers.length === 0}
            >
              Thêm người
            </button>
          )}
          <button
            onClick={handleSettle}
            className="btn-primary text-sm"
            disabled={loading || settleLoading || participants.length === 0}
          >
            {settleLoading ? 'Đang tính...' : 'Tính tiền sự kiện'}
          </button>
        </div>
      </div>

      {isSettled && (
        <div className="rounded-lg bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent)]">
          Đã tính tiền · {paidCount}/{participants.length} đã thanh toán
        </div>
      )}

      {showAddForm && (
        <div className="surface-card-soft p-4">
          <p className="mb-3 text-sm font-medium text-[var(--foreground)]">
            Chọn thành viên để thêm:
          </p>
          {availableMembers.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Tất cả thành viên đã được thêm.
            </p>
          ) : (
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {availableMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 hover:bg-[var(--primary-soft)]"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(member.id)}
                    onChange={() => toggleUser(member.id)}
                    className="h-4 w-4 rounded border-[var(--surface-border-strong)] accent-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">{member.name}</span>
                  <span className="text-xs text-[var(--muted)]">{member.email}</span>
                </label>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleAddParticipants}
              className="btn-primary text-sm"
              disabled={selectedUserIds.length === 0}
            >
              Thêm ({selectedUserIds.length})
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setSelectedUserIds([]);
              }}
              className="btn-secondary text-sm"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {participants.length === 0 ? (
        <div className="py-8 text-center text-sm text-[var(--muted)]">
          Chưa có người tham gia. Nhấn &quot;Thêm người&quot; để bắt đầu.
        </div>
      ) : (
        <div className="divide-y divide-[var(--surface-border)] overflow-hidden rounded-lg border border-[var(--surface-border)]">
          {participants.map((p) => (
            <div
              key={p.user_id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {p.user_name}
                </p>
                {p.contribution_per_person > 0 && (
                  <p className="text-xs text-[var(--muted)]">
                    {p.contribution_per_person.toLocaleString('vi-VN')}đ
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {p.is_paid ? (
                  <span className="badge badge-success">Đã đóng</span>
                ) : (
                  <>
                    <button
                      onClick={() => onMarkPaid(p.user_id)}
                      className="btn-primary h-auto min-h-0 px-3 py-1.5 text-xs"
                      disabled={loading}
                    >
                      Xác nhận
                    </button>
                    <button
                      onClick={() => onRemoveParticipant(p.user_id)}
                      className="btn-danger h-auto min-h-0 px-3 py-1.5 text-xs"
                      disabled={loading}
                    >
                      Xóa
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
