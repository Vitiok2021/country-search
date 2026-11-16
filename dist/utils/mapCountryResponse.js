export function mapCountryResponse(raw) {
    return {
        name: raw.name,
        alpha3Code: raw.alpha3Code,
        region: raw.region,
        population: raw.population,
        flag: raw.flag,
        capital: raw.capital ?? 'N/A',
        subregion: raw.subregion ?? 'N/A',
        area: raw.area ?? null,
        borders: raw.borders ?? [],
        languages: raw.languages?.map((language) => language.name) ?? [],
        currencies: raw.currencies?.map((currency) => currency.name) ?? [],
    };
}
