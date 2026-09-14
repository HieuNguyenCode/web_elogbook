

export interface Ship {
    id: string;
    name: string;
    serial?: string;
    Serial?: string;
    deviceSerial?: string;
    ownerName?: string;
    [key: string]: any;
}

export interface ShipResponse {
    name: string;
    idshipOwner: string;
    crews: {
        id?: string,
        fullName: string,
        citizenId: string,
        birthDate?: string,
        dateOfBirth?: string,
        phone: string,
        email: string,
        address?: string,
        idcrewRole: string
    }[];
    serial: string;
    installationDate?: string;
    deviceSerial?: string;
    miningLicenseNumber?: string;
    expirationDateOfMiningLicenseNumber?: string;
    lengthOverall: number;
    totalPower: number;
    fishingGearSpecifications?: string;
    dimension1?: number;
    dimension2?: number;
    mainOccupationId: string;
    secondaryOccupationId1?: string;
    secondaryOccupationId2?: string;
}