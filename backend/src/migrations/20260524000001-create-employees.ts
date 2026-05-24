import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: create employees table
 *
 * All schema changes must go through migrations — never sync({ force: true }) in production.
 * The down() function drops the table and the PostgreSQL ENUM type that Sequelize creates
 * automatically; on SQLite (test env) the DROP TYPE is a no-op.
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('employees', {
    id: {
      type:         DataTypes.UUID,
      primaryKey:   true,
      allowNull:    false,
      // defaultValue set on the JS side via the model; no DB-level default needed
    },

    fullName: {
      type:      DataTypes.STRING,
      allowNull: false,
    },

    jobTitle: {
      type:      DataTypes.STRING,
      allowNull: false,
    },

    country: {
      type:      DataTypes.STRING,
      allowNull: false,
    },

    department: {
      type:      DataTypes.STRING,
      allowNull: false,
    },

    salary: {
      type:      DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    currency: {
      type:         DataTypes.STRING(3),
      allowNull:    false,
      defaultValue: 'USD',
    },

    employmentType: {
      type:      DataTypes.ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT'),
      allowNull: false,
    },

    joinDate: {
      type:      DataTypes.DATEONLY,
      allowNull: false,
    },

    createdAt: {
      type:      DataTypes.DATE,
      allowNull: false,
    },

    updatedAt: {
      type:      DataTypes.DATE,
      allowNull: false,
    },
  });

  // Add indexes to speed up the insight queries (country, department, jobTitle filters)
  await queryInterface.addIndex('employees', ['country'],    { name: 'idx_employees_country' });
  await queryInterface.addIndex('employees', ['department'], { name: 'idx_employees_department' });
  await queryInterface.addIndex('employees', ['jobTitle'],   { name: 'idx_employees_job_title' });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('employees');

  // PostgreSQL auto-creates an ENUM type; drop it for a clean rollback.
  // getDialect() returns 'sqlite' in the test environment — skip the DROP TYPE there.
  if (queryInterface.sequelize.getDialect() === 'postgres') {
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_employees_employmentType";'
    );
  }
}
