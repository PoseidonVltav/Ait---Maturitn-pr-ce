import { supabase } from '../lib/supabaseClient';

export interface SearchResult {
  id: string;
  name: string;
  city?: string;
}

export async function searchBusinesses(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  try {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('id, name, city')
      .eq('status', 'active')
      .ilike('name', `%${query}%`)
      .limit(5);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}