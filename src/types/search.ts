import { BusinessProfile } from '../db/models/BusinessProfile';

export interface SearchParams {
  query: string;
  categories?: string[];
  city?: string;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  items: BusinessProfile[];
  total: number;
  page: number;
  totalPages: number;
  query: string;
}