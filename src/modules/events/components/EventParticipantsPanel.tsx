/**
 * EventParticipantsPanel Component
 * Manages event participants: add, remove, mark paid, settle
 */

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
        <h3 className="text-base font-semibold text-slate-900">
          Nguoi tham gia ({participants.length})
        </h3>
        <div className="flex gap-2">
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-secondary text-sm"
              disabled={loading || availableMembers.length === 0}
            >
              Them nguoi
            </button>
          )}
          <button
            onClick={handleSettle}
            className="btn-primary text-sm"
            disabled={loading || settleLoading || participants.length === 0}
          >
            {settleLoading ? 'Dang tinh...' : 'Tinh tien su kien'}
          </button>
        </div>
      </div>

      {isSettled && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Da tinh tien · {paidCount}/{participants.length} da thanh toan
        </div>
      )}

      {showAddForm && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
          <p className="mb-3 text-sm font-medium text-slate-700">
            Chon thanh vien de them:
          </p>
          {availableMembers.length === 0 ? (
            <p className="text-sm text-slate-500">
              Tat ca thanh vien da duoc them.
            </p>
          ) : (
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {availableMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 hover:bg-blue-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(member.id)}
                    onChange={() => toggleUser(member.id)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-800">{member.name}</span>
                  <span className="text-xs text-slate-500">{member.email}</span>
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
              Them ({selectedUserIds.length})
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setSelectedUserIds([]);
              }}
              className="btn-secondary text-sm"
            >
              Huy
            </button>
          </div>
        </div>
      )}

      {participants.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">
          Chua co nguoi tham gia. Nhan &quot;Them nguoi&quot; de bat dau.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {participants.map((p) => (
            <div
              key={p.user_id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {p.user_name}
                </p>
                {p.contribution_per_person > 0 && (
                  <p className="text-xs text-slate-500">
                    {p.contribution_per_person.toLocaleString('vi-VN')}d
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {p.is_paid ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    Da dong
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => onMarkPaid(p.user_id)}
                      className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                      disabled={loading}
                    >
                      Xac nhan
                    </button>
                    <button
                      onClick={() => onRemoveParticipant(p.user_id)}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                      disabled={loading}
                    >
                      Xoa
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
