export type SavedShortlistItem = {
  id: string;
  propertyId: string;
  notes: string | null;
  createdAt: string;
};

export const SHORTLISTS_API_BASE = "/api/shortlists";
