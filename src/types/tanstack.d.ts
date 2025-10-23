/* eslint-disable @typescript-eslint/no-unused-vars */
import "@tanstack/react-table"

declare module "@tanstack/table-core" {
  interface ColumnMeta<_TData, _TValue> {
    headerClassName?: string
    cellClassName?: string
  }
}
