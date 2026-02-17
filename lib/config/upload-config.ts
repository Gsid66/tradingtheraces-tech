import { ReactNode } from 'react';

export interface UploadConfig {
  id: string;
  name: string;
  apiEndpoint: string;
  tableName: string;
  acceptedFormats: string;
  instructions: {
    title: string;
    columns: string[];
    notes?: string[];
  };
  color: {
    primary: string;
    light: string;
    hover: string;
    text: string;
  };
  viewRoute?: string;
}

export const uploadConfigs: UploadConfig[] = [
  {
    id: 'ttr-au-nz-ratings',
    name: 'TTR AU/NZ Ratings',
    apiEndpoint: '/api/ttr-au-nz-ratings/upload',
    tableName: 'race_cards_ratings',
    acceptedFormats: '.csv,.txt',
    instructions: {
      title: 'CSV Format Requirements',
      columns: [
        'Date: Format: "Friday, 14th November 2025" or "14/11/2025"',
        'Track: Track name (e.g., "Flemington", "Randwick")',
        'Race: Format: "Race 1 - Full Race Name"',
        'SaddleCloth: Saddle cloth number (optional)',
        'Horse: Horse name',
        'Jockey: Jockey name (optional)',
        'Trainer: Trainer name (optional)',
        'Rating: Rating value (optional, integer)',
        'Price: Format: "$2.36" (optional)',
      ],
      notes: ['AU/NZ data is typically tab-delimited, not comma-separated.'],
    },
    color: {
      primary: 'green-600',
      light: 'green-50',
      hover: 'green-700',
      text: 'green-800',
    },
    viewRoute: '/ttr-au-nz-ratings',
  },
  {
    id: 'ttr-uk-ire-ratings',
    name: 'TTR UK/Ireland Ratings',
    apiEndpoint: '/api/ttr-uk-ire-ratings/upload',
    tableName: 'ttr_uk_ire_ratings',
    acceptedFormats: '.csv,.txt',
    instructions: {
      title: 'CSV Format Requirements',
      columns: [
        'Date: Format: "Sunday, 15th February 2026"',
        'Track: Track name (e.g., "Musselburgh")',
        'Race: Format: "Race 1 - Full Race Name"',
        'SaddleCloth: Saddle cloth number (optional)',
        'Horse: Horse name',
        'Jockey: Jockey name (optional)',
        'Trainer: Trainer name (optional)',
        'Rating: Rating value (optional)',
        'Price: Format: "$2.15" (optional)',
      ],
    },
    color: {
      primary: 'purple-600',
      light: 'purple-50',
      hover: 'purple-700',
      text: 'purple-800',
    },
    viewRoute: '/ttr-uk-ire-ratings',
  },
];
