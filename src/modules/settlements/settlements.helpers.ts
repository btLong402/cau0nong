import { EventParticipant, Session, SessionAttendance, ShuttlecockDetail } from "@/lib/types";
import { createEventParticipantsRepository } from "@/modules/events/event-participants.repository";
import { createEventsRepository } from "@/modules/events/events.repository";
import { createShuttlecocksRepository } from "@/modules/shuttlecocks/shuttlecocks.repository";

export async function getAttendanceForSessions(
  sessions: Session[],
  sessionsService: { getSessionAttendance: (sessionId: number) => Promise<SessionAttendance[]> },
): Promise<SessionAttendance[]> {
  const chunks = await Promise.all(
    sessions.map((session) => sessionsService.getSessionAttendance(session.id)),
  );

  return chunks.flat();
}

export function getParticipantIds(attendances: SessionAttendance[]): string[] {
  const ids = new Set<string>();

  for (const row of attendances) {
    if (row.is_attended) {
      ids.add(row.user_id);
    }
  }

  return Array.from(ids);
}

export async function getShuttlecockDetails(monthId: number): Promise<ShuttlecockDetail[]> {
  try {
    const repository = await createShuttlecocksRepository();
    return await repository.findByMonth(monthId);
  } catch {
    return [];
  }
}

export async function getEventParticipantsForMonth(monthId: number): Promise<EventParticipant[]> {
  try {
    const eventsRepo = await createEventsRepository();
    const participantsRepo = await createEventParticipantsRepository();

    const eventIds = await eventsRepo.findIdsByMonth(monthId);
    if (eventIds.length === 0) {
      return [];
    }

    const participantsList = await Promise.all(
      eventIds.map((eventId) => participantsRepo.findByEvent(eventId)),
    );

    return participantsList.flat();
  } catch {
    return [];
  }
}
