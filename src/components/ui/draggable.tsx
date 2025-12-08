"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DraggableProps {
  id: string;
  data?: Record<string, any>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Draggable({
  id,
  data,
  children,
  className,
  disabled,
}: DraggableProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      data,
      disabled,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(className, isDragging && "opacity-50 z-50")}
    >
      {children}
    </div>
  );
}
