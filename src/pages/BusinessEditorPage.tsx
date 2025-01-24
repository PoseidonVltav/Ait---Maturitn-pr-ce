import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import BusinessEditorForm from '../components/business/BusinessEditorForm';
import { Business } from '../types';

export default function BusinessEditorPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadBusinessData();
  }, []);

  async function loadBusinessData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Get the user's metadata to check if they're a business user
      const { data: metadata } = await supabase
        .from('user_metadata')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (!metadata || metadata.user_type !== 'business') {
        setError('Nemáte oprávnění k přístupu k editoru podniku');
        return;
      }

      // First get the business
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (businessError) {
        if (businessError.code === 'PGRST116') {
          // Create new business if none exists
          const { data: newBusiness, error: createError } = await supabase
            .from('businesses')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (createError) throw createError;
          businessData = newBusiness;
        } else {
          throw businessError;
        }
      }

      // Now get the business profile
      const { data: profileData, error: profileError } = await supabase
        .from('business_profiles')
        .select(`
          *,
          businesses (
            id,
            user_id
          )
        `)
        .eq('business_id', businessData.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setBusiness({
        ...businessData,
        business_profiles: profileData ? [profileData] : []
      });
    } catch (error) {
      console.error('Error loading business:', error);
      setError('Nepodařilo se načíst data podniku');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Načítání...</div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BusinessEditorForm business={business} onUpdate={loadBusinessData} />
    </div>
  );
}