// Table composition and pagination adapted from shadcn-admin (MIT); see docs/third-party/shadcn-admin.md.
import { useMemo, useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./ui/table";
import { StatePanel } from "./common";
export type Column<T> = {
  key: keyof T & string;
  label: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
};
export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchLabel,
  filters = [],
  actions,
  initialSearch = "",
}: {
  data: T[];
  columns: Column<T>[];
  searchLabel: string;
  filters?: {
    key: keyof T & string;
    label: string;
    values: { value: string; label: string }[];
  }[];
  actions?: (row: T) => ReactNode;
  initialSearch?: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const defs = useMemo<ColumnDef<T>[]>(
    () => [
      ...columns.map((c) => ({
        accessorKey: c.key,
        header: c.label,
        enableSorting: c.sortable !== false,
        filterFn: "equalsString" as const,
        cell: ({ row }: { row: { original: T } }) =>
          c.render ? c.render(row.original) : String(row.original[c.key]),
      })),
      ...filters
        .filter((f) => !columns.some((c) => c.key === f.key))
        .map((f) => ({
          accessorKey: f.key,
          header: f.label,
          filterFn: "equalsString" as const,
          enableSorting: false,
        })),
      ...(actions
        ? [
            {
              id: "actions",
              header: "操作",
              enableSorting: false,
              cell: ({ row }: { row: { original: T } }) =>
                actions(row.original),
            },
          ]
        : []),
    ],
    [columns, actions, filters],
  );
  // TanStack Table intentionally exposes mutable methods; no React Compiler memoization is used here.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: defs,
    state: { sorting, globalFilter: search, columnFilters },
    onSortingChange: setSorting,
    sortDescFirst: false,
    onGlobalFilterChange: setSearch,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 8 },
      columnVisibility: Object.fromEntries(
        filters
          .filter((f) => !columns.some((c) => c.key === f.key))
          .map((f) => [f.key, false]),
      ),
    },
    globalFilterFn: (row) =>
      JSON.stringify(row.original)
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  });
  const count = table.getFilteredRowModel().rows.length;
  const filtered = search || columnFilters.length > 0;
  return (
    <div className="data-table">
      <div className="table-toolbar">
        <label className="search-input">
          <Search size={17} />
          <input
            type="search"
            aria-label={searchLabel}
            placeholder={searchLabel}
            value={search}
            onChange={(e) => {
              table.setPageIndex(0);
              setSearch(e.target.value);
            }}
          />
        </label>
        <div className="table-filters">
          {filters.map((f) => (
            <label key={f.key}>
              <span className="sr-only">{f.label}</span>
              <select
                aria-label={f.label}
                value={String(table.getColumn(f.key)?.getFilterValue() ?? "")}
                onChange={(e) => {
                  table.setPageIndex(0);
                  table
                    .getColumn(f.key)
                    ?.setFilterValue(e.target.value || undefined);
                }}
              >
                <option value="">全部{f.label}</option>
                {f.values.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {filtered && (
            <button
              className="text-btn"
              onClick={() => {
                setSearch("");
                setColumnFilters([]);
                table.setPageIndex(0);
              }}
            >
              <X size={15} />
              清除筛选
            </button>
          )}
        </div>
        <span className="row-count">{count} 条记录</span>
      </div>
      {count ? (
        <div
          className="table-scroll"
          role="region"
          aria-label="数据表格，可横向滚动"
          tabIndex={0}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((h) => (
                    <TableHead
                      key={h.id}
                      aria-sort={
                        h.column.getIsSorted() === "asc"
                          ? "ascending"
                          : h.column.getIsSorted() === "desc"
                            ? "descending"
                            : undefined
                      }
                    >
                      {h.column.getCanSort() ? (
                        <button
                          className="sort-btn"
                          onClick={h.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            h.column.columnDef.header,
                            h.getContext(),
                          )}
                          {h.column.getIsSorted() === "asc" ? (
                            <ArrowUp size={13} />
                          ) : h.column.getIsSorted() === "desc" ? (
                            <ArrowDown size={13} />
                          ) : (
                            <ArrowUpDown size={13} />
                          )}
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <StatePanel title={filtered ? "没有符合条件的记录" : "暂无演示记录"}>
          {filtered
            ? "尝试调整关键词或清除筛选。"
            : "可在顶部演示控制恢复样本，或新增演示配置。"}
        </StatePanel>
      )}
      <div className="pagination">
        <label>
          每页{" "}
          <select
            aria-label="每页条数"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[8, 16, 24].map((n) => (
              <option key={n} value={n}>
                {n} 条
              </option>
            ))}
          </select>
        </label>
        <span>
          第 {count ? table.getState().pagination.pageIndex + 1 : 0} /{" "}
          {table.getPageCount()} 页
        </span>
        <div className="pagination-buttons">
          <button
            className="icon-btn first-last"
            aria-label="第一页"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.firstPage()}
          >
            <ChevronsLeft size={17} />
          </button>
          <button
            className="icon-btn"
            aria-label="上一页"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft size={17} />
          </button>
          <button
            className="icon-btn"
            aria-label="下一页"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRight size={17} />
          </button>
          <button
            className="icon-btn first-last"
            aria-label="最后一页"
            disabled={!table.getCanNextPage()}
            onClick={() => table.lastPage()}
          >
            <ChevronsRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
