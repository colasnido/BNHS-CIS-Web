"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  DataTable,
  DeleteAction,
  LinkAction,
  type Column,
  type BulkAction,
} from "@/components/dashboard/DataTable";
import { CSVImportModal } from "@/components/dashboard/CSVImportModal";
import type { User } from "@/features/users/types";
import type { ClassRecord } from "@/features/classes/types";

interface UsersAdminClientProps {
  users: User[];
  classes: ClassRecord[];
  /** If admin arrived via overview's "Import students" quick action, open the modal */
  autoOpenImport?: boolean;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "faculty", label: "Faculty" },
  { value: "student", label: "Student" },
];

const roleStyles: Record<string, string> = {
  admin: "border-rose-200 bg-rose-50 text-rose-700",
  faculty: "border-blue-200 bg-blue-50 text-blue-700",
  student: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function UsersAdminClient({
  users,
  classes,
  autoOpenImport = false,
}: UsersAdminClientProps) {
  const [importOpen, setImportOpen] = useState(autoOpenImport);
  const classMap = new Map(classes.map((c) => [c.id, c]));

  const columns: Column<User>[] = [
    {
      header: "Name",
      cell: (u) => (
        <div>
          <p className="font-medium text-slate-900">{u.displayName}</p>
          <p className="mt-0.5 text-xs text-slate-500 sm:hidden">{u.email}</p>
        </div>
      ),
      editable: { field: "displayName", type: "text" },
    },
    {
      header: "Email",
      cell: (u) => <span className="text-slate-600">{u.email}</span>,
      hideOnMobile: true,
    },
    {
      header: "Role",
      cell: (u) => (
        <span
          className={`inline-block rounded border px-2 py-0.5 text-xs font-medium capitalize ${roleStyles[u.role]}`}
        >
          {u.role}
        </span>
      ),
      editable: {
        field: "role",
        type: "select",
        options: ROLE_OPTIONS,
      },
    },
    {
      header: "Class / Dept",
      cell: (u) => {
        if (u.role === "student") {
          const cls = u.classId ? classMap.get(u.classId) : null;
          return cls ? (
            <span className="text-slate-600">
              Grade {cls.gradeLevel} - {cls.name}
            </span>
          ) : (
            <span className="text-amber-600">Unassigned</span>
          );
        }
        if (u.role === "faculty") {
          return <span className="text-slate-600">{u.department ?? "—"}</span>;
        }
        return <span className="text-slate-400">—</span>;
      },
      hideOnTablet: true,
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      label: "Delete",
      variant: "destructive",
      confirm: "Delete {n} user(s)? This cannot be undone.",
      onConfirm: async (ids) => {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/users/${id}`, { method: "DELETE" }).then((r) => {
              if (!r.ok) throw new Error("Failed");
            }),
          ),
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          throw new Error(
            `${failed} user${failed === 1 ? "" : "s"} could not be deleted`,
          );
        }
      },
    },
  ];

  return (
    <>
      <DashboardPageHeader
        title="Users"
        actions={
          <>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Import CSV
            </button>
            <Link
              href="/dashboard/admin/users/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New user
            </Link>
          </>
        }
      />

      <div className="px-4 pb-10 sm:px-6">
        <DataTable
          records={users}
          getKey={(u) => u.uid}
          searchFields={(u) => [u.displayName, u.email]}
          searchPlaceholder="Search by name or email..."
          filters={[{ key: "role", label: "Role", options: ROLE_OPTIONS }]}
          filterAccessor={(u, key) => (key === "role" ? u.role : "")}
          columns={columns}
          bulkActions={bulkActions}
          getEditEndpoint={(u) => `/api/users/${u.uid}`}
          rowActions={(u) => (
            <>
              <LinkAction
                href={`/dashboard/admin/users/${u.uid}/edit`}
                label="Edit"
              />
              <DeleteAction
                endpoint={`/api/users/${u.uid}`}
                itemLabel={u.displayName}
              />
            </>
          )}
          emptyTitle="No users yet"
          emptyMessage="Add your first faculty, student, or admin account, or import from CSV."
          emptyAction={
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Import CSV
              </button>
              <Link
                href="/dashboard/admin/users/new"
                className="rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                New user
              </Link>
            </div>
          }
        />
      </div>

      <CSVImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        config={{
          endpoint: "/api/users/import",
          itemLabel: "users",
          requiredColumns: ["email", "password", "display_name", "role"],
          knownColumns: [
            "email",
            "password",
            "display_name",
            "role",
            "class_section",
            "student_number",
            "grade_level",
            "department",
          ],
          templateRows: [
            {
              email: "maria.santos@bnhs.edu.ph",
              password: "changeMe123",
              display_name: "Maria Santos",
              role: "student",
              // Audit fix #6: refer to classes by name (admin-readable),
              // not by Firestore id. Resolver handles partial-name matching.
              class_section: classes[0]?.name ?? "St. Augustine",
              student_number: "2025-001",
              grade_level: classes[0] ? String(classes[0].gradeLevel) : "7",
              department: "",
            },
            {
              email: "jose.cruz@bnhs.edu.ph",
              password: "changeMe123",
              display_name: "Jose Cruz",
              role: "faculty",
              class_section: "",
              student_number: "",
              grade_level: "",
              department: "Mathematics",
            },
          ],
          validateRow: (row) => {
            if (!row.email || !row.email.includes("@")) {
              return "Invalid email";
            }
            if (!row.password || row.password.length < 8) {
              return "Password must be 8+ characters";
            }
            if (!row.display_name) return "Display name required";
            if (!["admin", "faculty", "student"].includes(row.role)) {
              return "Role must be admin, faculty, or student";
            }
            return null;
          },
        }}
      />
    </>
  );
}
