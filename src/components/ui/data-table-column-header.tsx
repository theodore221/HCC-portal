"use client"

import type { HTMLAttributes } from "react"
import { Column } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "./button"

interface DataTableColumnHeaderProps<TData, TValue>
  extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn("text-xs font-medium uppercase tracking-wide text-gray-500", className)}>{title}</div>
  }

  return (
    <div className={cn("flex items-center", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 px-2 text-xs font-medium uppercase tracking-wide text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>{title}</span>
        {column.getIsSorted() === "desc" ? (
          <ArrowDown className="ml-1 size-3" aria-hidden="true" />
        ) : column.getIsSorted() === "asc" ? (
          <ArrowUp className="ml-1 size-3" aria-hidden="true" />
        ) : (
          <ChevronsUpDown className="ml-1 size-3" aria-hidden="true" />
        )}
      </Button>
    </div>
  )
}
