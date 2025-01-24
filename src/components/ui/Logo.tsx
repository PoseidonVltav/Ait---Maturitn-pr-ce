import React from 'react';
import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <Store size={32} className="text-white" />
      <span className="text-xl font-bold text-white">Sezam</span>
    </Link>
  );
}