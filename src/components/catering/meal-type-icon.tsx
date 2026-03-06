"use client";

import {
  Sunrise,
  Coffee,
  UtensilsCrossed,
  CupSoda,
  Moon,
  Cake,
  Star,
} from "lucide-react";
import { MEAL_COLORS } from "@/lib/catering";

const MEAL_ICONS: Record<string, React.ElementType> = {
  Breakfast: Sunrise,
  "Morning Tea": Coffee,
  Lunch: UtensilsCrossed,
  "Afternoon Tea": CupSoda,
  Dinner: Moon,
  Dessert: Cake,
  Supper: Star,
};

interface MealTypeIconProps {
  meal: string;
  className?: string;
  size?: number;
}

export function MealTypeIcon({ meal, className, size = 16 }: MealTypeIconProps) {
  const Icon = MEAL_ICONS[meal] ?? UtensilsCrossed;
  const color = MEAL_COLORS[meal]?.hex ?? "#6b7280";

  return (
    <Icon
      style={{ color, width: size, height: size }}
      className={className}
      aria-label={meal}
    />
  );
}
