// Přidej propojení s SQL
import { SearchParams, SearchResult } from '../types/search';

// Temporary mock data until SQL integration
const mockSearchResult: SearchResult = {
  items: [],
  total: 0,
  page: 1,
  totalPages: 1,
  query: ''
};

export async function searchBusinesses(params: SearchParams): Promise<SearchResult> {
  // smazat a přidat SQL
  console.log('Search params:', params);
  return mockSearchResult;
}