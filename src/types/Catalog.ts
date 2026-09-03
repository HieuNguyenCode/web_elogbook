// Tỉnh / thành phố
export interface Locations {
    id: string;
    name: string;
    code: string;
}

// Cảng
export interface Ports {
    id: string;
    name: string;
    code: string;
    type: string;
    lat: number;
    lng: number;
    location: Locations;
}

// Nghề khai thác
export interface Occupations {
    id: string;
    code: string;
    name: string;
}

// Loài cá
export interface Species {
    id: string;
    vietnameseName: string;
    scientificName: string;
    code: string;
    group?: string;
    imageUrl?: string;
}

// Loài cá quý hiếm
export interface RareSpecies {
    id: string;
    name: string;
    code: string;
    protectionLevel: string;
    note?: string;
    isActive: boolean;
    scientificName?: string;
    group?: string;
    idclass?: string;
    nameClass?: string;
    nameClassScientific?: string;
    numericalOrder?: number;
    closedSeason?: string;
    minimumSize?: number;
    sizeNote?: number;
}

export interface FishingAreas {
    id: string;
    name: string;
    code: string;
}

export interface CrewRoles {
    id: string;
    code: string;
    description: string;
}