/**
 * TypeScript mirror of the backend /api/insights response shape.
 *
 * All numeric fields from Sequelize DECIMAL columns may arrive as strings
 * from the pg driver — the backend normalises them with Number(), so they
 * arrive here as numbers. avgSalaryForTitle is the only primitive number
 * at the top level.
 */

export interface CountryHeadcount {
  country:   string
  headcount: number
}

export interface JobTitleAvgSalary {
  jobTitle:  string
  avgSalary: number
}

export interface DepartmentAvgSalary {
  department: string
  avgSalary:  number
}

/** Min / Max / Avg salary + headcount for one country */
export interface CountryStats {
  min:       number
  max:       number
  avg:       number
  headcount: number
}

/**
 * Shape of the `data` object inside GET /api/insights response.
 *
 * Always present:
 *   headcountByCountry, topPaidJobTitles, salaryByDepartment
 *
 * Present when ?country=X is supplied:
 *   countryInsights, avgSalaryByTitle
 *
 * Present when ?country=X&jobTitle=Y is supplied:
 *   avgSalaryForTitle
 */
export interface InsightsData {
  headcountByCountry: CountryHeadcount[]
  topPaidJobTitles:   JobTitleAvgSalary[]
  salaryByDepartment: DepartmentAvgSalary[]
  countryInsights?:   CountryStats
  avgSalaryByTitle?:  JobTitleAvgSalary[]
  avgSalaryForTitle?: number
}

/** Top-level envelope: { data: InsightsData } */
export interface InsightsApiResponse {
  data: InsightsData
}
