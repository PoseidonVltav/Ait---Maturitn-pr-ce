import React from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#E6E6FA]"> {/* Lightest purple for main background */}
      <Navbar />
      {children}
    </div>
  );
}