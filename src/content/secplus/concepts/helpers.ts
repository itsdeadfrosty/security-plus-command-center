import type { ExamVersion } from "@/lib/types";

/** Objective mapping shorthand: o("2.3", "2.5") -> { SY0-701: "2.3", SY0-801: "2.5" }. Pass undefined for "not on that exam". */
export function o(v701?: string, v801?: string): Partial<Record<ExamVersion, string>> {
  const m: Partial<Record<ExamVersion, string>> = {};
  if (v701) m["SY0-701"] = v701;
  if (v801) m["SY0-801"] = v801;
  return m;
}
