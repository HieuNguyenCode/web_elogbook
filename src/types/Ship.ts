import type {ShipOwnerPayload} from "./ShipOwner.ts";
import type {CrewRoles, Occupations} from "./Catalog.ts";

export interface ShipPayload extends Ship {
    shipOwner: ShipOwnerPayload;
    crew: CrewPayload[];
    serial: string;
    MiningLicenseNumber: string;
    ExpirationDateOfMiningLicenseNumber: string;
    lengthOverall: number;
    totalPower: number;
    fishingGearSpecifications: number;
    Dimension1: number;
    Dimension2: number;
    MainOccupation: Occupations;
    SecondaryOccupation1: Occupations;
    SecondaryOccupation2: Occupations;
}

export interface Ship {
    id: string;
    name: string;
}

export interface CrewPayload extends ShipPayload {
    crewRole: CrewRoles
}