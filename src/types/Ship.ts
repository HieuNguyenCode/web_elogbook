

export interface Ship {
    id: string;
    name: string;
    serial?: string;
    Serial?: string;
    deviceSerial?: string;
    ownerName?: string;
    shipOwnerName?: string;
    shipOwner?: { id?: string; fullName?: string };
    ShipOwner?: { id?: string; fullName?: string };
    idshipOwner?: string;
    [key: string]: unknown;
}

export interface ShipResponse {
    name: string;
    idshipOwner: string;
    iduserAgency?: string;
    idlocations?: string;
    location?: { id: string; name?: string; code?: string };
    userAgency?: { id: string; fullName?: string };
    crews: {
        id?: string,
        idcrew?: string,
        fullName: string,
        citizenId: string,
        birthDate?: string,
        dateOfBirth?: string,
        DateOfBirth?: string,
        BirthDate?: string,
        dob?: string,
        birthday?: string,
        phone: string,
        email: string,
        address?: string,
        idcrewRole: string,
        crewRole?: { id: string },
        CrewRole?: { id: string }
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
    // Backend variations / populated fields
    id?: string;
    crew?: ShipResponse['crews'];
    ShipOwner?: { id: string; fullName?: string };
    shipOwner?: { id: string; fullName?: string };
    shipOwnerName?: string;
    mainOccupation?: { id: string };
    MainOccupation?: { id: string };
    secondaryOccupation1?: { id: string };
    SecondaryOccupation1?: { id: string };
    secondaryOccupation2?: { id: string };
    SecondaryOccupation2?: { id: string };
}