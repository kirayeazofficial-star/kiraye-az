"use client";
import { useId, useState } from "react";
export default function DurationField({
  label,
  name,
  initialValue = "1",
  value,
  onValueChange,
  unit,
  onUnitChange,
  includeYear = false,
}: {
  label: string;
  name: string;
  initialValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  unit: string;
  onUnitChange: (value: string) => void;
  includeYear?: boolean;
}) {
  const id = useId();
  const [localValue, setLocalValue] = useState(initialValue.replace(/\D/g, ""));
  return (
    <div className="durationField">
      <label htmlFor={id}>{label}</label>
      <div className="durationControl">
        <input
          id={id}
          aria-label={label}
          name={name}
          type="text"
          inputMode="numeric"
          pattern="[0-9]+"
          maxLength={4}
          value={value ?? localValue}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "");
            setLocalValue(digits);
            onValueChange?.(digits);
          }}
        />
        <select
          name={name === "min_days" ? "min_rental_unit" : undefined}
          aria-label={
            name === "min_days"
              ? "Minimum müddətin vahidi"
              : "Hesablama müddətinin vahidi"
          }
          value={unit}
          onChange={(event) => onUnitChange(event.target.value)}
        >
          <option value="day">Gün</option>
          <option value="month">Ay</option>
          {includeYear && <option value="year">İl</option>}
        </select>
      </div>
    </div>
  );
}
