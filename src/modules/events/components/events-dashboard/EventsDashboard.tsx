"use client";

import { EventDetailPanel } from "@/modules/events/components/events-dashboard/EventDetailPanel";
import { EventsErrorState } from "@/modules/events/components/events-dashboard/EventsErrorState";
import { EventsFormSection } from "@/modules/events/components/events-dashboard/EventsFormSection";
import { EventsHeader } from "@/modules/events/components/events-dashboard/EventsHeader";
import { EventsListPanel } from "@/modules/events/components/events-dashboard/EventsListPanel";
import { EventsLoadingState } from "@/modules/events/components/events-dashboard/EventsLoadingState";
import { useEventsDashboard } from "@/modules/events/hooks/useEventsDashboard";

export function EventsDashboard() {
  const {
    events,
    loading,
    error,
    showForm,
    editingEvent,
    selectedEvent,
    detailLoading,
    members,
    formLoading,
    fetchEvents,
    openCreateForm,
    openEditForm,
    closeForm,
    closeDetail,
    handleCardClick,
    submitEventForm,
    deleteEvent,
    settleSelectedEvent,
    addParticipants,
    removeParticipant,
    markParticipantPaid,
  } = useEventsDashboard();

  if (loading) {
    return <EventsLoadingState />;
  }

  if (error) {
    return <EventsErrorState error={error} onRetry={fetchEvents} />;
  }

  return (
    <div className="space-y-6">
      <EventsHeader onCreateEvent={openCreateForm} />

      <EventsFormSection
        showForm={showForm}
        editingEvent={editingEvent}
        loading={formLoading}
        onSubmit={submitEventForm}
        onCancel={closeForm}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <EventsListPanel events={events} onEventClick={handleCardClick} />

        <EventDetailPanel
          selectedEvent={selectedEvent}
          detailLoading={detailLoading}
          members={members}
          onEdit={openEditForm}
          onDelete={deleteEvent}
          onClose={closeDetail}
          onSettle={settleSelectedEvent}
          onAddParticipants={addParticipants}
          onRemoveParticipant={removeParticipant}
          onMarkPaid={markParticipantPaid}
        />
      </div>
    </div>
  );
}
