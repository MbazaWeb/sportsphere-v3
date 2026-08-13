import paramiko, json, re

HOST, USER, PASS = '104.152.50.173', 'deploy', 'Rehema@1234!'

TEAM_ID = 'ftz-azam'
TEAM_UPDATE = """
UPDATE "Team" SET
  name = 'Azam FC',
  slug = 'azam-fc',
  venue = 'Azam Complex',
  city = 'Dar es Salaam',
  country = 'Tanzania',
  "countryCode" = 'TZ',
  "logoUrl" = 'https://img.a.transfermarkt.technology/wappen/head/28970.png?lm=1',
  "shortName" = 'AZAM',
  metadata = '{"stadiumSeats": 10000, "stadiumName": "Azam Complex", "squadSize": 34, "averageAge": 25.0, "foreigners": 16, "foreignerPercent": 47.1, "nationalTeamPlayers": 14, "transferRecord": -25000, "season": "2025/26"}'::jsonb,
  "updatedAt" = NOW()
WHERE id = 'ftz-azam';
"""

# Player data: (number, name, position, dob, nationality, height_cm, foot, joined, signed_from, contract, market_value_eur)
PLAYERS = [
    (32, "Zuberi Foba", "Goalkeeper", "2002-05-23", "Tanzania", None, None, None, None, None, 200000),
    (None, "Aishi Salum Manula", "Goalkeeper", "1995-09-13", "Tanzania", 183, "left", "2025-07-09", "Simba SC", "2028-06-30", 150000),
    (None, "Issa Fofana", "Goalkeeper", "1992-06-15", "Mali", None, None, "2025-07-01", "Jeanne d'Arc FC Bamako", None, None),
    (None, "Anthony Remmy Mpemba", "Goalkeeper", "2005-12-09", "Tanzania", None, None, None, None, None, None),
    (1, "Issa Fofana", "Goalkeeper", "2004-01-30", "Cote d'Ivoire", 190, "right", "2025-08-15", "Al-Hilal Club (Omdurman)", "2027-06-30", None),
    (5, "Lusajo Mwaikenda", "Centre-Back", "2000-10-27", "Tanzania", 174, "right", None, None, None, 150000),
    (25, "Nuru Twalib", "Centre-Back", "2005-01-28", "Tanzania", None, None, "2024-07-01", "Azam FC U19", None, 50000),
    (None, "Lameck Lawi", "Centre-Back", "2005-09-12", "Tanzania", None, None, "2025-07-03", "Coastal Union", None, 25000),
    (None, "Henri Stanic", "Centre-Back", "2002-07-18", "Belgium", 194, "right", "2026-07-15", "Stellenbosch FC", "2027-06-30", None),
    (24, "Yeison Fuentes", "Centre-Back", "2002-07-11", "Colombia", 182, "right", "2024-01-13", "Leones FC", None, None),
    (None, "Abdalla Kheri", "Centre-Back", "1996-10-10", "Tanzania", None, None, "2017-01-01", "Ndanda FC", None, None),
    (None, "Lupini Mawuku Dieumerci", "Centre-Back", "2005-12-22", "DR Congo", None, None, "2026-07-18", "AS Maniema Union", None, None),
    (27, "Ahoutou Angenor Zouzou", "Centre-Back", "2001-05-27", "Cote d'Ivoire", 183, None, "2025-01-01", "AFAD-Plateau", None, None),
    (None, "Taiwo Abdulrafiu", "Left-Back", "2002-04-20", "Nigeria", 190, "left", "2026-07-23", "Rivers United FC", None, 125000),
    (12, "Pascal Msindo", "Left-Back", "2003-08-15", "Tanzania", None, "left", "2022-07-01", "Azam FC U19", "2027-06-30", 75000),
    (None, "Ashrafu Shabani Kibeku", "Right-Back", "2006-12-20", "Tanzania", None, None, None, None, None, None),
    (None, "Donovan Makoma", "Defensive Midfield", "1999-02-01", "France", 190, "right", "2026-07-22", "Birkirkara FC", None, 350000),
    (None, "Himid Mao Mkami", "Defensive Midfield", "1992-11-05", "Tanzania", 177, "right", "2025-07-10", "Tala'ea El Gaish", "2026-06-30", None),
    (None, "Mzee Mzee", "Midfielder", "2005-08-15", "Zanzibar", None, None, "2025-07-01", "Kikosi Maalum cha Kuzuia Magendo FC", None, None),
    (None, "Abdulkarim Kassim Kiswanya", "Midfielder", "2005-02-24", "Tanzania", None, None, "2026-07-01", "Azam FC U19", None, None),
    (8, "Sadio Kanoute", "Central Midfield", "1996-10-21", "Mali", 186, "right", "2025-08-11", "Without Club", "2027-06-30", None),
    (6, "Feisal Salum", "Attacking Midfield", "1998-01-11", "Tanzania", 178, "right", "2023-07-01", "Young Africans SC", "2027-06-30", 300000),
    (21, "Yahya Zayd", "Attacking Midfield", "1998-03-10", "Tanzania", 177, None, "2022-01-01", "Without Club", "2026-10-30", 50000),
    (23, "Iddy Seleman Nado", "Left Winger", "1995-03-11", "Tanzania", None, "left", "2019-07-01", "Mbeya City Council FC", None, 75000),
    (9, "Abdul Hamisi Suleiman", "Left Winger", "2001-02-26", "Tanzania", None, "right", "2022-07-04", "Coastal Union", None, 50000),
    (None, "Kipre Zunon", "Left Winger", "1999-09-03", "Cote d'Ivoire", None, "right", "2026-07-05", "MC Algiers", None, None),
    (None, "Cheickna Diakite", "Left Winger", "2004-12-25", "Mali", 175, "right", "2024-07-16", "AS Real Bamako", "2027-06-30", None),
    (None, "Hassan Mubiru", "Right Winger", "2004-07-25", "Uganda", None, None, "2026-07-20", "Sports Club Villa Jogoo", "2028-06-30", 175000),
    (None, "Henoc Molia", "Right Winger", "2004-01-01", "DR Congo", None, None, "2026-07-18", "FC Saint-Eloi Lupopo", None, None),
    (13, "Pape Doudou Diallo", "Right Winger", "2002-12-26", "Senegal", 173, "right", "2025-07-30", "AS Academie Generation Foot", "2027-06-30", None),
    (None, "John Mano", "Centre-Forward", "2001-12-12", "Sudan", None, None, "2026-07-21", "Al-Akhdar SC", None, 100000),
    (29, "Nassor Saadun", "Centre-Forward", "2001-03-23", "Tanzania", None, "left", "2024-07-01", "Geita Gold SC", "2026-07-01", None),
    (None, "Aimar Hafidh Abubakar", "Striker", "2003-04-12", "Tanzania", None, None, None, None, None, None),
    (7, "Zidane Ally Sereri", "Striker", "2005-11-20", "Tanzania", None, None, "2025-01-11", "Dodoma Jiji FC", None, None),
]

