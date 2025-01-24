import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PenSquare, Store } from 'lucide-react';

interface BusinessNavProps {
  profileId: string | null;
}

export default function BusinessNav({ profileId }: BusinessNavProps) {
  const location = useLocation();
  
  return (
    <div className="flex space-x-4">
      <Link
        to="/business/editor"
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
          location.pathname === '/business/editor'
            ? 'bg-blue-600 text-white'
            : 'text-gray-300 hover:text-white hover:bg-primary-medium'
        }`}
      >
        <PenSquare size={20} />
        <span>Editor podniku</span>
      </Link>
      {profileId && (
        <Link
          to={`/business/${profileId}`}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
            location.pathname === `/business/${profileId}`
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-primary-medium'
          }`}
        >
          <Store size={20} />
          <span>Zobrazit podnik</span>
        </Link>
      )}
    </div>
  );
}