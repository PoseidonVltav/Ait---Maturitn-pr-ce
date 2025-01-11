import React from 'react';
import { BusinessFormData } from '../../../types/business';

interface BusinessContactFormProps {
  formData: BusinessFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function BusinessContactForm({ formData, onChange }: BusinessContactFormProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Kontaktní údaje</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={onChange}
          placeholder="Telefon"
          className="p-2 border border-gray-300 rounded-lg"
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={onChange}
          placeholder="Email"
          className="p-2 border border-gray-300 rounded-lg"
        />
        <input
          type="url"
          name="website"
          value={formData.website}
          onChange={onChange}
          placeholder="Webová stránka"
          className="p-2 border border-gray-300 rounded-lg"
        />
      </div>
    </div>
  );
}