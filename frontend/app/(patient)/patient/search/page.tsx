"use client";

import { useState } from "react";
import { HCPDirectory } from "@/components/features/patient/HCPDirectory/HCPDirectory";
import { useHcpsQuery } from "@/hooks/use-hcps-query";
import type { HCPFilters } from "@/types/hcp-directory";

export default function PatientDoctorsPage() {
  const [filters, setFilters] = useState<HCPFilters>({});
  const [page, setPage] = useState(1);
  const query = useHcpsQuery(filters, page);

  return (
    <div className="flex w-full h-full flex-col gap-25">
      <HCPDirectory
        hcps={query.data?.hcps ?? []}
        pagination={
          query.data
            ? {
                currentPage: query.data.currentPage,
                totalPages: query.data.totalPages,
                total: query.data.total,
              }
            : undefined
        }
        onFiltersChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        onPageChange={setPage}
      />
    </div>
  );
}
