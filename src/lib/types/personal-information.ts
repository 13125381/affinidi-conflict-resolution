export interface IAddress {
    addressCountry: string;
    addressLocality: string;
    addressRegion: string;
}

export interface IPerson {
    address?: IAddress[];
    birthdate?: string;
    email: string;
    familyName?: string;
}

export interface IActivities {
    activity: string;
    frequency: string;
}

export interface IFitness {
    fitnessGoals: string[];
    activities: IActivities[];
}

export interface ICategories {
    fitness: IFitness;
}

export interface ICredentialSubject {
    person: IPerson;
    categories: ICategories;
}

export interface IPersonalInformation {
    did: string;
    credentialSubject: ICredentialSubject;
}