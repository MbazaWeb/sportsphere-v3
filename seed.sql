-- Clear existing players demo data if needed
TRUNCATE TABLE players RESTART IDENTITY CASCADE;

-- Insert Seed Players with PPI Scores and Ranks
INSERT INTO players (
    id, full_name, photo_url, date_of_birth, nationality, height_cm, weight_kg,
    sport, position, jersey_number, current_team, dominant_side, years_experience,
    matches_played, goals_points, assists, ppi_score, efficiency_rate, global_rank,
    category_rank, percentile_tier, achievements, skills, coach_name, biography
) VALUES 
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Kylian Mbappé',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
    '1998-12-20', 'French', 178, 75,
    'Football', 'Forward', 9, 'Real Madrid CF', 'Right', 9,
    200, 178, 62, 94.50, 89.00, 1, 1, 'World Class (S+)',
    ARRAY['FIFA World Cup Winner (2018)', 'FIFA World Cup Golden Boot (2022)'],
    ARRAY['Pace & Acceleration', 'Clinical Finishing', 'Dribbling'],
    'Carlo Ancelotti',
    'Explosive forward known for world-class acceleration, precise dribbling, and elite goalscoring.'
),
(
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Kevin De Bruyne',
    'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=400&q=80',
    '1991-06-28', 'Belgian', 181, 70,
    'Football', 'Midfielder', 17, 'Manchester City', 'Right', 12,
    350, 102, 170, 91.20, 77.70, 2, 1, 'World Class (S+)',
    ARRAY['UEFA Champions League Winner (2023)', '2x Premier League Player of the Season'],
    ARRAY['Vision & Passing', 'Long Range Shooting', 'Set Piece Specialist'],
    'Pep Guardiola',
    'Master playmaker renowned for surgical passing vision, crossing precision, and match intelligence.'
),
(
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'Thibaut Courtois',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80',
    '1992-05-11', 'Belgian', 200, 96,
    'Football', 'Goalkeeper', 1, 'Real Madrid CF', 'Left', 14,
    420, 0, 2, 88.40, 45.20, 5, 1, 'Elite (A)',
    ARRAY['2x UEFA Champions League Winner', 'The Best FIFA Goalkeeper (2018)'],
    ARRAY['Shot Stopping', 'Aerial Command', 'Reflexes'],
    'Carlo Ancelotti',
    'Towering goalkeeper known for unmatched shot-stopping reach and big-match reliability.'
);
EOFcat << 'EOF' > /var/www/sportsphere-nextjs/seed.sql
-- Clear existing players demo data if needed
TRUNCATE TABLE players RESTART IDENTITY CASCADE;

-- Insert Seed Players with PPI Scores and Ranks
INSERT INTO players (
    id, full_name, photo_url, date_of_birth, nationality, height_cm, weight_kg,
    sport, position, jersey_number, current_team, dominant_side, years_experience,
    matches_played, goals_points, assists, ppi_score, efficiency_rate, global_rank,
    category_rank, percentile_tier, achievements, skills, coach_name, biography
) VALUES 
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Kylian Mbappé',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
    '1998-12-20', 'French', 178, 75,
    'Football', 'Forward', 9, 'Real Madrid CF', 'Right', 9,
    200, 178, 62, 94.50, 89.00, 1, 1, 'World Class (S+)',
    ARRAY['FIFA World Cup Winner (2018)', 'FIFA World Cup Golden Boot (2022)'],
    ARRAY['Pace & Acceleration', 'Clinical Finishing', 'Dribbling'],
    'Carlo Ancelotti',
    'Explosive forward known for world-class acceleration, precise dribbling, and elite goalscoring.'
),
(
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Kevin De Bruyne',
    'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=400&q=80',
    '1991-06-28', 'Belgian', 181, 70,
    'Football', 'Midfielder', 17, 'Manchester City', 'Right', 12,
    350, 102, 170, 91.20, 77.70, 2, 1, 'World Class (S+)',
    ARRAY['UEFA Champions League Winner (2023)', '2x Premier League Player of the Season'],
    ARRAY['Vision & Passing', 'Long Range Shooting', 'Set Piece Specialist'],
    'Pep Guardiola',
    'Master playmaker renowned for surgical passing vision, crossing precision, and match intelligence.'
),
(
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'Thibaut Courtois',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80',
    '1992-05-11', 'Belgian', 200, 96,
    'Football', 'Goalkeeper', 1, 'Real Madrid CF', 'Left', 14,
    420, 0, 2, 88.40, 45.20, 5, 1, 'Elite (A)',
    ARRAY['2x UEFA Champions League Winner', 'The Best FIFA Goalkeeper (2018)'],
    ARRAY['Shot Stopping', 'Aerial Command', 'Reflexes'],
    'Carlo Ancelotti',
    'Towering goalkeeper known for unmatched shot-stopping reach and big-match reliability.'
);
