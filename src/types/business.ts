export interface BusinessFormData {
  name: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  street_address: string;
  city: string;
  postal_code: string;
}

export interface BusinessImage {
  id: string;
  business_id: string;
  image_url: string;
  title?: string;
  description?: string;
  type: 'product' | 'company';
  order: number;
  created_at: Date;
}

export interface CreateBusinessImageDTO {
  id?: string;
  business_id: string;
  image_url: string;
  title?: string;
  description?: string;
  type: 'product' | 'company';
  order?: number;
}