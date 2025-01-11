import React, { useState, useEffect } from 'react';
import { ImageUploader } from './ImageUploader';
import { supabase } from '../../lib/supabaseClient';
import { BusinessFormData } from '../../types/business';
import BusinessContactForm from './editor/BusinessContactForm';
import BusinessAddressForm from './editor/BusinessAddressForm';
import { BusinessImageGallery } from './BusinessImageGallery';

interface BusinessEditorFormProps {
  business: any;
  onUpdate: () => void;
}

export default function BusinessEditorForm({ business, onUpdate }: BusinessEditorFormProps) {
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    street_address: '',
    city: '',
    postal_code: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load existing business profile data when component mounts
  useEffect(() => {
    if (business?.business_profiles?.[0]) {
      const profile = business.business_profiles[0];
      setFormData({
        name: profile.name || '',
        description: profile.description || '',
        phone: profile.phone || '',
        email: profile.email || '',
        website: profile.website || '',
        street_address: profile.street_address || '',
        city: profile.city || '',
        postal_code: profile.postal_code || ''
      });
    }
  }, [business]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!business?.id) {
        throw new Error('ID podniku není k dispozici');
      }

      // First check if a profile exists
      const { data: existingProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('business_id', business.id)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('business_profiles')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('business_id', business.id);

        if (updateError) throw updateError;
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('business_profiles')
          .insert({
            business_id: business.id,
            ...formData,
            status: 'active'
          });

        if (insertError) throw insertError;
      }

      setSuccess('Změny byly úspěšně uloženy');
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při ukládání změn');
      console.error('Error updating business:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-500 p-4 rounded-lg">
          {success}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold mb-6">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Název podniku"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </h1>
      </div>

      {business?.id && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Obrázky firmy</h2>
          <p className="text-sm text-gray-500">
            Nahrajte až 2 reprezentativní obrázky vaší firmy
          </p>
          <BusinessImageGallery 
            businessId={business.id} 
            isOwner={true}
            type="company"
          />
          <ImageUploader 
            businessId={business.id} 
            onUploadComplete={onUpdate}
            type="company"
            maxImages={2}
          />
        </div>
      )}

      <div className="space-y-4">
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Popis podniku"
          className="w-full p-3 border border-gray-300 rounded-lg min-h-[150px]"
        />
      </div>

      <BusinessContactForm formData={formData} onChange={handleChange} />
      <BusinessAddressForm formData={formData} onChange={handleChange} />

      {business?.id && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Galerie produktů</h2>
          <p className="text-sm text-gray-500">
            Nahrajte až 20 obrázků vašich produktů nebo služeb
          </p>
          <BusinessImageGallery 
            businessId={business.id} 
            isOwner={true}
            type="product"
          />
          <ImageUploader 
            businessId={business.id} 
            onUploadComplete={onUpdate}
            type="product"
            maxImages={20}
          />
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Ukládání...' : 'Uložit změny'}
        </button>
      </div>
    </form>
  );
}