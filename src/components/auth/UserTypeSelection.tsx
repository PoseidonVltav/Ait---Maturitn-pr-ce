import React from 'react';
import { UserType } from '../../types/auth';

interface UserTypeSelectionProps {
  onSelect: (type: UserType) => void;
}

export default function UserTypeSelection({ onSelect }: UserTypeSelectionProps) {
  return (
    <div className="space-y-4">
      <button
        onClick={() => onSelect('business')}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Podnikatel
      </button>
      <button
        onClick={() => onSelect('user')}
        className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
      >
        Uživatel
      </button>
    </div>
  );
}