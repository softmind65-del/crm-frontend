import React from "react";

export type ColumnAlignment = "left" | "center" | "right";

export interface DataTableColumn<T> {
  readonly key: string;
  readonly header: React.ReactNode;
  readonly render: (row: T, index: number) => React.ReactNode;
  readonly className?: string;
  readonly headerClassName?: string;
  readonly align?: ColumnAlignment;
}

export interface DataTableProps<T> {
  readonly data: readonly T[];
  readonly columns: readonly DataTableColumn<T>[];
  readonly getRowKey: (row: T, index: number) => string | number;
  readonly emptyState?: React.ReactNode;
  readonly className?: string;
  readonly tableClassName?: string;
  readonly theadClassName?: string;
  readonly tbodyClassName?: string;
  readonly cellPaddingClassName?: string;
  readonly caption?: string;
}

function getAlignmentClass(align?: ColumnAlignment): string {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  emptyState,
  className = "",
  tableClassName = "",
  theadClassName,
  tbodyClassName,
  cellPaddingClassName,
  caption,
}: DataTableProps<T>) {
  return (
    <div
      className={`w-full bg-white border border-border-subtle rounded-xl overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className={`min-w-full text-left border-collapse text-sm ${tableClassName}`}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className={theadClassName ?? "bg-surface-soft/60 border-b border-border-subtle"}>
            <tr>
              {columns.map((col) => {
                const isHeaderColorSet = col.headerClassName?.includes("text-");
                const defaultHeaderColor = isHeaderColorSet ? "" : "text-foreground-dark";

                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap ${getAlignmentClass(
                      col.align
                    )} ${defaultHeaderColor} ${col.headerClassName ?? ""}`}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className={tbodyClassName ?? "divide-y divide-border-subtle bg-white"}>
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`${cellPaddingClassName ?? "px-4 py-2.5"} text-sm text-foreground-dark align-middle whitespace-nowrap ${getAlignmentClass(
                        col.align
                      )} ${col.className ?? ""}`}
                    >
                      {col.render(row, index)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (

              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  {emptyState ?? "No records found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
