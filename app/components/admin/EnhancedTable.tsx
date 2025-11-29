"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  MoreVertical,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FilterBuilder, FilterCondition } from "./FilterBuilder";
import { ExportButton } from "./ExportButton";
import { Filter } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  filterable?: boolean;
  visible?: boolean; // For column visibility
}

export interface BulkAction<T> {
  label: string;
  icon?: React.ReactNode;
  action: (selectedItems: T[]) => void | Promise<void>;
  variant?: "default" | "destructive" | "outline";
  requiresConfirmation?: boolean;
}

interface EnhancedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: boolean;
  itemsPerPage?: number;
  pageSizeOptions?: number[];
  exportable?: boolean;
  onExport?: (data: T[]) => void;
  loading?: boolean;
  emptyMessage?: string;
  selectable?: boolean; // Enable row selection
  getRowId?: (row: T) => string | number; // Function to get unique ID for each row
  bulkActions?: BulkAction<T>[]; // Bulk action menu items
  onSelectionChange?: (selectedItems: T[]) => void; // Callback when selection changes
  enableFilterBuilder?: boolean; // Enable custom filter builder
  enableColumnSelection?: boolean; // Enable column selection for export
  mobileCardView?: boolean; // Enable card view on mobile
  renderMobileCard?: (row: T) => React.ReactNode; // Custom card renderer
  cardBreakpoint?: number; // Viewport width to switch to cards
}

type SortDirection = "asc" | "desc" | null;

