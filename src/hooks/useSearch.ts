import { useState, useCallback } from 'react';
import { SearchParams, SearchResult } from '../types/search';
import { searchBusinesses } from '../services/search';

// Custom hook pro vyhledávání podniků
export function useSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [results, setResults] = useState<SearchResult | null>(null);

  const search = useCallback(async (params: SearchParams) => {
    try {
      setLoading(true);
      setError(null);
      const result = await searchBusinesses(params);
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Chyba při vyhledávání'));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    search,
    loading,
    error,
    results
  };
}