// Teachers are encoded as the trailing segment of class_sections.section_code
// (convention: <CLASS><AM|PM>-<TERM>-<TEACHER>). Until teachers have real
// profile rows + auth accounts, we map the suffix to a display name here.

export const TEACHERS = {
  MDiGeorge: "Marco DiGeorge",
  RMauss: "Rob Mauss",
  DClark: "David Clark",
} as const

export type TeacherCode = keyof typeof TEACHERS

export function teacherFromSectionCode(sectionCode: string): string | null {
  const suffix = sectionCode.split("-").at(-1)
  if (!suffix) return null
  return (TEACHERS as Record<string, string>)[suffix] ?? null
}
