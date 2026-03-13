export interface Animal {
  id: string;
  photo_url?: string;
  animal_type: 'Dog' | 'Cat' | 'Other';
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  is_neutered: boolean;
  vaccination_status: 'Fully Vaccinated' | 'Partially Vaccinated' | 'Not Vaccinated';
  area_of_living: string;
  nature: 'Approachable' | 'Approach with Caution' | 'Aggressive';
  college_campus: string;
  caregiver_name?: string;
  caregiver_mobile?: string;
  caregiver_email?: string;
}

export const MAHE_CAMPUSES = [
  'Kasturba Medical College (KMC), Manipal',
  'Manipal Institute of Technology (MIT), Manipal',
  'Manipal School of Architecture and Planning (MSAP), Manipal',
  'T. A. Pai Management Institute (TAPMI), Manipal',
  'Manipal College of Pharmaceutical Sciences (MCOPS), Manipal',
  'Manipal College of Health Professions (MCHP), Manipal',
  'Manipal College of Nursing (MCON), Manipal',
  'Manipal School of Life Sciences (MSLS), Manipal',
  'Manipal Academy of Professional Studies (MAPS), Manipal',
  'Manipal College of Dental Sciences (MCODS), Manipal',
  'Manipal School of Information Sciences (MSIS), Manipal',
  'Welcomgroup Graduate School of Hotel Administration (WGSHA), Manipal',
  'Manipal Institute of Communication (MIC), Manipal',
  'Manipal Institute of Management (MIM), Manipal',
  'Manipal School of Commerce & Economics (MSCE), Manipal',
  'International Centre for Applied Sciences (ICAS), Manipal',
  'Manipal Centre for Humanities (MCH), Manipal',
];

export const sampleAnimals: Animal[] = [
  {
    id: '1',
    photo_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb',
    animal_type: 'Dog',
    name: 'Sheeba',
    age: 3,
    gender: 'Female',
    is_neutered: true,
    vaccination_status: 'Fully Vaccinated',
    area_of_living: 'NIH Blocks A, B, C',
    nature: 'Approachable',
    college_campus: 'Manipal College of Dental Sciences (MCODS), Manipal',
    caregiver_name: 'Samyak Pandey (PhD Scholar)',
    caregiver_email: 'mallika.vohra@learner.manipal.edu',
  },
  {
    id: '2',
    photo_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1',
    animal_type: 'Dog',
    name: 'Rocky',
    age: 2,
    gender: 'Male',
    is_neutered: false,
    vaccination_status: 'Partially Vaccinated',
    area_of_living: 'Block A Hostel',
    nature: 'Approach with Caution',
    college_campus: 'Manipal Institute of Technology (MIT), Manipal',
    caregiver_name: 'Rahul Sharma',
  },
  {
    id: '3',
    photo_url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006',
    animal_type: 'Cat',
    name: 'Luna',
    age: 1,
    gender: 'Female',
    is_neutered: true,
    vaccination_status: 'Fully Vaccinated',
    area_of_living: 'Library Area',
    nature: 'Approachable',
    college_campus: 'Manipal School of Information Sciences (MSIS), Manipal',
    caregiver_name: 'Priya Nair',
    caregiver_email: 'amit.kumar@learner.manipal.edu',
  },
  {
    id: '4',
    photo_url: 'https://images.unsplash.com/photo-1611003228941-98852ba62227',
    animal_type: 'Dog',
    name: 'Max',
    age: 5,
    gender: 'Male',
    is_neutered: true,
    vaccination_status: 'Not Vaccinated',
    area_of_living: 'Canteen Area',
    nature: 'Aggressive',
    college_campus: 'Kasturba Medical College (KMC), Manipal',
    caregiver_name: 'Vikram Singh',
  },
];
