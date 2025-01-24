import React, { useEffect, useState } from 'react';
import BusinessCard from './BusinessCard';
import { supabase } from '../../lib/supabaseClient';

export default function BusinessGrid() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    loadBusinesses();
  }, [page]);

  async function loadBusinesses() {
    try {
      setError(null);
      
      // Only set loading to true on initial load
      if (page === 0) {
        setLoading(true);
      }

      const { data, error } = await supabase
        .from('business_profiles')
        .select(`
          id,
          name,
          description,
          business_id,
          businesses!inner (
            id,
            business_images (
              id,
              image_url,
              type
            )
          )
        `)
        .eq('status', 'active')
        .not('name', 'eq', 'Nový podnik') // Exclude default profiles
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Filter out any null results and ensure business relationship exists
        const validData = data.filter(item => 
          item && 
          item.businesses && 
          item.business_id && 
          item.name !== 'Nový podnik' // Additional check for default name
        );
        
        setBusinesses(prev => {
          if (page === 0) return validData;
          // Remove duplicates when adding new data
          const newData = [...prev];
          validData.forEach(item => {
            if (!newData.find(existing => existing.id === item.id)) {
              newData.push(item);
            }
          });
          return newData;
        });
        
        // Check if there are more items to load
        setHasMore(data.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
      setError('Nepodařilo se načíst podniky');
    } finally {
      setLoading(false);
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  if (error) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (loading && businesses.length === 0) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <div className="text-gray-500">Načítání podniků...</div>
      </div>
    );
  }

  if (!loading && businesses.length === 0) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <div className="text-gray-500">Žádné podniky k zobrazení</div>
      </div>
    );
  }

  return (
    <div 
      className="h-[calc(100vh-12rem)] overflow-y-auto pr-4 -mr-4"
      onScroll={handleScroll}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {businesses.map(business => (
          <BusinessCard key={business.id} business={business} />
        ))}
      </div>
      {loading && businesses.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          Načítání dalších podniků...
        </div>
      )}
      {!loading && !hasMore && businesses.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          Všechny podniky byly načteny
        </div>
      )}
    </div>
  );
}