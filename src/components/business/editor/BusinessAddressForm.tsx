import React from 'react';
import { BusinessFormData } from '../../../types/business';

interface BusinessAddressFormProps {
  formData: BusinessFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function BusinessAddressForm({ formData, onChange }: BusinessAddressFormProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Adresa</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          name="street_address"
          value={formData.street_address}
          onChange={onChange}
          placeholder="Ulice"
          className="p-2 border border-gray-300 rounded-lg"
        />
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={onChange}
          placeholder="Město"
          className="p-2 border border-gray-300 rounded-lg"
        />
        <input
          type="text"
          name="postal_code"
          value={formData.postal_code}
          onChange={onChange}
          placeholder="PSČ"
          className="p-2 border border-gray-300 rounded-lg"
        />
      </div>
    </div>
  );
}