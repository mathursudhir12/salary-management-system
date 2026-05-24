// Central model registry — import from here in services, tests, and routes.
// database.ts auto-discovers models in this directory via the models path option;
// these named exports make TypeScript imports clean everywhere else.

export { Employee, EmploymentType } from './Employee';
