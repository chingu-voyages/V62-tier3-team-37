"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PatientProfile } from "@/types/patient-profile";
import { PatientProfileForm } from "./PatientProfileForm";
import { PatientProfileView } from "./PatientProfileView";

export function PatientProfilePanel({ profile }: { profile: PatientProfile }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <PatientProfileForm
        profile={profile}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <PatientProfileView
      profile={profile}
      action={
        <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
          <Pencil aria-hidden="true" />
          Edit profile
        </Button>
      }
    />
  );
}
