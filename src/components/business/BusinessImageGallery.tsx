import React, { useEffect, useState } from 'react';
import { BusinessImage } from '../../types/business';
import { businessImagesService } from '../../services/businessImages';
import { Loader } from 'lucide-react';

interface Props {
  businessId: string;
  isOwner?: boolean;
  type?: 'product' | 'company';
}

export const BusinessImageGallery: React.FC<Props> = ({ 
  businessId, 
  isOwner,
  type = 'product'
}) => {
  const [images, setImages] = useState<BusinessImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, [businessId, type]);

  const loadImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await businessImagesService.getBusinessImages(businessId, type);
      setImages(data);
    } catch (err) {
      // Zobrazíme chybu pouze pokud se nepodařilo načíst existující obrázky
      const { count } = await businessImagesService.getImageCount(businessId, type);
      if (count > 0) {
        setError('Nepodařilo se načíst obrázky');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      await businessImagesService.deleteImage(imageId);
      await loadImages();
    } catch (err) {
      setError('Nepodařilo se smazat obrázek');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4"><Loader className="animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!loading && images.length === 0) {
    return (
      <div className="text-gray-500 p-4 text-center border border-dashed border-gray-300 rounded-lg">
        {type === 'company' 
          ? 'Zatím jste nepřidali žádné obrázky firmy'
          : 'Zatím jste nepřidali žádné obrázky produktů'
        }
      </div>
    );
  }

  return (
    <div className={`grid ${type === 'company' ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-4`}>
      {images.map((image) => (
        <div key={image.id} className="relative group">
          <img
            src={image.image_url}
            alt={image.title || 'Business image'}
            className={`w-full ${type === 'company' ? 'h-64' : 'h-48'} object-cover rounded-lg`}
          />
          {image.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
              <h3 className="text-sm font-medium">{image.title}</h3>
              {image.description && (
                <p className="text-xs mt-1">{image.description}</p>
              )}
            </div>
          )}
          {isOwner && (
            <button
              onClick={() => handleDelete(image.id)}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
};