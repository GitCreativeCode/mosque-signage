export interface CalculationMethodOption {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

export const CALCULATION_METHODS: readonly CalculationMethodOption[] = [
  {
    id: 'NorthAmerica',
    label: 'ISNA (Islamic Society of North America)',
    description: 'Fajr 15°, Isha 15° - Standard for US & Canada',
  },
  {
    id: 'MuslimWorldLeague',
    label: 'Muslim World League (MWL)',
    description: 'Fajr 18°, Isha 17° - Standard for Europe, Far East & parts of Americas',
  },
  {
    id: 'Egyptian',
    label: 'Egyptian General Authority of Survey',
    description: 'Fajr 19.5°, Isha 17.5° - Standard for Egypt, Africa & Syria',
  },
  {
    id: 'Karachi',
    label: 'University of Islamic Sciences, Karachi',
    description: 'Fajr 18°, Isha 18° - Standard for Pakistan, India, Bangladesh, Afghanistan',
  },
  {
    id: 'UmmAlQura',
    label: 'Umm al-Qura University, Makkah',
    description: 'Fajr 18.5°, Isha 90min after Maghrib - Standard for Saudi Arabia & Gulf',
  },
  {
    id: 'Dubai',
    label: 'Dubai Islamic Affairs',
    description: 'Fajr 18.2°, Isha 18.2° - Standard for UAE',
  },
  {
    id: 'MoonsightingCommittee',
    label: 'Moonsighting Committee Worldwide',
    description: 'Fajr 18°, Isha 18° with seasonal high-latitude adjustments',
  },
];

