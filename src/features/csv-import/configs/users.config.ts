import type { ImportConfig } from '@/lib/csv/import-config';
import {
  normalizeEmail,
  normalizePersonName,
  normalizeRole,
  normalizeFreeText,
  normalizeGradeLevel,
  normalizeLrn,
} from '@/lib/csv/normalizers';

/**
 * Users dataset import config.
 *
 * Required fields by role:
 *   - All:     displayName, role, password
 *   - Student: studentNumber (LRN, 12 digits)
 *   - Faculty: email
 *   - Admin:   email
 *
 * The required-field check at the column-mapping stage catches the union
 * of all roles' requirements (so admin maps studentNumber-or-email with
 * either acceptable). Per-row normalization figures out which role each
 * row is and validates accordingly.
 */
interface NormalizedUserRow {
  role: 'admin' | 'faculty' | 'student';
  displayName: string;
  password: string;
  email?: string;
  studentNumber?: string;
  classSection?: string;
  gradeLevel?: number;
  department?: string;
}

export const usersImportConfig: ImportConfig<NormalizedUserRow> = {
  datasetLabel: 'Users',
  itemNoun: { singular: 'user', plural: 'users' },

  fields: [
    {
      key: 'displayName',
      label: 'Full Name',
      required: true,
      aliases: [
        'name',
        'full name',
        'student name',
        'faculty name',
        'teacher name',
        'fullname',
        'display name',
        'displayname',
      ],
      hint: 'The person’s full name as it should appear in the system.',
    },
    {
      key: 'role',
      label: 'Role',
      required: true,
      aliases: ['role', 'type', 'user type', 'usertype', 'account type'],
      hint: 'Either student, faculty, or admin. Variations like "teacher" or "learner" are accepted.',
    },
    {
      key: 'password',
      label: 'Initial Password',
      required: true,
      aliases: [
        'password',
        'initial password',
        'temporary password',
        'temp password',
        'pw',
        'pass',
      ],
      hint: 'The starting password for this account. Users will be prompted to change it on first login.',
    },
    {
      key: 'email',
      label: 'Email',
      // Required for faculty/admin only; row-level normalization enforces
      // this. At the column-mapping stage we leave this not-required so
      // student-only imports don't get blocked.
      required: false,
      aliases: [
        'email',
        'email address',
        'e-mail',
        'mail',
        'school email',
        'work email',
      ],
      hint: 'Required for faculty and admin. Students don’t need this — they use their LRN.',
    },
    {
      key: 'studentNumber',
      label: 'Student Number (LRN)',
      required: false,
      aliases: [
        'studentnumber',
        'student number',
        'student id',
        'studentid',
        'id',
        'id number',
        'lrn',
        'learner reference number',
        'learner reference no',
        'learner id',
      ],
      hint: '12-digit LRN. Required for students; ignored for faculty/admin.',
    },
    {
      key: 'classSection',
      label: 'Class Section',
      required: false,
      aliases: [
        'classsection',
        'class section',
        'section',
        'class',
        'class name',
        'classname',
      ],
      hint: 'For students only. The section name as configured in Classes (e.g., "St. Augustine").',
    },
    {
      key: 'gradeLevel',
      label: 'Grade Level',
      required: false,
      aliases: [
        'gradelevel',
        'grade level',
        'grade',
        'year level',
        'yearlevel',
        'year',
        'level',
      ],
      hint: 'For students. A number 7–12. Accepts "Grade 7", "G7", "7th".',
    },
    {
      key: 'department',
      label: 'Department',
      required: false,
      aliases: [
        'department',
        'dept',
        'subject area',
        'discipline',
        'division',
      ],
      hint: 'For faculty. Free text (e.g., "Mathematics", "English").',
    },
  ],

  /**
   * Normalize one row. The `raw` argument has canonical field keys
   * (because the mapper has already remapped CSV columns to canonical names),
   * so we just need to convert each value.
   */
  normalizeRow(raw) {
    // Step 1: role (drives which other fields are required)
    const roleRaw = raw.role?.trim();
    if (!roleRaw) {
      return { ok: false, error: 'Role is required' };
    }
    const role = normalizeRole(roleRaw);
    if (!role) {
      return {
        ok: false,
        error: `Unknown role "${roleRaw}". Use student, faculty, or admin.`,
      };
    }

    // Step 2: name + password (always required)
    const displayName = raw.displayName ? normalizePersonName(raw.displayName) : '';
    if (!displayName) {
      return { ok: false, error: 'Full name is required' };
    }
    const password = raw.password?.trim();
    if (!password) {
      return { ok: false, error: 'Initial password is required' };
    }
    if (password.length < 8) {
      return {
        ok: false,
        error: 'Password must be at least 8 characters',
      };
    }

    // Step 3: role-specific fields
    if (role === 'student') {
      const lrnRaw = raw.studentNumber?.trim();
      if (!lrnRaw) {
        return {
          ok: false,
          error: 'Student number (LRN) is required for student rows',
        };
      }
      const lrn = normalizeLrn(lrnRaw);
      if (!lrn) {
        return {
          ok: false,
          error: `Student number "${lrnRaw}" is not a valid 12-digit LRN`,
        };
      }

      const row: NormalizedUserRow = {
        role,
        displayName,
        password,
        studentNumber: lrn,
      };
      if (raw.classSection) row.classSection = normalizeFreeText(raw.classSection);
      if (raw.gradeLevel) {
        const gl = normalizeGradeLevel(raw.gradeLevel);
        if (gl !== null) row.gradeLevel = gl;
      }
      return { ok: true, row };
    }

    // Faculty or admin
    const email = raw.email ? normalizeEmail(raw.email) : '';
    if (!email) {
      return {
        ok: false,
        error: `Email is required for ${role} rows`,
      };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        ok: false,
        error: `Email "${email}" is not a valid email address`,
      };
    }

    const row: NormalizedUserRow = { role, displayName, password, email };
    if (role === 'faculty' && raw.department) {
      row.department = normalizeFreeText(raw.department);
    }
    return { ok: true, row };
  },

  apiEndpoint: '/api/csv-import/users',

  templateCsv: `display_name,email,password,role,student_number,class_section,grade_level,department
Jose Cruz,jose.cruz@bnhs.edu.ph,changeMe123,faculty,,,,Mathematics
Maria Santos,,changeMe123,student,117964180001,St. Augustine,7,
Pedro Penduko,admin@bnhs.edu.ph,changeMe123,admin,,,,
`,
};
