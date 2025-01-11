export interface Business {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  href: string;
}