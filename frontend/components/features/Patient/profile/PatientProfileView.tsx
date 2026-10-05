import type { ReactNode } from "react";
import {
  CalendarDays,
  Droplets,
  type LucideIcon,
  Mail,
  MapPin,
  Phone,
  Ruler,
  Scale,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { userDisplayName, userInitials } from "@/lib/auth/display";
import { calculateAge, formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PatientAllergy, PatientProfile } from "@/types/patient-profile";

const MISSING = "Not added";

const GENDER_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  male: "Male",
  female: "Female",
};

type Fact = {
  label: string;
  value: string;
  filled: boolean;
  icon: LucideIcon;
};

export function PatientProfileView({
  profile,
  action,
}: {
  profile: PatientProfile;
  action?: ReactNode;
}) {
  const name = userDisplayName(profile);
  const photo = usablePhoto(profile.profile_photo_path);
  const health = profile.patient_profile;
  const birthDate = formatLongDate(profile.birth_date);
  const age = profile.age ?? calculateAge(profile.birth_date);
  const ageLabel = age === undefined || age === null ? null : `${age} ${age === 1 ? "year" : "years"}`;
  const genderLabel = profile.gender ? (GENDER_LABELS[profile.gender] ?? profile.gender) : null;
  const summary = [ageLabel, genderLabel].filter(Boolean).join(" · ") || "Your account details";
  const allergies = formatAllergies(health?.allergies);

  const personal: Fact[] = [
    { ...fact(profile.email), label: "Email", icon: Mail },
    { ...fact(profile.phone), label: "Phone", icon: Phone },
    { ...fact(birthDate), label: "Date of birth", icon: CalendarDays },
    { ...fact(genderLabel), label: "Gender", icon: UserRound },
    { ...fact(profile.country), label: "Country", icon: MapPin },
  ];

  const measures: Fact[] = [
    { ...fact(health?.blood_type), label: "Blood type", icon: Droplets },
    { ...fact(formatMeasure(health?.height_cm, "cm")), label: "Height", icon: Ruler },
    { ...fact(formatMeasure(health?.weight_kg, "kg")), label: "Weight", icon: Scale },
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="rounded-3xl border border-secondary/20 bg-accent p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <Avatar className="size-16 ring-4 ring-background sm:size-20">
            {photo ? <AvatarImage src={photo} alt="" /> : null}
            <AvatarFallback className="bg-background text-lg font-semibold text-primary sm:text-xl">
              {userInitials(profile)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="type-step text-primary">Profile</p>
            <h1 className="mt-1 truncate type-h2 text-foreground">{name}</h1>
            <p className="mt-1 type-body text-muted-foreground">{summary}</p>
          </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <SectionIntro
            title="Personal"
            description="Contact and identity details saved on this account."
          />
          <ul className="overflow-hidden rounded-2xl bg-background shadow-card ring-1 ring-border/70">
            {personal.map((item) => (
              <FactRow key={item.label} item={item} />
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <SectionIntro
            title="Health"
            description="Clinical details kept with your profile."
          />
          <div className="rounded-2xl bg-background p-4 shadow-card ring-1 ring-border/70 sm:p-5">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {measures.map((item) => (
                <Stat key={item.label} item={item} />
              ))}
            </dl>

            <div className="mt-4 border-t border-border/70 pt-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-primary/70" aria-hidden="true" />
                <h3 className="type-label text-foreground">Allergies</h3>
              </div>
              {allergies.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {allergies.map((allergy) => (
                    <li
                      key={allergy}
                      className="inline-flex max-w-full items-center rounded-full bg-accent px-3 py-1 type-helper font-medium text-primary"
                    >
                      <span className="truncate">{allergy}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 type-body text-muted-foreground">None recorded</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionIntro({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="type-h3 text-foreground">{title}</h2>
      <p className="mt-0.5 type-helper text-muted-foreground">{description}</p>
    </div>
  );
}

function FactRow({ item }: { item: Fact }) {
  const Icon = item.icon;

  return (
    <li className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5 last:border-b-0 sm:px-5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="type-helper text-muted-foreground">{item.label}</p>
        <p className={cn("truncate type-label", item.filled ? "text-foreground" : "text-muted-foreground")}>
          {item.value}
        </p>
      </div>
    </li>
  );
}

function Stat({ item }: { item: Fact }) {
  const Icon = item.icon;

  return (
    <div className="rounded-xl bg-muted px-3 py-3">
      <dt className="flex items-center gap-1.5 type-helper text-muted-foreground">
        <Icon className="size-3.5 shrink-0 text-primary/70" aria-hidden="true" />
        {item.label}
      </dt>
      <dd
        className={cn(
          "mt-1",
          item.filled ? "type-h3 text-foreground" : "type-body text-muted-foreground",
        )}
      >
        {item.value}
      </dd>
    </div>
  );
}

function fact(value: string | null | undefined): Pick<Fact, "value" | "filled"> {
  const text = value?.trim();
  if (!text) return { value: MISSING, filled: false };
  return { value: text, filled: true };
}

function usablePhoto(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }
  return undefined;
}

function formatMeasure(value: string | number | null | undefined, unit: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) return String(value);
  const rounded = Number.isInteger(numeric) ? String(numeric) : String(Number(numeric.toFixed(1)));
  return `${rounded} ${unit}`;
}

function formatAllergies(allergies: Array<PatientAllergy | string> | null | undefined): string[] {
  if (!allergies || allergies.length === 0) return [];

  return allergies
    .map((item) => {
      if (typeof item === "string") return item.trim();
      const name = item.name?.trim();
      if (!name) return "";
      const extra = [item.severity, item.reaction].map((part) => part?.trim()).filter(Boolean);
      return extra.length > 0 ? `${name} (${extra.join(", ")})` : name;
    })
    .filter((label) => label.length > 0);
}
