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
      setError(err instanceof Error ? err.message : 'Loi tai du lieu');
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
      const data = await res.json();
      alert(data.error?.message || 'Khong the xoa');
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
      alert(data.error?.message || 'Loi tinh tien');
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
      alert(data.error?.message || 'Loi them nguoi');
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
      alert(data.error?.message || 'Loi xoa nguoi');
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
      alert(data.error?.message || 'Loi xac nhan');
      return;
    }
    await fetchEventDetail(selectedEvent.id);
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-red-600">{error}</p>
        <button onClick={fetchEvents} className="btn-primary mt-4">
          Thu lai
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Su kien</h1>
          <p className="mt-1 text-sm text-slate-600">
            Quan ly su kien, giai dau va lien hoan.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            setShowForm(true);
          }}
          className="btn-primary"
        >
          Tao su kien
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="surface-card-soft p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {editingEvent ? 'Cap nhat su kien' : 'Tao su kien moi'}
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
            <div className="py-12 text-center">
              <p className="text-lg text-slate-500">Chua co su kien nao</p>
              <p className="mt-1 text-sm text-slate-400">
                Nhan &quot;Tao su kien&quot; de bat dau.
              </p>
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
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {selectedEvent.event_name}
                    </h2>
                    <p className="text-sm text-slate-500">
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
                      Sua
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                      Xoa
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
                  className="btn-secondary w-full text-sm"
                >
                  Dong chi tiet
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
