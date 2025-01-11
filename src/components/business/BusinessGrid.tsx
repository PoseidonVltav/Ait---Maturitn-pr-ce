import React, { useEffect, useState } from 'react';
import BusinessCard from './BusinessCard';
import { supabase } from '../../lib/supabaseClient';

export default function BusinessGrid() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    try {
      const { data } = await supabase
        .from('business_profiles')
        .select(`
          *,
          businesses (*)
        `)
        .eq('status', 'active')
        .limit(4);

      setBusinesses(data || []);
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Načítání...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {businesses.map(business => (
        <BusinessCard key={business.id} business={business} />
      ))}
    </div>
  );
}