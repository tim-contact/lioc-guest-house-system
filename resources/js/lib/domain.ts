/**
 * Fuel grades, each backed by its own `{grade}_` prefixed columns.
 * Mirrors App\Enums\FuelGrade — keep the two in step.
 */
export const FUEL_GRADES = [
    { key: 'vlsfo', label: 'VLSFO' },
    { key: 'mgo', label: 'MGO' },
    { key: 'hsfo', label: 'HSFO' },
] as const;

export type FuelGradeKey = (typeof FUEL_GRADES)[number]['key'];

/**
 * The disputed parameter read three ways, distinct from the monetary dispute value.
 * Mirrors App\Models\Dispute::PARAMETER_FIELDS — keep the two in step.
 */
export const DISPUTE_PARAMETER_FIELDS = [
    { field: 'value_as_per_supply', label: 'As Per Supply' },
    { field: 'value_as_per_claim', label: 'As Per Claim' },
    { field: 'value_as_per_testing', label: 'As Per Testing' },
] as const;