export function EnhancedTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = "Search...",
  pagination = true,
  itemsPerPage = 10,
  pageSizeOptions = [10, 25, 50],
  exportable = false,
  onExport,
  loading = false,
  emptyMessage = "No data found",
  selectable = false,
  getRowId,
  bulkActions = [],
  onSelectionChange,
  enableFilterBuilder = false,
  enableColumnSelection = false,
  mobileCardView = false,
  renderMobileCard,
  cardBreakpoint = 768,
}: EnhancedTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(itemsPerPage);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(
    new Set(),
  );
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map((col) => col.key)),
  );
  const [customFilters, setCustomFilters] = useState<FilterCondition[]>([]);
  const [filterLogic, setFilterLogic] = useState<"AND" | "OR">("AND");
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [savedPresets, setSavedPresets] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Track viewport width to toggle card view on mobile
  useEffect(() => {
    if (!mobileCardView) return;

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const checkMobile = () => {
      const isSmall = window.innerWidth < (cardBreakpoint || 768);
      setIsMobile(isSmall);
    };

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkMobile, 150);
    };

    checkMobile();
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [mobileCardView, cardBreakpoint]);

  // Filter visible columns
  const displayColumns = useMemo(() => {
    return columns.filter((col) => visibleColumns.has(col.key));
  }, [columns, visibleColumns]);

  // Get row ID helper
  const getRowIdentifier = useCallback(
    (row: T, index: number): string | number => {
      if (getRowId) {
        return getRowId(row);
      }
      // Fallback to index or common ID fields
      return (row.id || row.user_id || row.userid || index) as string | number;
    },
    [getRowId],
  );

  // Load saved presets from localStorage
  useEffect(() => {
    if (enableFilterBuilder) {
      try {
        const saved = localStorage.getItem("filterPresets");
        if (saved) {
          setSavedPresets(JSON.parse(saved));
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [enableFilterBuilder]);

  // Apply custom filters to data
  const applyCustomFilters = useCallback(
    (rows: T[], conditions: FilterCondition[], logic: "AND" | "OR"): T[] => {
      if (conditions.length === 0) return rows;

      return rows.filter((row) => {
        const results = conditions.map((condition) => {
          const value = row[condition.column];
          const filterValue = condition.value;

          switch (condition.operator) {
            case "equals":
              return String(value) === String(filterValue);
            case "contains":
              return String(value)
                .toLowerCase()
                .includes(String(filterValue).toLowerCase());
            case "startsWith":
              return String(value)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase());
            case "endsWith":
              return String(value)
                .toLowerCase()
                .endsWith(String(filterValue).toLowerCase());
            case "greaterThan":
              return Number(value) > Number(filterValue);
            case "lessThan":
              return Number(value) < Number(filterValue);
            case "between":
              if (Array.isArray(filterValue) && filterValue.length === 2) {
                return (
                  Number(value) >= Number(filterValue[0]) &&
                  Number(value) <= Number(filterValue[1])
                );
              }
              return false;
            case "in":
              if (Array.isArray(filterValue)) {
                return filterValue.includes(String(value));
              }
              return false;
            default:
              return true;
          }
        });

        return logic === "AND" ? results.every(Boolean) : results.some(Boolean);
      });
    },
    []
  );

  // Filter data based on search query and custom filters
  const filteredData = useMemo(() => {
    let result = data;

    // Apply search query
    if (searchQuery) {
      result = result.filter((row) => {
        return displayColumns.some((col) => {
          const value = row[col.key];
          if (value === null || value === undefined) return false;
          return String(value)
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        });
      });
    }

    // Apply custom filters
    if (customFilters.length > 0) {
      result = applyCustomFilters(result, customFilters, filterLogic);
    }

    return result;
  }, [
    data,
    searchQuery,
    displayColumns,
    customFilters,
    filterLogic,
    applyCustomFilters,
  ]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!filteredData) return [];
    if (!sortColumn || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison =
        typeof aValue === "string"
          ? aValue.localeCompare(String(bValue))
          : aValue - bValue;

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!sortedData) return [];
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil((filteredData?.length || 0) / pageSize) || 1;

  // Get selected items
  const selectedItems = useMemo(() => {
    if (!filteredData) return [];
    return filteredData.filter((row, index) =>
      selectedRows.has(getRowIdentifier(row, index)),
    );
  }, [filteredData, selectedRows, getRowIdentifier]);

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedItems);
    }
  }, [selectedItems, onSelectionChange]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const handleSelectRow = (row: T, index: number) => {
    const rowId = getRowIdentifier(row, index);
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      const allIds = new Set(
        paginatedData.map((row, index) => getRowIdentifier(row, index)),
      );
      setSelectedRows(allIds);
    }
  };

  const isAllSelected = useMemo(() => {
    return (
      paginatedData.length > 0 &&
      paginatedData.every((row, index) =>
        selectedRows.has(getRowIdentifier(row, index)),
      )
    );
  }, [paginatedData, selectedRows, getRowIdentifier]);

  const handleBulkAction = async (action: BulkAction<T>) => {
    if (selectedItems.length === 0) return;

    if (action.requiresConfirmation) {
      const confirmed = window.confirm(
        `Are you sure you want to ${action.label.toLowerCase()} ${selectedItems.length} item(s)?`,
      );
      if (!confirmed) return;
    }

    try {
      await action.action(selectedItems);
      // Clear selection after action
      setSelectedRows(new Set());
    } catch (error) {
      console.error("Bulk action error:", error);
    }
  };

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  };

  const showAllColumns = () => {
    setVisibleColumns(new Set(columns.map((col) => col.key)));
  };

  const hideAllColumns = () => {
    setVisibleColumns(new Set());
  };

  const handleSavePreset = (preset: any) => {
    const updated = [...savedPresets, preset];
    setSavedPresets(updated);
    localStorage.setItem("filterPresets", JSON.stringify(updated));
  };

  const handleLoadPreset = (preset: any) => {
    setCustomFilters(preset.conditions);
    setFilterLogic(preset.logic);
  };

  const handleDeletePreset = (presetId: string) => {
    const updated = savedPresets.filter((p) => p.id !== presetId);
    setSavedPresets(updated);
    localStorage.setItem("filterPresets", JSON.stringify(updated));
  };

  const handleApplyFilters = (
    conditions: FilterCondition[],
    logic: "AND" | "OR"
  ) => {
    setCustomFilters(conditions);
    setFilterLogic(logic);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    if (sortDirection === "asc") {
      return <ChevronUp className="h-4 w-4 text-[#FFC905]" />;
    }
    if (sortDirection === "desc") {
      return <ChevronDown className="h-4 w-4 text-[#FFC905]" />;
    }
    return <ChevronUp className="h-4 w-4 text-gray-400" />;
  };

  const sortableColumns = useMemo(
    () => columns.filter((col) => col.sortable),
    [columns],
  );

  const showCardView = mobileCardView && isMobile;

  const DefaultCard = ({ row }: { row: T }) => {
    return (
      <div
        className="border border-gray-200 rounded-lg p-4 bg-white space-y-3 shadow-sm"
      >
        <div className="space-y-2">
          {displayColumns.map((col) => (
            <div key={col.key} className="flex justify-between items-start gap-3">
              <span className="text-xs font-medium text-gray-500 uppercase">
                {col.header}
              </span>
              <div className="text-sm text-gray-900 text-right">
                {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search, Export, Bulk Actions, and Column Visibility Bar */}
      {(searchable ||
        exportable ||
        enableFilterBuilder ||
        (selectable && selectedItems.length > 0) ||
        columns.length > 1) && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {searchable && (
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8"
                />
              </div>
            )}
            {showCardView && selectable && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
                <span>Select page</span>
              </label>
            )}
            {enableFilterBuilder && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterBuilder(true)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Custom Filters
                {customFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {customFilters.length}
                  </Badge>
                )}
              </Button>
            )}
            {selectable && selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  {selectedItems.length} selected
                </Badge>
                {bulkActions.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4 mr-2" />
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {bulkActions.map((action, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={() => handleBulkAction(action)}
                          className={
                            action.variant === "destructive"
                              ? "text-red-600"
                              : ""
                          }
                        >
                          {action.icon && (
                            <span className="mr-2">{action.icon}</span>
                          )}
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showCardView && sortableColumns.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    Sort
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {sortableColumns.map((column) => (
                    <DropdownMenuItem
                      key={column.key}
                      onClick={() => handleSort(column.key)}
                      className="flex items-center justify-between gap-2"
                    >
                      <span>{column.header}</span>
                      {getSortIcon(column.key)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/* Column Visibility Toggle */}
            {columns.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    {visibleColumns.size === columns.length ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                    Columns ({visibleColumns.size}/{columns.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-semibold border-b">
                    Toggle Columns
                  </div>
                  {columns.map((column) => {
                    const isVisible = visibleColumns.has(column.key);
                    return (
                      <DropdownMenuItem
                        key={column.key}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleColumnVisibility(column.key);
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={isVisible}
                          onCheckedChange={() =>
                            toggleColumnVisibility(column.key)
                          }
                        />
                        <span className={isVisible ? "" : "text-gray-400"}>
                          {column.header}
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                  <div className="border-t mt-1 pt-1">
                    <DropdownMenuItem
                      onClick={showAllColumns}
                      className="text-sm text-[#FFC905] cursor-pointer"
                    >
                      Show All
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={hideAllColumns}
                      className="text-sm text-gray-500 cursor-pointer"
                    >
                      Hide All
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {exportable && (
              <ExportButton
                data={filteredData}
                columns={displayColumns.map((col) => ({
                  key: col.key,
                  header: col.header,
                }))}
                fileName={`export-${new Date().toISOString().split("T")[0]}`}
                allowColumnSelection={enableColumnSelection}
                onExportCSV={(selectedCols) => {
                  if (onExport) {
                    const filtered = filteredData.map((row) => {
                      const result: any = {};
                      (selectedCols || displayColumns.map((c) => c.key)).forEach(
                        (key) => {
                          result[key] = row[key];
                        }
                      );
                      return result;
                    });
                    onExport(filtered);
                  }
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Custom Filter Builder Dialog */}
      {enableFilterBuilder && (
        <FilterBuilder
          columns={columns.map((col) => ({
            key: col.key,
            header: col.header,
            type: "string" as const, // Could be enhanced to detect type
          }))}
          onApply={handleApplyFilters}
          onSavePreset={handleSavePreset}
          savedPresets={savedPresets}
          onLoadPreset={handleLoadPreset}
          onDeletePreset={handleDeletePreset}
          open={showFilterBuilder}
          onOpenChange={setShowFilterBuilder}
        />
      )}

      {/* Table / Card View */}
      {showCardView ? (
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            Array.from({ length: pageSize }).map((_, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 animate-pulse h-32"
              />
            ))
          ) : paginatedData.length === 0 ? (
            <div className="border rounded-lg p-6 text-center text-gray-500 bg-white">
              {emptyMessage}
            </div>
          ) : (
            paginatedData.map((row, index) => {
              const rowId = getRowIdentifier(row, index);
              const isSelected = selectedRows.has(rowId);
              const cardContent = renderMobileCard ? (
                renderMobileCard(row)
              ) : (
                <DefaultCard row={row} />
              );

              return (
                <div
                  key={rowId}
                  className={`${selectable ? "relative" : ""} ${
                    isSelected && selectable ? "ring-2 ring-[#FFC905]/60 rounded-lg" : ""
                  }`}
                >
                  {selectable && (
                    <div className="absolute top-3 right-3 z-10">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectRow(row, index)}
                        aria-label="Select row"
                        className="bg-white"
                      />
                    </div>
                  )}
                  {cardContent}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                {displayColumns.map((column) => (
                  <TableHead
                    key={column.key}
                    style={{ width: column.width }}
                    className={
                      column.sortable ? "cursor-pointer hover:bg-gray-50" : ""
                    }
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.header}</span>
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={displayColumns.length + (selectable ? 1 : 0)}
                    className="text-center py-8"
                  >
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFC905]"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={displayColumns.length + (selectable ? 1 : 0)}
                    className="text-center py-8 text-gray-500"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => {
                  const rowId = getRowIdentifier(row, index);
                  const isSelected = selectedRows.has(rowId);
                  return (
                    <TableRow
                      key={rowId}
                      className={isSelected ? "bg-[#FFC905]/10" : ""}
                    >
                      {selectable && (
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectRow(row, index)}
                          />
                        </TableCell>
                      )}
                      {displayColumns.map((column) => (
                        <TableCell key={column.key}>
                          {column.render
                            ? column.render(row[column.key], row)
                            : String(row[column.key] || "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {filteredData.length > 0 ? (
              <>
                Showing{" "}
                <span className="font-medium">
                  {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, filteredData.length)}
                </span>{" "}
                of <span className="font-medium">{filteredData.length}</span>{" "}
                results
              </>
            ) : (
              <>Showing 0 results</>
            )}
            {selectable && selectedItems.length > 0 && (
              <span className="ml-2 text-[#FFC905]">
                • {selectedItems.length} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setPageSize(next);
                  setCurrentPage(1);
                }}
                className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC905] focus:border-transparent bg-white"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
