import type {
    CrewRoles,
    FishingAreas,
    Locations,
    Occupations,
    Ports,
    RareSpecies,
    Species
} from "../../../types/Catalog.ts";
import {axiosClient} from "../../../utils/axiosClient.ts";

export const portsAPI = async (): Promise<Ports> => {
    const data = await axiosClient.get<any, any>(`/api/v2/Catalog/Ports`);
    return data.data;
}

export const speciesAPI = async (): Promise<Species> => {
    const data = await axiosClient.get<any, any>(`/api/v2/Catalog/Species`);
    return data.data;
}

export const fishingAreasAPI = async (): Promise<FishingAreas> => {
    const data = await axiosClient.get<any, any>(`/api/v2/Catalog/FishingAreas`);
    return data.data;
}

export const rareSpeciesAPI = async (): Promise<RareSpecies> => {
    const data = await axiosClient.get<any, any>(`/api/v2/Catalog/RareSpecies`);
    return data.data;
}

export const crewRolesAPI = async (): Promise<CrewRoles> => {
    const data = await axiosClient.get<any, any>(`/api/v2/Catalog/CrewRoles`);
    return data.data;
}

export const occupationsAPI = async (): Promise<Occupations> => {
    const data = await axiosClient.get<any, any>(`/api/v2/Catalog/Occupations`);
    return data.data;
}

export const LocationsAPI = async (): Promise<Locations> => {
    const data = await axiosClient.get<any, any>(`/api/v2/Catalog/Locations`);
    return data.data;
}
