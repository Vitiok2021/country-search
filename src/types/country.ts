export interface RawCountry {
  name: string;
  alpha3Code: string;
  capital?: string;
  region: string;
  subregion?: string;
  population: number;
  area?: number;
  flag: string;
  borders?: string[];
  languages?: {
    name: string;
  }[];

  currencies?: {
    name: string;
    code: string;
  }[];
}

export interface Country {
  name: string;
  alpha3Code: string;
  capital: string;
  region: string;
  subregion: string;
  population: number;
  area: number | null;
  flag: string;
  borders: string[];
  languages: string[];
  currencies: string[];
}
