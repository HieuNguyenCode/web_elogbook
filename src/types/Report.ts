export interface TopFishDto {
    fishName: string;
    totalWeight: number;
    FishName?: string;
    TotalWeight?: number;
}

export interface MonthlyVoyageReportDto {
    timeLabel: string;
    activeVoyagesCount: number;
    departuresThisMonthCount: number;
    sumWeightFishingHauls: number;
    sumWeightTransshipments: number;
    topFishFishingHauls: TopFishDto[];
    topFishTransshipments: TopFishDto[];

    TimeLabel?: string;
    ActiveVoyagesCount?: number;
    DeparturesThisMonthCount?: number;
    SumWeightFishingHauls?: number;
    SumWeightTransshipments?: number;
    TopFishFishingHauls?: TopFishDto[];
    TopFishTransshipments?: TopFishDto[];
}

export interface ReportDto {
    countShip: number;
    voyagesCountMonth: MonthlyVoyageReportDto[];

    CountShip?: number;
    VoyagesCountMonth?: MonthlyVoyageReportDto[];
}
