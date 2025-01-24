import React, { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 font-bold text-xl">
            Logo
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl px-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Vyhledat..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
              />
              <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>

          {/* Auth Links */}
          <div className="hidden md:flex items-center space-x-4">
            <a href="/login" className="text-gray-700 hover:text-blue-600">Přihlášení</a>
            <a href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Registrace
            </a>
          </div>

          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="ml-4 p-2 rounded-lg hover:bg-gray-100"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
          <button className="block px-4 py-2 text-gray-800 hover:bg-gray-100 w-full text-left">
            Domovská stránka
          </button>
          <button className="block px-4 py-2 text-gray-800 hover:bg-gray-100 w-full text-left">
            Přihlášení
          </button>
          <button className="block px-4 py-2 text-gray-800 hover:bg-gray-100 w-full text-left">
            Registrace
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;