"use client";

import type { ColumnDef } from "@/lib/resource-config";

type ResourceTableProps = {
  columns: ColumnDef[];
  data: Record<string, string | number>[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export default function ResourceTable({
  columns,
  data,
  canCreate,
  canUpdate,
  canDelete,
}: ResourceTableProps) {
  const hasActions = canUpdate || canDelete;

  return (
    <div>
      {canCreate && (
        <div className="mb-4">
          <button
            onClick={() => alert("Sample data only — create is not connected to a backend")}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer"
          >
            + Create New
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-card-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-table-header">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="text-table-header-text text-left px-4 py-3 text-sm font-medium"
                  >
                    {col.label}
                  </th>
                ))}
                {hasActions && (
                  <th className="text-table-header-text text-left px-4 py-3 text-sm font-medium">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className={`border-t border-card-border ${
                    idx % 2 === 1 ? "bg-table-stripe" : ""
                  } hover:bg-gray-50 transition-colors`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm">
                      {col.key === "status" ? (
                        <StatusBadge value={String(row[col.key])} />
                      ) : (
                        row[col.key]
                      )}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        {canUpdate && (
                          <button
                            onClick={() =>
                              alert("Sample data only — edit is not connected to a backend")
                            }
                            className="bg-accent hover:bg-primary text-white px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() =>
                              alert("Sample data only — delete is not connected to a backend")
                            }
                            className="bg-danger hover:bg-danger-hover text-white px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-card-border px-4 py-2 text-xs text-gray-500">
          Showing {data.length} of {data.length} items
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    Active: "bg-green-100 text-green-700",
    Paid: "bg-green-100 text-green-700",
    Completed: "bg-green-100 text-green-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Processing: "bg-blue-100 text-blue-700",
    Overdue: "bg-red-100 text-red-700",
    Inactive: "bg-gray-100 text-gray-600",
    Suspended: "bg-red-100 text-red-700",
    Disconnected: "bg-red-100 text-red-700",
    Draft: "bg-gray-100 text-gray-600",
    Paused: "bg-yellow-100 text-yellow-700",
    Yes: "bg-green-100 text-green-700",
    No: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
        colors[value] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {value}
    </span>
  );
}
