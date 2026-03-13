import { useMemo } from 'react';
import { Animal } from '@/data/animals';

export interface AnalyticsData {
  totalAnimals: number;
  dogCount: number;
  catCount: number;
  otherCount: number;
  neuteredCount: number;
  neuteredPercentage: number;
  fullyVaccinatedCount: number;
  partiallyVaccinatedCount: number;
  notVaccinatedCount: number;
  vaccinatedPercentage: number;
  approachableCount: number;
  cautionCount: number;
  aggressiveCount: number;
  maleCount: number;
  femaleCount: number;
  averageAge: number;
  withCaregiversCount: number;
  campusDistribution: Array<{ campus: string; count: number }>;
  typeDistribution: Array<{ name: string; value: number; fill: string }>;
  natureDistribution: Array<{ name: string; value: number; fill: string }>;
  vaccinationDistribution: Array<{ name: string; value: number; fill: string }>;
  genderDistribution: Array<{ name: string; value: number; fill: string }>;
}

export function useAnalytics(animals: Animal[]): AnalyticsData {
  return useMemo(() => {
    const totalAnimals = animals.length;

    // Animal type counts
    const dogCount = animals.filter(a => a.animal_type === 'Dog').length;
    const catCount = animals.filter(a => a.animal_type === 'Cat').length;
    const otherCount = animals.filter(a => a.animal_type === 'Other').length;

    // Neutered stats
    const neuteredCount = animals.filter(a => a.is_neutered).length;
    const neuteredPercentage = totalAnimals > 0 ? Math.round((neuteredCount / totalAnimals) * 100) : 0;

    // Vaccination stats
    const fullyVaccinatedCount = animals.filter(a => a.vaccination_status === 'Fully Vaccinated').length;
    const partiallyVaccinatedCount = animals.filter(a => a.vaccination_status === 'Partially Vaccinated').length;
    const notVaccinatedCount = animals.filter(a => a.vaccination_status === 'Not Vaccinated').length;
    const vaccinatedPercentage = totalAnimals > 0 ? Math.round((fullyVaccinatedCount / totalAnimals) * 100) : 0;

    // Nature stats
    const approachableCount = animals.filter(a => a.nature === 'Approachable').length;
    const cautionCount = animals.filter(a => a.nature === 'Approach with Caution').length;
    const aggressiveCount = animals.filter(a => a.nature === 'Aggressive').length;

    // Gender stats
    const maleCount = animals.filter(a => a.gender === 'Male').length;
    const femaleCount = animals.filter(a => a.gender === 'Female').length;

    // Average age
    const averageAge = totalAnimals > 0
      ? Math.round((animals.reduce((sum, a) => sum + a.age, 0) / totalAnimals) * 10) / 10
      : 0;

    // Caregivers
    const withCaregiversCount = animals.filter(a => a.caregiver_name || a.caregiver_email).length;

    // Campus distribution
    const campusMap = new Map<string, number>();
    animals.forEach(a => {
      campusMap.set(a.college_campus, (campusMap.get(a.college_campus) || 0) + 1);
    });
    const campusDistribution = Array.from(campusMap.entries())
      .map(([campus, count]) => ({ campus, count }))
      .sort((a, b) => b.count - a.count);

    // Type distribution for charts
    const typeDistribution = [
      { name: 'Dogs', value: dogCount, fill: 'hsl(var(--chart-1))' },
      { name: 'Cats', value: catCount, fill: 'hsl(var(--chart-2))' },
      { name: 'Others', value: otherCount, fill: 'hsl(var(--chart-3))' },
    ].filter(item => item.value > 0);

    // Nature distribution for charts
    const natureDistribution = [
      { name: 'Approachable', value: approachableCount, fill: '#22c55e' },
      { name: 'Caution', value: cautionCount, fill: '#eab308' },
      { name: 'Aggressive', value: aggressiveCount, fill: '#ef4444' },
    ].filter(item => item.value > 0);

    // Vaccination distribution for charts
    const vaccinationDistribution = [
      { name: 'Fully Vaccinated', value: fullyVaccinatedCount, fill: '#22c55e' },
      { name: 'Partially Vaccinated', value: partiallyVaccinatedCount, fill: '#eab308' },
      { name: 'Not Vaccinated', value: notVaccinatedCount, fill: '#ef4444' },
    ].filter(item => item.value > 0);

    // Gender distribution for charts
    const genderDistribution = [
      { name: 'Male', value: maleCount, fill: 'hsl(var(--chart-1))' },
      { name: 'Female', value: femaleCount, fill: 'hsl(var(--chart-2))' },
    ].filter(item => item.value > 0);

    return {
      totalAnimals,
      dogCount,
      catCount,
      otherCount,
      neuteredCount,
      neuteredPercentage,
      fullyVaccinatedCount,
      partiallyVaccinatedCount,
      notVaccinatedCount,
      vaccinatedPercentage,
      approachableCount,
      cautionCount,
      aggressiveCount,
      maleCount,
      femaleCount,
      averageAge,
      withCaregiversCount,
      campusDistribution,
      typeDistribution,
      natureDistribution,
      vaccinationDistribution,
      genderDistribution,
    };
  }, [animals]);
}
