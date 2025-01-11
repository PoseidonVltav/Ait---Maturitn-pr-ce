import React, { useState } from 'react';
import { businessImagesService } from '../../services/businessImages';
import { Upload, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Props {
  businessId: string;
  onUploadComplete?: () => void;
  type?: 'product' | 'company';
  maxImages?: number;
}

interface ImageForm {
  file: File | null;
  title?: string;
  description?: string;
}

const initialImageForm = {
  file: null,
  title: '',
  description: ''
};

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
  onUploadComplete,
  type = 'product',
  maxImages = type === 'product' ? 20 : 2
}) => {
  const [imageForms, setImageForms] = useState<ImageForm[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requirements = IMAGE_REQUIREMENTS[type];

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
    if (imageForms.length >= maxImages) {
      setError(`Maximální počet obrázků: ${maxImages}`);
      return;
    }
    setImageForms(prev => [...prev, { ...initialImageForm }]);
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

  const handleSubmit = async () => {
    setError(null);
    setUploading(true);

    try {
      const results = await Promise.all(imageForms.map(handleUpload));
      
      if (results.every(Boolean)) {
        setImageForms([]);
        onUploadComplete?.();
      } else {
        setError('Některé obrázky se nepodařilo nahrát');
      }
    } catch (err) {
      setError('Chyba při nahrávání obrázků');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
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

      {imageForms.map((form, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
          <button
            onClick={() => removeImageForm(index)}
            className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
            type="button"
          >
            <X size={20} />
          </button>

          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                {form.file ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={URL.createObjectURL(form.file)}
                      alt="Preview"
                      className="h-24 object-contain"
                    />
                    <p className="text-sm text-gray-500">{form.file.name}</p>
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
              <>
                <input
                  type="text"
                  placeholder="Nadpis obrázku (volitelné)"
                  value={form.title || ''}
                  onChange={(e) => handleInputChange(index, 'title', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />

                <textarea
                  placeholder="Popis obrázku (volitelné)"
                  value={form.description || ''}
                  onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </>
            )}
          </div>
        </div>
      ))}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={addImageForm}
          className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          disabled={uploading || imageForms.length >= maxImages}
        >
          <Plus size={20} className="mr-2" />
          Přidat obrázek
        </button>

        {imageForms.length > 0 && (
          <button
            type="button"
            onClick={handleSubmit}
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