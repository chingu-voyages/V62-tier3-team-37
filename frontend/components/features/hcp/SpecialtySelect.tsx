"use client";

import { useState } from "react";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SpecialtySelect() {
  const [value, setValue] = useState<string>();

  return (
    <div className="space-y-1.5">
      <Label htmlFor="specialty">Specialty</Label>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger id="specialty" aria-label="Select specialty">
          <SelectValue placeholder="Select specialty" />
        </SelectTrigger>
        <SelectContent aria-label="Specialty options" />
      </Select>
    </div>
  );
}