print(f"Total players: {len(PLAYERS)}")

# Build SQL
sql_parts = []
sql_parts.append("BEGIN;")
sql_parts.append("")

# Update team
sql_parts.append(TEAM_UPDATE)
sql_parts.append("")

# Insert players
for i, (num, name, pos, dob, nat, height, foot, joined, signed_from, contract, mv) in enumerate(PLAYERS):
    slug_base = re.sub(r'[^a-z0-9]', '', name.lower().replace(' ', '-').replace("'", ''))[:35]
    # Add number suffix to avoid duplicates
    player_id = f"ftz-azam-{slug_base}-{i}"
    slug = player_id
    safe_name = name.replace("'", "''")
    
    # First/last name split
    parts = name.split()
    first = parts[0] if len(parts) > 1 else None
    last = ' '.join(parts[1:]) if len(parts) > 1 else None
    if first: first = first.replace("'", "''")
    if last: last = last.replace("'", "''")
    
    # Clean nationality (remove extra spaces)
    nat_clean = ' '.join(nat.split()) if nat else None
    if nat_clean: nat_clean = nat_clean.replace("'", "''")
    
    # Build metadata JSON
    meta = {}
    if foot: meta['foot'] = foot
    if signed_from: meta['signedFrom'] = signed_from.replace("'", "''")
    if contract: meta['contract'] = contract
    if mv: meta['marketValueEUR'] = mv
    if joined: meta['joinedDate'] = joined
    meta_json = json.dumps(meta).replace("'", "''")
    
    # Map position to shorter form for DB
    pos_map = {
        'Goalkeeper': 'GK', 'Centre-Back': 'CB', 'Left-Back': 'LB', 'Right-Back': 'RB',
        'Defensive Midfield': 'DM', 'Midfielder': 'MF', 'Central Midfield': 'CM',
        'Attacking Midfield': 'AM', 'Left Winger': 'LW', 'Right Winger': 'RW',
        'Centre-Forward': 'CF', 'Striker': 'ST'
    }
    pos_short = pos_map.get(pos, pos)
    
    # Build the INSERT with dynamic optional fields
    cols = ['id', 'name', 'slug', '"teamId"', '"leagueId"', '"sportId"', 'position', 'source', 'verified', '"isActive"', '"createdAt"', '"updatedAt"']
    vals = [f"'{player_id}'", f"'{safe_name}'", f"'{slug}'", f"'{TEAM_ID}'", "'ftz-nbc-premier-league'", "(SELECT id FROM \"Sport\" WHERE name = 'Football' LIMIT 1)", f"'{pos_short}'", "'admin'", 'true', 'true', 'NOW()', 'NOW()']
    
    if first: cols.append('"firstName"'); vals.append(f"'{first}'")
    if last: cols.append('"lastName"'); vals.append(f"'{last}'")
    if nat_clean: cols.append('nationality'); vals.append(f"'{nat_clean}'")
    if dob: cols.append('"dateOfBirth"'); vals.append(f"'{dob}'::timestamp")
    if height: cols.append('"heightCm"'); vals.append(str(height))
    if num is not None: cols.append('"shirtNumber"'); vals.append(str(num))
    cols.append('metadata'); vals.append(f"'{meta_json}'::jsonb")
    
    sql_parts.append(f"INSERT INTO \"Player\" ({', '.join(cols)}) VALUES ({', '.join(vals)}) ON CONFLICT (id) DO NOTHING;")

