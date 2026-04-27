"use client";

import { Column } from "@/app/components/admin/EnhancedTable";
import { Input } from "@/components/ui/input";
import { Box, Typography } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridRowId,
  GridSortModel,
  GridValidRowModel,
  GridToolbar,
} from "@mui/x-data-grid";
import { Search } from "lucide-react";
import { useMemo } from "react";

type SortDirection = "asc" | "desc" | null;

type AdminDataGridProps<T extends GridValidRowModel> = {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => GridRowId;
  loading?: boolean;
  emptyMessage?: string;
  showSearchInput?: boolean;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  currentPage: number;
  pageSize: number;
  pageSizeOptions?: number[];
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  paginationMode?: "server" | "client";
  sortingMode?: "server" | "client";
  sortField?: string | null;
  sortDirection?: SortDirection;
  onSortChange?: (field: string | null, direction: SortDirection) => void;
  checkboxSelection?: boolean;
  rowSelectionModel?: GridRowSelectionModel;
  onRowSelectionModelChange?: (model: GridRowSelectionModel) => void;
  filterMode?: "server" | "client";
  filterModel?: any; // GridFilterModel
  onFilterModelChange?: (model: any) => void;
  disableColumnFilter?: boolean;
};

const getColumnMinWidth = (column: { key: string; header: string }) => {
  if (column.key === "actions") {
    return 220;
  }

  if (column.header.length >= 18) {
    return 220;
  }

  if (column.header.length >= 12) {
    return 180;
  }

  return 150;
};

export function AdminDataGrid<T extends GridValidRowModel>({
  rows,
  columns,
  getRowId,
  loading = false,
  emptyMessage = "No rows found",
  showSearchInput = false,
  searchPlaceholder = "Search...",
  searchQuery = "",
  onSearchQueryChange,
  currentPage,
  pageSize,
  pageSizeOptions = [10, 25, 50],
  totalItems,
  onPageChange,
  onPageSizeChange,
  paginationMode = "server",
  sortingMode = "server",
  sortField = null,
  sortDirection = null,
  onSortChange,
  checkboxSelection = false,
  rowSelectionModel,
  onRowSelectionModelChange,
  filterMode = "client",
  filterModel,
  onFilterModelChange,
  disableColumnFilter = false,
}: AdminDataGridProps<T>) {
  const gridColumns = useMemo<GridColDef<T>[]>(
    () =>
      columns.map((column) => ({
        field: column.key,
        headerName: column.header,
        sortable: Boolean(column.sortable),
        minWidth: getColumnMinWidth(column),
        flex: column.key === "actions" ? 0 : 1,
        // When the column key does not directly match a field on the row (e.g. "name"
        // is computed from first_name + last_name), supply a valueGetter so MUI can
        // use it for built-in quick-filter, sorting, and export without breaking renderCell.
        ...(column.valueGetter
          ? {
              valueGetter: (_value: unknown, row: T) =>
                column.valueGetter!(row),
            }
          : {}),
        renderCell: (params: GridRenderCellParams<T>) => {
          if (column.render) {
            return (
              <Box
                sx={{
                  alignItems: "center",
                  display: "flex",
                  minHeight: "100%",
                  py: 0.5,
                  width: "100%",
                }}
              >
                {column.render(params.value, params.row)}
              </Box>
            );
          }

          const value =
            column.exportValue?.(params.row) ??
            params.row[column.key as keyof T] ??
            "";

          return (
            <span className="block truncate text-sm text-slate-700">
              {String(value)}
            </span>
          );
        },
      })),
    [columns],
  );

  const paginationModel = useMemo<GridPaginationModel>(
    () => ({
      page: Math.max(currentPage - 1, 0),
      pageSize,
    }),
    [currentPage, pageSize],
  );

  const sortModel = useMemo<GridSortModel>(
    () =>
      sortField && sortDirection
        ? [{ field: sortField, sort: sortDirection }]
        : [],
    [sortDirection, sortField],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {showSearchInput ? (
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchQueryChange?.(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
        ) : (
          <div />
        )}
        <Typography
          component="p"
          sx={{ color: "#475569", fontSize: "0.875rem", fontWeight: 500 }}
        >
          {totalItems.toLocaleString()} results
        </Typography>
      </div>

      <Box
        sx={{
          "& .MuiDataGrid-cell": {
            alignItems: "center",
            borderColor: "#f1f5f9",
            display: "flex",
            py: 1,
          },
          "& .MuiDataGrid-columnHeader": {
            backgroundColor: "#f8fafc",
            borderBottomColor: "#e2e8f0",
            color: "#475569",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          },
          "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus": {
            outline: "none",
          },
          "& .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-cell:focus-within":
            {
              outline: "none",
            },
          "& .MuiDataGrid-footerContainer": {
            borderTopColor: "#e2e8f0",
          },
          "& .MuiDataGrid-overlay": {
            backgroundColor: "#ffffff",
          },
          "& .MuiDataGrid-row": {
            backgroundColor: "#ffffff",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#f8fafc",
          },
          border: "1px solid #e5e7eb",
          borderRadius: 4,
          height: {
            xs: 560,
            md: 680,
          },
          overflow: "hidden",
          width: "100%",
        }}
      >
        <DataGrid
          rows={rows}
          columns={gridColumns}
          getRowId={getRowId}
          loading={loading}
          disableRowSelectionOnClick
          checkboxSelection={checkboxSelection}
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={(model) =>
            onRowSelectionModelChange?.(model)
          }
          keepNonExistentRowsSelected
          pagination
          paginationMode={paginationMode}
          sortingMode={sortingMode}
          rowCount={totalItems}
          pageSizeOptions={pageSizeOptions}
          paginationModel={paginationModel}
          onPaginationModelChange={(model) => {
            if (model.pageSize !== pageSize) {
              onPageSizeChange(model.pageSize);
            }

            if (model.page !== paginationModel.page) {
              onPageChange(model.page + 1);
            }
          }}
          {...(sortingMode === "server"
            ? {
                sortModel,
                onSortModelChange: (model: GridSortModel) => {
                  const nextSort = model[0];
                  onSortChange?.(
                    nextSort?.field ?? null,
                    (nextSort?.sort as SortDirection | undefined) ?? null,
                  );
                },
              }
            : {})}
          filterMode={filterMode}
          filterModel={filterModel}
          onFilterModelChange={onFilterModelChange}
          disableDensitySelector
          disableColumnFilter={disableColumnFilter}
          rowHeight={76}
          showToolbar
          slots={{
            toolbar: GridToolbar,
          }}
          sx={{
            "& .MuiDataGrid-toolbarContainer": {
              borderBottom: "1px solid #e2e8f0",
              gap: 1,
              p: 1.25,
            },
            border: 0,
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: !showSearchInput,
              quickFilterProps: {
                debounceMs: 300,
              },
            },
            pagination: {
              labelRowsPerPage: "Rows",
            },
          }}
          localeText={{
            noRowsLabel: emptyMessage,
            noResultsOverlayLabel: emptyMessage,
          }}
        />
      </Box>
    </div>
  );
}
