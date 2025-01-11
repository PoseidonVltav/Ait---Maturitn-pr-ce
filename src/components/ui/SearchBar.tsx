import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SearchBar = () => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // TODO: Implement search functionality
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="Vyhledat..."
        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
        aria-label="Vyhledávání podniků"
      />
      <div className="absolute right-3 top-2.5 text-gray-400">
        <Search size={20} />
      </div>
    </div>
  );
};

export default SearchBar;