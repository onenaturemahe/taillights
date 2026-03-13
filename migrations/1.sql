
CREATE TABLE animals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  photo_url TEXT,
  animal_type TEXT NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  is_neutered BOOLEAN NOT NULL,
  vaccination_status TEXT NOT NULL,
  area_of_living TEXT NOT NULL,
  nature TEXT NOT NULL,
  college_campus TEXT NOT NULL,
  caregiver_name_1 TEXT,
  caregiver_name_2 TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_animals_campus ON animals(college_campus);
CREATE INDEX idx_animals_type ON animals(animal_type);
CREATE INDEX idx_animals_nature ON animals(nature);

INSERT INTO animals (photo_url, animal_type, name, age, gender, is_neutered, vaccination_status, area_of_living, nature, college_campus, caregiver_name_1, caregiver_name_2) VALUES
('https://019c47b3-8c68-7500-821d-24c75a1d5010.mochausercontent.com/82ac69dc-2218-488d-8633-c06a155f8ad1.jpeg', 'Dog', 'Sheeba', 3, 'Female', 1, 'Fully Vaccinated', 'NIH Blocks A, B, C', 'Approachable', 'Manipal Campus', 'Samyak Pandey (PhD Scholar)', 'Mallika Vohra (Student, MCODS)'),
('https://images.unsplash.com/photo-1543466835-00a7907e9de1', 'Dog', 'Rocky', 2, 'Male', 0, 'Partially Vaccinated', 'Block A Hostel', 'Approach with Caution', 'Manipal Campus', 'Rahul Sharma', NULL),
('https://images.unsplash.com/photo-1574158622682-e40e69881006', 'Cat', 'Luna', 1, 'Female', 1, 'Fully Vaccinated', 'Library Area', 'Approachable', 'Manipal Campus', 'Priya Nair', 'Amit Kumar'),
('https://images.unsplash.com/photo-1611003228941-98852ba62227', 'Dog', 'Max', 5, 'Male', 1, 'Not Vaccinated', 'Canteen Area', 'Aggressive', 'MIT Manipal', 'Vikram Singh', NULL);
