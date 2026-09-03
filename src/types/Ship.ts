

export interface Ship {
    id: string;
    name: string;
}

export interface ShipResponse {
    name: string;
    idshipOwner: string;
    crews: {
        fullName: string,
        citizenId: string,
        phone: string,
        email: string,
        address?: string,
        idcrewRole: string
    }[];
    serial: string;
    miningLicenseNumber?: string;
    expirationDateOfMiningLicenseNumber?: string;
    lengthOverall: number;
    totalPower: number;
    fishingGearSpecifications: string;
    dimension1: number;
    dimension2: number;
    mainOccupationId: string;
    secondaryOccupationId1?: string;
    secondaryOccupationId2?: string;
}