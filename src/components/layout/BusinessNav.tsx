import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PenSquare, Store } from 'lucide-react';

export default function BusinessNav() {
  const location = useLocation();
  
  return (
    <div className="flex space-x-4">
      <Link
        to="/business/editor"
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
          location.pathname === '/business/editor'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <PenSquare size={20} />
        <span>Editor podniku</span>
      </Link>
      <Link
        to="/business/preview"
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
          location.pathname === '/business/preview'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Store size={20} />
        <span>Zobrazit podnik</span>
      </Link>
    </div>
  );
}