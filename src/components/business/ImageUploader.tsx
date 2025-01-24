import React, { useState, useEffect } from 'react';
import { businessImagesService } from '../../services/businessImages';
import { Upload, Plus, X, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { BusinessImage } from '../../types/business';

interface ImageForm {
  file: File | null;
  title?: string;
  description?: string;
}

interface Props {
  businessId: string;
  onChanges?: (changes: any[]) => void;
  type?: 'product' | 'company';
  maxImages?: number;
}

const IMAGE_REQUIREMENTS = {
  product: {
    maxSize: 2 * 1024 * 1024, // 2MB
    maxWidth: 1200,
    maxHeight: 1200,
    minWidth: 400,
    minHeight: 400,
    formats: ['image/jpeg', 'image/png', 'image/webp'],
    maxCount: 20
  },
  company: {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxWidth: 2400,
    maxHeight: 1600,
    minWidth: 800,
    minHeight: 600,
    formats: ['image/jpeg', 'image/png', 'image/webp'],
    maxCount: 2
  }
};

export const ImageUploader: React.FC<Props> = ({ 
  businessId, 
  onChanges,
  type = 'product',
  maxImages = type === 'product' ? 20 : 2
}) => {
  const [imageForms, setImageForms] = useState<ImageForm[]>([]);
  const [images, setImages] = useState<BusinessImage[]>([]);
  const [editingImage, setEditingImage] = useState<BusinessImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requirements = IMAGE_REQUIREMENTS[type];

  useEffect(() => {
    loadImages();
  }, [businessId, type]);

  const loadImages = async () => {
    try {
      const data = await businessImagesService.getBusinessImages(businessId, type);
      setImages(data);
    } catch (err) {
      console.error('Error loading images:', err);
    }
  };

  const validateImage = async (file: File): Promise<boolean> => {
    if (!requirements.formats.includes(file.type)) {
      setError(`Povolené formáty: ${requirements.formats.join(', ')}`);
      return false;
    }

    if (file.size > requirements.maxSize) {
      setError(`Maximální velikost: ${requirements.maxSize / 1024 / 1024}MB`);
      return false;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width > requirements.maxWidth || img.height > requirements.maxHeight) {
          setError(`Maximální rozměry: ${requirements.maxWidth}x${requirements.maxHeight}px`);
          resolve(false);
        } else if (img.width < requirements.minWidth || img.height < requirements.minHeight) {
          setError(`Minimální rozměry: ${requirements.minWidth}x${requirements.minHeight}px`);
          resolve(false);
        } else {
          resolve(true);
        }
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const addImageForm = () => {
    if (imageForms.length + images.length >= maxImages) {
      setError(`Maximální počet obrázků: ${maxImages}`);
      return;
    }
    setImageForms(prev => [...prev, { file: null }]);
  };

  const removeImageForm = (index: number) => {
    setImageForms(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = async (index: number, file: File) => {
    setError(null);
    const isValid = await validateImage(file);
    if (isValid) {
      setImageForms(prev => prev.map((form, i) => 
        i === index ? { ...form, file } : form
      ));
    }
  };

  const handleInputChange = (index: number, field: 'title' | 'description', value: string) => {
    setImageForms(prev => prev.map((form, i) => 
      i === index ? { ...form, [field]: value } : form
    ));
  };

  const handleUpdateImage = async (image: BusinessImage, title: string, description: string) => {
    try {
      await businessImagesService.addImage({
        id: image.id,
        business_id: businessId,
        image_url: image.image_url,
        title,
        description,
        type
      });
      
      setEditingImage(null);
      await loadImages();
    } catch (err) {
      setError('Nepodařilo se aktualizovat obrázek');
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await businessImagesService.deleteImage(imageId);
      await loadImages();
    } catch (err) {
      setError('Nepodařilo se smazat obrázek');
    }
  };

  const handleUpload = async (form: ImageForm) => {
    if (!form.file) return null;

    try {
      const timestamp = new Date().getTime();
      const fileExt = form.file.name.split('.').pop();
      const fileName = `${timestamp}.${fileExt}`;
      const filePath = `${businessId}/${type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-images')
        .upload(filePath, form.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-images')
        .getPublicUrl(filePath);

      await businessImagesService.addImage({
        business_id: businessId,
        image_url: publicUrl,
        title: form.title,
        description: form.description,
        type: type
      });

      return true;
    } catch (error) {
      console.error('Upload failed:', error);
      return false;
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <div className="text-gray-500 text-sm">
        Požadavky na obrázek:
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Formát: {requirements.formats.map(f => f.split('/')[1]).join(', ')}</li>
          <li>Maximální velikost: {requirements.maxSize / 1024 / 1024}MB</li>
          <li>Rozměry: {requirements.minWidth}x{requirements.minHeight}px až {requirements.maxWidth}x{requirements.maxHeight}px</li>
          <li>Maximální počet: {maxImages} obrázků</li>
        </ul>
      </div>

      {/* Existing Images */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Nahrané obrázky</h3>
          <div className="grid grid-cols-1 gap-6">
            {images.map((image) => (
              <div key={image.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="flex gap-6">
                  <div className="w-1/3">
                    <div className="aspect-square rounded-lg overflow-hidden">
                      <img
                        src={image.image_url}
                        alt={image.title || 'Náhled obrázku'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    {editingImage?.id === image.id ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editingImage.title || ''}
                          onChange={(e) => setEditingImage({ ...editingImage, title: e.target.value })}
                          placeholder="Nadpis obrázku"
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                        <textarea
                          value={editingImage.description || ''}
                          onChange={(e) => setEditingImage({ ...editingImage, description: e.target.value })}
                          placeholder="Popis obrázku"
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateImage(image, editingImage.title || '', editingImage.description || '')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Uložit
                          </button>
                          <button
                            onClick={() => setEditingImage(null)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            Zrušit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xl font-semibold mb-2">{image.title || 'Bez názvu'}</h4>
                            <p className="text-gray-600">{image.description || 'Bez popisu'}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingImage(image)}
                              className="w-8 h-8 text-blue-600 hover:text-blue-700 flex items-center justify-center"
                              title="Upravit"
                            >
                              <Pencil size={20} />
                            </button>
                            <button
                              onClick={() => handleDeleteImage(image.id)}
                              className="w-8 h-8 text-red-500 hover:text-red-600 flex items-center justify-center"
                              title="Smazat"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Image Forms */}
      {imageForms.map((form, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-6 relative bg-white shadow-sm hover:shadow-md transition-shadow">
          <button
            onClick={() => removeImageForm(index)}
            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          >
            <X size={16} />
          </button>

          <div className="flex gap-6">
            <div className="w-1/3">
              <label className="flex flex-col items-center justify-center aspect-square w-full border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                {form.file ? (
                  <div className="relative w-full h-full">
                    <img
                      src={URL.createObjectURL(form.file)}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <p className="absolute bottom-2 left-2 right-2 text-xs text-white bg-black bg-opacity-50 p-1 rounded truncate">
                      {form.file.name}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="text-sm text-gray-500">Klikněte pro výběr obrázku</p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept={requirements.formats.join(',')}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileChange(index, file);
                  }}
                />
              </label>
            </div>

            {type === 'product' && (
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nadpis obrázku
                  </label>
                  <input
                    type="text"
                    placeholder="Zadejte nadpis obrázku"
                    value={form.title || ''}
                    onChange={(e) => handleInputChange(index, 'title', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Popis obrázku
                  </label>
                  <textarea
                    placeholder="Zadejte popis obrázku"
                    value={form.description || ''}
                    onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={addImageForm}
          className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          disabled={uploading || imageForms.length + images.length >= maxImages}
        >
          <Plus size={20} className="mr-2" />
          Přidat obrázek
        </button>

        {imageForms.length > 0 && (
          <button
            type="button"
            onClick={async () => {
              setUploading(true);
              setError(null);
              try {
                const results = await Promise.all(imageForms.map(handleUpload));
                if (results.every(Boolean)) {
                  setImageForms([]);
                  await loadImages();
                } else {
                  setError('Některé obrázky se nepodařilo nahrát');
                }
              } catch (err) {
                setError('Chyba při nahrávání obrázků');
              } finally {
                setUploading(false);
              }
            }}
            disabled={uploading || imageForms.some(form => !form.file)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Nahrávání...' : 'Nahrát obrázky'}
          </button>
        )}
      </div>
    </div>
  );
};