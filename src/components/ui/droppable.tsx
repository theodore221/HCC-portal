"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableProps {
  id: string;
  data?: Record<string, unknown>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Droppable({
  id,
  data,
  children,
  className,
  disabled,
}: DroppableProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && "bg-accent/50 ring-2 ring-primary/20")}
    >
      {children}
    </div>
  );
}
