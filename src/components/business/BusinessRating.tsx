import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface BusinessRatingProps {
  businessId: string;
  onRatingSubmit: (businessId: string) => void;
}

export default function BusinessRating({ businessId, onRatingSubmit }: BusinessRatingProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    loadUserRating();
  }, [businessId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const loadUserRating = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('business_ratings')
        .select('rating')
        .eq('business_id', businessId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setUserRating(data.rating);
        setRating(data.rating);
      }
    } catch (error) {
      console.error('Error loading user rating:', error);
    }
  };

  const handleRating = async (value: number) => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Pro hodnocení se musíte přihlásit');
        return;
      }

      const { error: upsertError } = await supabase
        .from('business_ratings')
        .upsert({
          business_id: businessId,
          user_id: user.id,
          rating: value
        }, {
          onConflict: 'business_id,user_id'
        });

      if (upsertError) throw upsertError;

      setUserRating(value);
      setRating(value);
      onRatingSubmit(businessId);
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError('Nepodařilo se uložit hodnocení');
    }
  };

  return (
    <div className="mt-4">
      {error && (
        <div className="text-red-500 text-sm mb-2">{error}</div>
      )}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onMouseEnter={() => isAuthenticated && setHoveredRating(value)}
            onMouseLeave={() => isAuthenticated && setHoveredRating(0)}
            onClick={() => isAuthenticated && handleRating(value)}
            disabled={!isAuthenticated}
            className={`focus:outline-none ${!isAuthenticated && 'cursor-not-allowed'}`}
            title={!isAuthenticated ? 'Pro hodnocení se musíte přihlásit' : undefined}
          >
            <Star
              size={32}
              className={`transition-colors ${
                value <= (hoveredRating || rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {userRating && (
          <span className="text-sm text-gray-500 ml-2">
            Vaše hodnocení: {userRating} / 5
          </span>
        )}
        {!isAuthenticated && (
          <span className="text-sm text-gray-500 ml-2">
            Pro hodnocení se musíte přihlásit
          </span>
        )}
      </div>
    </div>
  );
}