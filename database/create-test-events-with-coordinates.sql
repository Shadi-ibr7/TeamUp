-- Script pour créer des événements de test avec coordonnées GPS
-- Ces événements seront visibles sur la carte

-- Supprimer les anciens événements de test (optionnel)
DELETE FROM events WHERE title LIKE 'Test:%';

-- Créer des événements de test avec coordonnées à Paris et environs
INSERT INTO events (
  title, 
  description, 
  location, 
  latitude, 
  longitude,
  date, 
  time, 
  sport_type, 
  max_participants,
  current_participants,
  organizer_id,
  is_active
) VALUES 
(
  'Football au Parc des Princes',
  'Match amical de football, tous niveaux bienvenus !',
  'Parc des Princes, Paris',
  48.8414,
  2.2530,
  CURRENT_DATE + INTERVAL '2 days',
  '18:00:00',
  'Football',
  10,
  3,
  (SELECT id FROM users LIMIT 1),
  true
),
(
  'Tennis à Roland Garros',
  'Session de tennis double, niveau intermédiaire',
  'Roland Garros, Paris',
  48.8458,
  2.2466,
  CURRENT_DATE + INTERVAL '1 day',
  '14:00:00',
  'Tennis',
  4,
  2,
  (SELECT id FROM users LIMIT 1),
  true
),
(
  'Basketball au Stade Pierre de Coubertin',
  'Tournoi 3v3 de basketball',
  'Stade Pierre de Coubertin, Paris',
  48.8354,
  2.2565,
  CURRENT_DATE + INTERVAL '3 days',
  '16:00:00',
  'Basketball',
  12,
  5,
  (SELECT id FROM users LIMIT 1),
  true
),
(
  'Running au Bois de Boulogne',
  'Course matinale de 10km dans le Bois de Boulogne',
  'Bois de Boulogne, Paris',
  48.8625,
  2.2492,
  CURRENT_DATE + INTERVAL '4 days',
  '08:00:00',
  'Running',
  20,
  8,
  (SELECT id FROM users LIMIT 1),
  true
),
(
  'Volleyball au Champ de Mars',
  'Beach volley près de la Tour Eiffel',
  'Champ de Mars, Paris',
  48.8556,
  2.2986,
  CURRENT_DATE + INTERVAL '2 days',
  '17:00:00',
  'Volleyball',
  8,
  3,
  (SELECT id FROM users LIMIT 1),
  true
),
(
  'Badminton à Vincennes',
  'Session badminton au Parc Floral',
  'Parc Floral de Paris, Vincennes',
  48.8373,
  2.4417,
  CURRENT_DATE + INTERVAL '5 days',
  '15:00:00',
  'Badminton',
  6,
  2,
  (SELECT id FROM users LIMIT 1),
  true
),
(
  'Swimming à la Piscine Molitor',
  'Entraînement natation, tous niveaux',
  'Piscine Molitor, Paris',
  48.8449,
  2.2524,
  CURRENT_DATE + INTERVAL '1 day',
  '19:00:00',
  'Swimming',
  15,
  7,
  (SELECT id FROM users LIMIT 1),
  true
),
(
  'Cycling au Bois de Vincennes',
  'Sortie vélo de 30km',
  'Bois de Vincennes, Paris',
  48.8283,
  2.4333,
  CURRENT_DATE + INTERVAL '6 days',
  '09:00:00',
  'Cycling',
  10,
  4,
  (SELECT id FROM users LIMIT 1),
  true
);

-- Vérifier les événements créés
SELECT 
  id, 
  title, 
  location, 
  latitude, 
  longitude, 
  date, 
  time, 
  sport_type,
  current_participants || '/' || max_participants as participants
FROM events 
WHERE is_active = true
ORDER BY date, time;
