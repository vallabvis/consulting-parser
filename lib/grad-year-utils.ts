import type { RoleType } from './types'

/**
 * Returns which role types a student is realistically eligible for, given their
 * expected graduation year and the current date.
 *
 * Academic-year model:
 *   Aug–Dec of calendar year Y  →  academic year ends May (Y+1)
 *   Jan–Jul of calendar year Y  →  academic year ends May Y
 *
 * Examples at April 2026 (academicYearEnd = 2026):
 *   gradYear 2029 → freshman   (yearsToGrad = 3) → freshman_program, diversity_program, case_competition
 *   gradYear 2028 → sophomore  (yearsToGrad = 2) → sophomore_program, diversity_program, summer_internship (early), case_competition
 *   gradYear 2027 → junior     (yearsToGrad = 1) → summer_internship, diversity_program, case_competition
 *   gradYear 2026 → senior     (yearsToGrad = 0) → full_time, case_competition
 */
export function getEligibleRoleTypes(gradYear: number, currentDate: Date): RoleType[] {
  const month = currentDate.getMonth() + 1 // 1-indexed
  const year = currentDate.getFullYear()

  // The academic year we're currently in ends in May of:
  const academicYearEnd = month >= 8 ? year + 1 : year

  // How many full academic years remain before this student graduates
  const yearsToGrad = gradYear - academicYearEnd

  // Everyone can participate in these
  const eligible: RoleType[] = ['case_competition', 'networking_event']

  if (yearsToGrad <= 0) {
    // Senior or recently graduated — full-time recruiting is the target
    eligible.push('full_time')
  } else if (yearsToGrad === 1) {
    // Junior: the main summer-internship recruiting cycle
    eligible.push('summer_internship', 'diversity_program')

    // Some firms open full-time applications in spring of junior year
    if (month >= 3) {
      eligible.push('full_time')
    }
  } else if (yearsToGrad === 2) {
    // Sophomore: sophomore programs + early-bird internship apps
    // "Early recruit" summer internship programs exist for high-achieving sophomores
    eligible.push('sophomore_program', 'diversity_program', 'summer_internship')
  } else if (yearsToGrad === 3) {
    // Freshman: limited options, mostly pipeline/diversity programs
    eligible.push('freshman_program', 'diversity_program')
  } else {
    // Pre-college edge case — only diversity programs apply
    eligible.push('diversity_program')
  }

  return [...new Set(eligible)]
}

/**
 * Returns a human-readable class year label for a given grad year and date.
 * e.g. getClassYearLabel(2027, new Date('2026-04-01')) → "Junior ('27)"
 */
export function getClassYearLabel(gradYear: number, currentDate: Date): string {
  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()
  const academicYearEnd = month >= 8 ? year + 1 : year
  const yearsToGrad = gradYear - academicYearEnd

  const shortYear = String(gradYear).slice(2)
  const labels: Record<number, string> = {
    0: `Senior ('${shortYear})`,
    1: `Junior ('${shortYear})`,
    2: `Sophomore ('${shortYear})`,
    3: `Freshman ('${shortYear})`,
  }
  return labels[yearsToGrad] ?? `'${shortYear}`
}
