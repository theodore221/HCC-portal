"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#3788d8", // Default blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
  "#6366F1", // Indigo
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export function ColorPicker({ value, onChange, disabled }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "h-8 w-8 rounded-lg border border-gray-200 shadow-sm transition-transform",
            !disabled && "hover:scale-105",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ backgroundColor: value || "#3788d8" }}
          disabled={disabled}
          aria-label="Select color"
        />
        <Input
          type="text"
          value={value || "#3788d8"}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#3788d8"
          className="w-24 font-mono text-xs"
          disabled={disabled}
        />
      </div>
      {isOpen && (
        <div className="absolute top-10 left-0 z-50 grid grid-cols-5 gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                onChange(color);
                setIsOpen(false);
              }}
              className={cn(
                "h-6 w-6 rounded border transition-transform hover:scale-110",
                value === color
                  ? "border-gray-900 ring-2 ring-primary/50"
                  : "border-gray-200"
              )}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