sql_parts.append("")
sql_parts.append("COMMIT;")

sql = "\n".join(sql_parts)

with open('/home/z/my-project/scripts/seed-azam-squad.sql', 'w') as f:
    f.write(sql)

# Upload via SFTP
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=30)
sftp = client.open_sftp()
with open('/home/z/my-project/scripts/seed-azam-squad.sql', 'rb') as local:
    sftp.putfo(local, '/tmp/seed-azam-squad.sql')
sftp.close()

# Execute
stdin, stdout, stderr = client.exec_command(
    "PGPASSWORD='SS_Secure_2024!' psql -U sportsphere_admin -d sportsphere -f /tmp/seed-azam-squad.sql 2>&1 | tail -15",
    timeout=120
)
result = stdout.read().decode()
err = stderr.read().decode()
client.close()

print("EXEC RESULT:", result)
if err: print("ERR:", err)

# Verify
client2 = paramiko.SSHClient()
client2.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client2.connect(HOST, username=USER, password=PASS, timeout=30)

for q in [
    'SELECT name, venue, "shortName", "logoUrl" FROM "Team" WHERE id = \'ftz-azam\';',
    'SELECT COUNT(*) as players FROM "Player" WHERE "teamId" = \'ftz-azam\';',
    'SELECT "shirtNumber", name, position, nationality, "dateOfBirth", "heightCm" FROM "Player" WHERE "teamId" = \'ftz-azam\' ORDER BY "shirtNumber" NULLS LAST, position LIMIT 10;',
]:
    stdin, stdout, stderr = client2.exec_command(f"PGPASSWORD='SS_Secure_2024!' psql -U sportsphere_admin -d sportsphere -c \"{q}\"")
    print(stdout.read().decode().strip())

client2.close()
