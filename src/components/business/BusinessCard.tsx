import React from 'react';
import { Link } from 'react-router-dom';

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    description: string;
    businesses: {
      id: string;
      business_images: Array<{
        image_url: string;
        type: string;
      }>;
    };
  };
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business }) => {
  // Get company image
  const companyImage = business.businesses?.business_images?.find(
    img => img.type === 'company'
  );

  return (
    <Link to={`/business/${business.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md p-4 h-64 hover:shadow-lg transition">
        <h3 className="text-xl font-semibold mb-4">{business.name || 'Nový podnik'}</h3>
        <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center overflow-hidden">
          {companyImage ? (
            <img
              src={companyImage.image_url}
              alt={business.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <p className="text-gray-500">Náhled podniku</p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default BusinessCard;