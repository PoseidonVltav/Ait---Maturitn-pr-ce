import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function BusinessPreviewPage() {
  const { id } = useParams();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinessData();
  }, [id]);

  async function loadBusinessData() {
    try {
      let query = supabase
        .from('business_profiles')
        .select(`
          *,
          businesses (
            *,
            business_images (*)
          )
        `);

      if (id) {
        // If we have an ID, load specific business
        query = query.eq('id', id);
      } else {
        // Otherwise load the current user's business
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        query = query.eq('businesses.user_id', user.id);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      setBusiness(data);
    } catch (error) {
      console.error('Error loading business:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Načítání...</div>;
  }

  if (!business) {
    return <div className="text-center py-8">Podnik nebyl nalezen</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{business.name}</h1>
      
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="prose max-w-none">
          <p>{business.description}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Kontaktní informace</h2>
        <div className="space-y-2">
          {business.phone && (
            <p><strong>Telefon:</strong> {business.phone}</p>
          )}
          {business.email && (
            <p><strong>Email:</strong> {business.email}</p>
          )}
          {business.website && (
            <p><strong>Web:</strong> <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{business.website}</a></p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-semibold mb-4">Adresa</h2>
        <div className="space-y-2">
          {business.street_address && (
            <p>{business.street_address}</p>
          )}
          {business.city && business.postal_code && (
            <p>{business.city}, {business.postal_code}</p>
          )}
        </div>
      </div>

      {business.businesses?.business_images?.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Galerie</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {business.businesses.business_images.map((image: any) => (
              <div key={image.id} className="relative">
                <img
                  src={image.image_url}
                  alt={image.title || 'Business image'}
                  className="w-full h-64 object-cover rounded-lg"
                />
                {image.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
                    <h3 className="text-lg font-semibold">{image.title}</h3>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}