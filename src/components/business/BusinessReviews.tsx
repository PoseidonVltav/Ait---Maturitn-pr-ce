import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Review {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes: number;
  dislikes: number;
  user_metadata?: {
    email: string;
    is_admin: boolean;
  };
  user_reaction?: 'like' | 'dislike' | null;
}

interface BusinessReviewsProps {
  businessId: string;
}

export default function BusinessReviews({ businessId }: BusinessReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [canComment, setCanComment] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (businessId) {
      checkAuth();
    }
  }, [businessId]);

  useEffect(() => {
    if (businessId) {
      loadReviews();
    }
  }, [businessId, currentUser]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setCurrentUser(user);
      
      if (user) {
        const { data: metadata } = await supabase
          .from('user_metadata')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(metadata?.is_admin || false);
        if (!metadata?.is_admin) {
          checkCommentLimit(user.id);
        } else {
          setCanComment(true);
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  const loadReviews = async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      
      // First get all reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('business_reviews')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Get user metadata for all review authors
      const userIds = [...new Set((reviewsData || []).map(review => review.user_id))];
      const { data: userMetadata, error: userError } = await supabase
        .from('user_metadata')
        .select('id, email, is_admin')
        .in('id', userIds);

      if (userError) throw userError;

      // Get reactions if user is authenticated
      let reactions = [];
      if (currentUser) {
        const { data: reactionsData } = await supabase
          .from('review_reactions')
          .select('review_id, reaction_type')
          .eq('user_id', currentUser.id);
        reactions = reactionsData || [];
      }

      // Combine all data
      const reviewsWithData = (reviewsData || []).map(review => ({
        ...review,
        user_metadata: userMetadata?.find(um => um.id === review.user_id),
        user_reaction: reactions.find(r => r.review_id === review.id)?.reaction_type || null
      }));

      setReviews(reviewsWithData);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setError('Nepodařilo se načíst komentáře');
    } finally {
      setLoading(false);
    }
  };

  const checkCommentLimit = async (userId: string) => {
    if (!businessId) return;

    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const { data, error } = await supabase
        .from('business_reviews')
        .select('created_at')
        .eq('business_id', businessId)
        .eq('user_id', userId)
        .gte('created_at', oneHourAgo.toISOString());

      if (error) throw error;
      setCanComment((data || []).length < 2);
    } catch (error) {
      console.error('Error checking comment limit:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!newReview.trim() || !businessId || !currentUser) return;

    try {
      if (!isAdmin && !canComment) {
        setError('Můžete přidat maximálně 2 komentáře za hodinu');
        return;
      }

      const { error: insertError } = await supabase
        .from('business_reviews')
        .insert({
          business_id: businessId,
          user_id: currentUser.id,
          content: newReview.trim(),
          likes: 0,
          dislikes: 0
        });

      if (insertError) throw insertError;

      setNewReview('');
      await loadReviews();
      if (!isAdmin) {
        await checkCommentLimit(currentUser.id);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Nepodařilo se přidat komentář');
    }
  };

  const handleReaction = async (reviewId: string, type: 'like' | 'dislike') => {
    try {
      if (!currentUser) {
        setError('Pro hodnocení komentáře se musíte přihlásit');
        return;
      }

      const review = reviews.find(r => r.id === reviewId);
      if (review?.user_id === currentUser.id) {
        setError('Nemůžete hodnotit vlastní komentář');
        return;
      }

      const currentReaction = review?.user_reaction;

      // First, delete any existing reaction
      if (currentReaction) {
        const { error: deleteError } = await supabase
          .from('review_reactions')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('review_id', reviewId);

        if (deleteError) throw deleteError;
      }

      // If the user clicked the same reaction type, we're done (it was removed)
      if (currentReaction === type) {
        await loadReviews();
        return;
      }

      // Otherwise, insert the new reaction
      const { error: insertError } = await supabase
        .from('review_reactions')
        .insert({
          user_id: currentUser.id,
          review_id: reviewId,
          reaction_type: type
        });

      if (insertError) throw insertError;

      await loadReviews();
    } catch (error) {
      console.error('Error handling reaction:', error);
      setError('Nepodařilo se uložit reakci');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      if (!isAdmin && !currentUser) return;

      const { error } = await supabase
        .from('business_reviews')
        .delete()
        .eq('id', reviewId)
        .eq(isAdmin ? 'id' : 'user_id', isAdmin ? reviewId : currentUser.id);

      if (error) throw error;
      await loadReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      setError('Nepodařilo se smazat komentář');
    }
  };

  if (loading && !reviews.length) {
    return <div>Načítání komentářů...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="text-red-500 text-sm mb-4">{error}</div>
      )}

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="Napište komentář..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
          />
          <button
            type="submit"
            disabled={!isAdmin && !canComment}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Přidat komentář
          </button>
          {!isAdmin && !canComment && (
            <p className="text-sm text-gray-500">
              Můžete přidat maximálně 2 komentáře za hodinu
            </p>
          )}
        </form>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-gray-600">Pro přidání komentáře se musíte přihlásit</p>
        </div>
      )}

      <div className="space-y-6">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="font-medium">
                    {review.user_metadata?.email || 'Anonymní'}
                    {review.user_metadata?.is_admin && (
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        ADMIN
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                  {(isAdmin || currentUser?.id === review.user_id) && (
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-red-500 hover:text-red-600"
                      title="Smazat komentář"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-700 mb-4">{review.content}</p>

              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center gap-1 ${
                    currentUser?.id === review.user_id ? 'opacity-50' :
                    !isAuthenticated ? 'opacity-50' :
                    review.user_reaction === 'like' ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {currentUser?.id !== review.user_id && isAuthenticated ? (
                    <button
                      onClick={() => handleReaction(review.id, 'like')}
                      className="flex items-center gap-1"
                      title={!isAuthenticated ? 'Pro hodnocení se musíte přihlásit' : undefined}
                    >
                      <ThumbsUp size={20} />
                      <span>{review.likes || 0}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1" title={currentUser?.id === review.user_id ? 'Nemůžete hodnotit vlastní komentář' : 'Pro hodnocení se musíte přihlásit'}>
                      <ThumbsUp size={20} />
                      <span>{review.likes || 0}</span>
                    </div>
                  )}
                </div>

                <div
                  className={`flex items-center gap-1 ${
                    currentUser?.id === review.user_id ? 'opacity-50' :
                    !isAuthenticated ? 'opacity-50' :
                    review.user_reaction === 'dislike' ? 'text-red-600' : 'text-gray-500'
                  }`}
                >
                  {currentUser?.id !== review.user_id && isAuthenticated ? (
                    <button
                      onClick={() => handleReaction(review.id, 'dislike')}
                      className="flex items-center gap-1"
                      title={!isAuthenticated ? 'Pro hodnocení se musíte přihlásit' : undefined}
                    >
                      <ThumbsDown size={20} />
                      <span>{review.dislikes || 0}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1" title={currentUser?.id === review.user_id ? 'Nemůžete hodnotit vlastní komentář' : 'Pro hodnocení se musíte přihlásit'}>
                      <ThumbsDown size={20} />
                      <span>{review.dislikes || 0}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500">
            Zatím zde nejsou žádné komentáře
          </div>
        )}
      </div>
    </div>
  );
}