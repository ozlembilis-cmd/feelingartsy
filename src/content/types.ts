export interface Source {
  label: string;
  url: string;
}
export interface Artwork {
  id: string;
  title: string;
  artist: string;
  date: string;
  medium: string;
  collection: string;
  culture: string;
  period: string;
  dimensions: {
    widthCm: number;
    heightCm: number;
    source: string;
    note?: string;
  } | null;
  image: {
    provenance?: 'museum' | 'user-supplied';
    src: string;
    alt: string;
    source: string;
    credit: string;
    license: string;
    permissionUrl: string;
    review: 'approved' | 'pending';
    reviewedAt: string;
  };
  story: { behind: string; matters: string; closer: string; more?: string };
  artistChoices: string[];
  sources: Source[];
  status: 'published' | 'rights-pending' | 'research-needed' | 'planned';
  verifiedArtworkDimensions?: {
    widthCm: number | null;
    heightCm: number | null;
    source: string;
  };
  statusNote?: string;
}
