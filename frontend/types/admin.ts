export type AdminAccessRequestRecord = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  message: string | null;
  status: string;
  created_at: string | null;
};

export type AdminAccessRequestResponse = {
  data: AdminAccessRequestRecord | null;
};

export type AdminAccessRequestListResponse = {
  data: AdminAccessRequestRecord[];
};
