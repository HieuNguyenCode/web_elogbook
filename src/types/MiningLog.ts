export interface LeavingPortsDto {
    id: string; // idSeaVoyage
    shipName: string;
    portStart: string;
    departureDate: string;
    miningLicenseNumber?: string;
    expirationDateOfMiningLicenseNumber?: string;
    type: string;
    mainOccupation: string;
}

export interface ArrivingPortsDto {
    id: string; // idSeaVoyage
    shipName: string;
    portStart: string;
    departureDate: string;
    miningLicenseNumber?: string;
    expirationDateOfMiningLicenseNumber?: string;
    type: string;
    mainOccupation: string;
    totalQuantity: number;
}

export interface PortDto {
    id: string;
    name: string;
    code?: string;
    lat?: number;
    lng?: number;
}

export interface OccupationDto {
    id: string;
    name: string;
    code?: string;
    lat?: number;
    lng?: number;
}

export interface FishDto {
    idtypeOfFish: string;
    vietnameseName: string;
    scientificName: string;
    code: string;
}

export interface CatchDetailDto {
    fish: FishDto;
    weight: number;
}

export interface FishingHaulDto {
    haulNumber: number;
    deployLatitude: number;
    deployLongitude: number;
    deployTime: string;
    haulLatitude: number;
    haulLongitude: number;
    haulTime: string;
    catchDetails: CatchDetailDto[];
}

export interface TransshipmentDetailDto {
    fish: FishDto;
    weight: number;
}

export interface TransshipmentEventDto {
    shipNameSeller: string;
    departureRecordNoSeller: string;
    latitude: number;
    longitude: number;
    transshipmentTime: string;
    fishingHauls?: FishingHaulDto[];
    transshipmentDetails: TransshipmentDetailDto[];
}

export interface RarefishreportDto {
    haulNumber: number;
    rareSpecieName: string;
    timeOfEncounter: string;
    weight: number;
    quantity: number;
    size: number;
    progress?: string;
    status: string;
}

export interface CrewDto {
    id: string;
    fullName: string;
    citizenId?: string;
    phone?: string;
    crewRole?: {
        id: string;
        code: string;
        description: string;
    };
}

export interface MiningLogDto {
    id: string;
    shipName: string;
    shipOwnerFullName: string;
    shipOwnerCitizenId: string;
    shipOwnerBirthDate?: string;
    shipOwnerAddress?: string;
    shipOwnerPhone?: string;
    shipOwnerEmail?: string;
    idtrip: string;
    departureRecordNo?: string;
    departureDate: string;
    portStart: PortDto;
    type: string;
    miningLicenseNumber?: string;
    expirationDateOfMiningLicenseNumber?: string;
    fishingGearSpecifications: string;
    dimension1: number;
    dimension2: number;
    mainOccupation: OccupationDto;
    secondaryOccupation1?: OccupationDto;
    secondaryOccupation2?: OccupationDto;
    arrivalRecordNo?: string;
    portEnd?: PortDto;
    arrivalDate?: string;
    fishingHauls: FishingHaulDto[];
    transshipmentEvents?: TransshipmentEventDto[];
    rareFishReports?: RarefishreportDto[];
    crew?: CrewDto[];
}
