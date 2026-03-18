/**
 * Events Dashboard Page
 * List events, create/edit, view participants, settle
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { EventCard } from '@/modules/events/components/EventCard';
import { EventForm } from '@/modules/events/components/EventForm';
import { EventParticipantsPanel } from '@/modules/events/components/EventParticipantsPanel';
import { EventSettlementSummary } from '@/modules/events/components/EventSettlementSummary';
import type { Event } from '@/lib/types';
import type { EventWithParticipants } from '@/modules/events/types';

interface Member {
  id: string;
  name: string;
  email: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] =
    useState<EventWithParticipants | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [formLoading, setFormLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEvents(data.data?.items || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) return;
      const data = await res.json();
      setMembers(data.data?.users || []);
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchMembers();
  }, [fetchEvents, fetchMembers]);

  async function fetchEventDetail(eventId: number) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSelectedEvent(data.data?.event || null);
    } catch {
      setSelectedEvent(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function handleCardClick(event: Event) {
    fetchEventDetail(event.id);
  }

  async function handleCreateEvent(formData: {
    event_name: string;
    event_date: string;
    total_support: number;
    total_expense: number;
  }) {
    setFormLoading(true);
    try {
      const method = editingEvent ? 'PUT' : 'POST';
      const url = editingEvent
        ? `/api/events/${editingEvent.id}`
        : '/api/events';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || `HTTP ${res.status}`);
      }

      setShowForm(false);
      setEditingEvent(null);
      await fetchEvents();

      if (selectedEvent) {
        await fetchEventDetail(selectedEvent.id);
      }
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeleteEvent(id: number) {
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.ok ? await res.json() : { error: { message: 'Không thể xóa' } };
      alert(data.error?.message || 'Không thể xóa');
      return;
    }

    setSelectedEvent(null);
    await fetchEvents();
  }

  async function handleSettleEvent() {
    if (!selectedEvent) return;
    const res = await fetch(`/api/events/${selectedEvent.id}/settle`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error?.message || 'Lỗi tính tiền');
      return;
    }
    await fetchEventDetail(selectedEvent.id);
  }

  async function handleAddParticipants(userIds: string[]) {
    if (!selectedEvent) return;
    const res = await fetch(
      `/api/events/${selectedEvent.id}/participants`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      }
    );
    if (!res.ok) {
      const data = await res.json();
      alert(data.error?.message || 'Lỗi thêm người');
      return;
    }
    await fetchEventDetail(selectedEvent.id);
  }

  async function handleRemoveParticipant(userId: string) {
    if (!selectedEvent) return;
    const res = await fetch(
      `/api/events/${selectedEvent.id}/participants/${userId}`,
      { method: 'DELETE', credentials: 'include' }
    );
    if (!res.ok) {
      const data = await res.json();
      alert(data.error?.message || 'Lỗi xóa người');
      return;
    }
    await fetchEventDetail(selectedEvent.id);
  }

  async function handleMarkPaid(userId: string) {
    if (!selectedEvent) return;
    const res = await fetch(
      `/api/events/${selectedEvent.id}/participants/${userId}`,
      { method: 'PUT', credentials: 'include' }
    );
    if (!res.ok) {
      const data = await res.json();
      alert(data.error?.message || 'Lỗi xác nhận');
      return;
    }
    await fetchEventDetail(selectedEvent.id);
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-4 w-56" />
        <div className="grid gap-4 lg:grid-cols-2 mt-6">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="empty-state">
        <svg className="empty-state-icon text-[var(--danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="empty-state-title text-[var(--danger)]">{error}</p>
        <button onClick={fetchEvents} className="btn-primary mt-4">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sự kiện</h1>
          <p className="page-subtitle">
            Quản lý sự kiện, giải đấu và liên hoan.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            setShowForm(true);
          }}
          className="btn-primary"
        >
          Tạo sự kiện
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="surface-card-soft p-5">
          <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">
            {editingEvent ? 'Cập nhật sự kiện' : 'Tạo sự kiện mới'}
          </h2>
          <EventForm
            initialData={editingEvent || undefined}
            onSubmit={handleCreateEvent}
            onCancel={() => {
              setShowForm(false);
              setEditingEvent(null);
            }}
            isEditing={!!editingEvent}
            loading={formLoading}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Events List */}
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="empty-state py-12">
              <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              <p className="empty-state-title">Chưa có sự kiện nào</p>
              <p className="empty-state-text">Nhấn &quot;Tạo sự kiện&quot; để bắt đầu.</p>
            </div>
          ) : (
            events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={handleCardClick}
              />
            ))
          )}
        </div>

        {/* Event Detail */}
        {selectedEvent && (
          <div className="space-y-4">
            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner" />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--foreground)]">
                      {selectedEvent.event_name}
                    </h2>
                    <p className="text-sm text-[var(--muted)]">
                      {new Date(selectedEvent.event_date).toLocaleDateString(
                        'vi-VN',
                        {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingEvent(selectedEvent);
                        setShowForm(true);
                      }}
                      className="btn-secondary text-sm"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      className="btn-danger text-sm"
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                {selectedEvent.participant_count > 0 && (
                  <EventSettlementSummary
                    event={selectedEvent}
                    participantCount={selectedEvent.participant_count}
                    contributionPerPerson={
                      selectedEvent.participants[0]
                        ?.contribution_per_person || 0
                    }
                  />
                )}

                <EventParticipantsPanel
                  eventId={selectedEvent.id}
                  participants={selectedEvent.participants}
                  isSettled={selectedEvent.is_settled}
                  onSettleEvent={handleSettleEvent}
                  onAddParticipants={handleAddParticipants}
                  onRemoveParticipant={handleRemoveParticipant}
                  onMarkPaid={handleMarkPaid}
                  members={members}
                />

                <button
                  onClick={() => setSelectedEvent(null)}
                  className="btn-ghost w-full text-sm"
                >
                  Đóng chi tiết
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
