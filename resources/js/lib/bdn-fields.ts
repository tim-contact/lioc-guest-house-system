/**
 * The per-grade and per-sample columns of a Bunker Delivery Note.
 * Mirrors App\Models\Bdn's TIMESHEET_FIELDS / QUALITY_FIELDS / SAMPLE_TYPES —
 * keep the two in step. Consumed by the surveyor's entry dialog and the
 * admin BDN table + export, so both label the same column identically.
 */
export const TIMESHEET_FIELDS = [
    { field: 'hose_connected_at', label: 'Hose Connected' },
    { field: 'pumping_started_at', label: 'Commenced Pumping' },
    { field: 'pumping_ended_at', label: 'Completed Pumping' },
    { field: 'hose_disconnected_at', label: 'Hose Disconnected' },
    { field: 'docs_completed_at', label: 'Documentation Completed' },
    { field: 'cast_off_at', label: 'Barge Cast Off' },
] as const;

export const QUALITY_FIELDS = [
    { field: 'density_15', label: 'Density @ 15 Deg', step: '0.0001' },
    { field: 'sulphur_pct', label: 'Sulphur % (w/w)', step: '0.001' },
    { field: 'viscosity_50', label: 'Viscosity @ 50 Deg', step: '0.1' },
    { field: 'flash_point', label: 'Flash Point', step: '0.1' },
    { field: 'kilo_liter', label: 'Kilo Liter', step: '0.001' },
    { field: 'metric_ton', label: 'Metric Ton', step: '0.001' },
] as const;

/** `label` prompts the form field; `name` heads the spreadsheet column. */
export const SEALS = [
    { prefix: 'marpol', name: 'MARPOL', label: 'Sample Seal Number of MARPOL' },
    { prefix: 'vessel', name: 'Vessel', label: 'Sample Seal Number of Vessel' },
    { prefix: 'barge', name: 'Barge', label: 'Sample Seal Number of Barge' },
    {
        prefix: 'retention',
        name: 'Retention',
        label: 'Sample Seal Number of Retention',
    },
] as const;
