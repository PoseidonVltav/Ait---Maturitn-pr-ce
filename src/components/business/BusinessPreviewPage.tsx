import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Star, Flag, Clock, MapPin, Phone, Mail, Globe } from 'lucide-react';
import BusinessReviews from './BusinessReviews';
import BusinessRating from './BusinessRating';
import { BusinessImageGallery } from './BusinessImageGallery';

export default function BusinessPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hasCompanyImages, setHasCompanyImages] = useState(false);
  const [hasProductImages, setHasProductImages] = useState(false);

  useEffect(() => {
    if (id) {
      checkUserStatus();
      loadBusinessData();
    }
  }, [id]);

  useEffect(() => {
    if (business?.businesses?.id) {
      checkImages(business.businesses.id);
    }
  }, [business]);

  const checkUserStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: metadata } = await supabase
          .from('user_metadata')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        setIsAdmin(metadata?.is_admin || false);

        if (id) {
          const { data: profile } = await supabase
            .from('business_profiles')
            .select('business_id')
            .eq('id', id)
            .single();

          if (profile?.business_id) {
            const { data: business } = await supabase
              .from('businesses')
              .select('user_id')
              .eq('id', profile.business_id)
              .single();

            setIsOwner(business?.user_id === user.id);
          }
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  const checkImages = async (businessId: string) => {
    try {
      const { data: companyImages } = await supabase
        .from('business_images')
        .select('id')
        .eq('business_id', businessId)
        .eq('type', 'company')
        .limit(1);

      const { data: productImages } = await supabase
        .from('business_images')
        .select('id')
        .eq('business_id', businessId)
        .eq('type', 'product')
        .limit(1);

      setHasCompanyImages(companyImages && companyImages.length > 0);
      setHasProductImages(productImages && productImages.length > 0);
    } catch (error) {
      console.error('Error checking images:', error);
    }
  };

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('business_profiles')
        .select(`
          *,
          businesses (
            id,
            user_id,
            business_images (
              id,
              image_url,
              type
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Podnik nebyl nalezen');

      setBusiness(data);
    } catch (err) {
      console.error('Error loading business:', err);
      setError('Nepodařilo se načíst data podniku');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeout = async () => {
    if (!isAdmin || !id) return;

    try {
      const reason = window.prompt('Zadejte důvod zmrazení:');
      if (reason === null) return; // User cancelled

      const { error: updateError } = await supabase
        .from('business_profiles')
        .update({
          is_timeout: true,
          timeout_by: (await supabase.auth.getUser()).data.user?.id,
          timeout_reason: reason || undefined
        })
        .eq('id', id);

      if (updateError) throw updateError;
      await loadBusinessData();
    } catch (error) {
      console.error('Error setting timeout:', error);
      setError('Nepodařilo se zmrazit podnik');
    }
  };

  const handleUnfreeze = async () => {
    if (!isAdmin || !id) return;

    try {
      const { error: updateError } = await supabase
        .from('business_profiles')
        .update({
          is_timeout: false,
          timeout_by: null,
          timeout_reason: null
        })
        .eq('id', id);

      if (updateError) throw updateError;
      await loadBusinessData();
    } catch (error) {
      console.error('Error removing timeout:', error);
      setError('Nepodařilo se odmrazit podnik');
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || !id) return;

    const confirmed = window.confirm('Opravdu chcete smazat tento podnik?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('business_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error deleting business:', error);
      setError('Nepodařilo se smazat podnik');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Načítání...</div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {error || 'Podnik nebyl nalezen'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-bold">{business.name || 'Nepojmenovaný podnik'}</h1>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              {business.is_timeout ? (
                <button
                  onClick={handleUnfreeze}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  title="Odmrazit podnik"
                >
                  <Clock size={20} />
                  Odmrazit
                </button>
              ) : (
                <button
                  onClick={handleTimeout}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                  title="Zmrazit podnik"
                >
                  <Clock size={20} />
                  Zmrazit
                </button>
              )}
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Smazat podnik
              </button>
            </>
          )}
          {!isAdmin && !isOwner && (
            <button
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <Flag size={20} />
              Nahlásit
            </button>
          )}
        </div>
      </div>

      {business.is_timeout && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-center">
            <Clock className="text-yellow-400 mr-2" size={20} />
            <div>
              <p className="text-sm text-yellow-700">
                Tento podnik je zmrazen
              </p>
              {business.timeout_reason && (
                <p className="text-sm text-yellow-600 mt-1">
                  Důvod: {business.timeout_reason}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="prose max-w-none">
            <p className="text-gray-600">{business.description || 'Bez popisu'}</p>
          </div>
          <div className="space-y-4">
            {business.street_address && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={20} className="text-gray-400" />
                <div>
                  <div>{business.street_address}</div>
                  <div>{business.city}, {business.postal_code}</div>
                </div>
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={20} className="text-gray-400" />
                <a href={`tel:${business.phone}`} className="hover:text-blue-600">
                  {business.phone}
                </a>
              </div>
            )}
            {business.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={20} className="text-gray-400" />
                <a href={`mailto:${business.email}`} className="hover:text-blue-600">
                  {business.email}
                </a>
              </div>
            )}
            {business.website && (
              <div className="flex items-center gap-2 text-gray-600">
                <Globe size={20} className="text-gray-400" />
                <a href={business.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                  {business.website}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {(hasCompanyImages || isOwner) && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Obrázky firmy</h2>
            <BusinessImageGallery 
              businessId={business.businesses.id}
              isOwner={isOwner}
              type="company"
            />
          </section>
        )}

        {(hasProductImages || isOwner) && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Produkty a služby</h2>
            <BusinessImageGallery 
              businessId={business.businesses.id}
              isOwner={isOwner}
              type="product"
            />
          </section>
        )}

        <section>
          <h2 className="text-2xl font-semibold mb-4">Hodnocení</h2>
          <BusinessRating 
            businessId={business.id}
            onRatingSubmit={loadBusinessData}
          />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Komentáře</h2>
          <BusinessReviews businessId={business.id} />
        </section>
      </div>
    </div>
  );
}