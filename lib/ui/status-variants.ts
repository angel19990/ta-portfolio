import type { CastingCallStatus } from "@/lib/db/casting-calls";
import type { ApplicationStatus } from "@/lib/db/casting-applications";
import type { StudentStatus } from "@/lib/db/students";

// Shared status-variant maps for shadcn Badge.
// All four are kept here so future status types extend the same vocabulary.

export type StatusBadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "success"
  | "warning"
  | "info"
  | "neutral";

export const CASTING_CALL_STATUS_VARIANT: Record<
  CastingCallStatus,
  StatusBadgeVariant
> = {
  open: "success",
  draft: "warning",
  closed: "neutral",
  archived: "neutral",
};

export const CASTING_CALL_STATUS_LABEL: Record<CastingCallStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  archived: "Archived",
};

export const APPLICATION_STATUS_VARIANT: Record<
  ApplicationStatus,
  StatusBadgeVariant
> = {
  submitted: "info",
  shortlisted: "success",
  rejected: "neutral",
  withdrawn: "neutral",
};

export const STUDENT_STATUS_VARIANT: Record<
  StudentStatus,
  StatusBadgeVariant
> = {
  inactive: "neutral",
  pending_approval: "warning",
  approved: "success",
  private: "outline",
};

export const STUDENT_STATUS_LABEL: Record<StudentStatus, string> = {
  inactive: "Inactive",
  pending_approval: "Pending approval",
  approved: "Approved",
  private: "Private",
};
