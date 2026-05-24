/**
 * Frontend mirror of the backend Employee model + API response shapes.
 *
 * Note: PostgreSQL DECIMAL columns are serialised as strings by the pg driver.
 * Wherever a salary value is displayed or compared numerically, wrap it in
 * Number() to normalise string → number.
 */

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT'

export interface Employee {
  id:             string
  fullName:       string
  jobTitle:       string
  country:        string
  department:     string
  salary:         number | string   // DECIMAL from PostgreSQL may arrive as string
  currency:       string
  employmentType: EmploymentType
  joinDate:       string
  createdAt:      string
  updatedAt:      string
}

/** Shape returned by GET /api/employees */
export interface PaginatedEmployees {
  data:       Employee[]
  total:      number
  page:       number
  totalPages: number
}

/** Parameters accepted by useEmployees / GET /api/employees */
export interface EmployeeQueryParams {
  page:    number
  limit:   number
  search?: string
}
