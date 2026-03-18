/**
 * Shared Hooks Index
 * Central export point for all application hooks
 */

// Base hooks
export { useFetch } from './useFetch';
export type { UseFetchOptions } from './useFetch';

export { useMutation } from './useMutation';
export type { UseMutationOptions } from './useMutation';

// Auth
export { useAuth } from './useAuth';
export type { User as AuthUser } from './useAuth';

// Members
export { useMembers, useMember, useUpdateMember, useUpdateMemberBalance } from './useMembers';
export type { Member } from './useMembers';

// Months
export {
  useMonths,
  useMonth,
  useCreateMonth,
  useUpdateMonth,
  useCloseMonth,
} from './useMonths';
export type { Month } from './useMonths';

// Sessions
export {
  useSessions,
  useSession,
  useSessionAttendance,
  useCreateSession,
  useUpdateSession,
  useDeleteSession,
  useRecordAttendance,
} from './useSessions';
export type { Session, Attendance } from './useSessions';
