"use client";

export type SortMode = "staff" | "date" | "status";

type Props = {
  value: SortMode;
  onChange: (mode: SortMode) => void;
};

const OPTIONS: { value: SortMode; label: string }[] = [
  { value: "staff", label: "By Staff" },
  { value: "date", label: "By Date" },
  { value: "status", label: "By Status" },
];

export function SortToggle({ value, onChange }: Props) {
  return (
    <div className="flex items-center rounded-full bg-gray-100 p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            value === opt.value
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
