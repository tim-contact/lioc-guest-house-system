export function cleanSearchText(value: unknown): string {
    return String(value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase();
}

export function searchIncludes(value: unknown, query: unknown): boolean {
    const cleanedQuery = cleanSearchText(query);

    return cleanedQuery === '' || cleanSearchText(value).includes(cleanedQuery);
}
