import React from 'react';

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
  };
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-64">
      <h3 className="text-xl font-semibold mb-4">{business.name || 'Nový podnik'}</h3>
      <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center">
        {business.imageUrl ? (
          <img
            src={business.imageUrl}
            alt={business.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <p className="text-gray-500">Náhled podniku</p>
        )}
      </div>
    </div>
  );
};

export default BusinessCard;