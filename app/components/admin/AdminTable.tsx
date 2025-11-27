"use client";

interface Column {
  key: string;
  header: string;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface AdminTableProps {
  columns?: Column[];
  data?: any[];
  onRowClick?: (row: any) => void;
}

export function AdminTable({
  columns = [],
  data = [],
  onRowClick,
}: AdminTableProps) {
  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg border -mx-4 sm:mx-0">
      <table className="w-full table-fixed min-w-[640px]">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500"
                style={{ width: column.width }}
              >
                <div className="truncate">{column.header}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, index: number) => (
            <tr
              key={index}
              className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-3 sm:px-4 py-3 sm:py-4">
                  <div className="truncate text-xs sm:text-sm">
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
