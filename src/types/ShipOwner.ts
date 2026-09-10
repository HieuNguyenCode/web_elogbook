export interface ShipOwnerPayload extends ShipOwner {
    birthDate?: string;
    phone?: string;
    email?: string;
    address?: string;
}

export interface ShipOwner {
    id: string;
    fullName: string;
    citizenId: string;
    birthDate?: string;
    phone?: string;
    address?: string;
    email?: string;
    [key: string]: any;
}