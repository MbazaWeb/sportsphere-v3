import paramiko
import re

HOST, USER, PASS = '104.152.50.173', 'deploy', 'Rehema@1234!'

def ssh_cmd(cmd, timeout=60):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASS, timeout=timeout)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    client.close()
    return out, err

# NBC Premier League 2025/26 — 16 teams
TEAMS = [
    "Simba", "Young Africans SC", "Azam", "Dodoma FC", "Mbeya City",
    "Singida Black Stars SC", "Geita Gold FC", "Fountain", "Pamba Jiji",
    "Polisi Tanzania FC", "Kagera Sugar", "Coastal Union FC", "Mashujaa FC",
    "Jkt Tanzania", "United", "Namungo"
]

# All fixtures: (home, away, date_str, time_str_or_TBA)
# All times in EAT (UTC+3), stored as UTC
FIXTURES = [
    # Matchday 1 — Aug 13
    ("Pamba Jiji", "Dodoma FC", "2026-08-13", "14:00"),
    ("Mbeya City", "Geita Gold FC", "2026-08-13", "16:15"),
    ("Singida Black Stars SC", "Fountain", "2026-08-13", "19:00"),
    # Matchday 2 — Aug 15
    ("Polisi Tanzania FC", "Azam", "2026-08-15", "16:00"),
    ("Coastal Union FC", "Mashujaa FC", "2026-08-15", "18:30"),
    ("Namungo", "Young Africans SC", "2026-08-15", "21:00"),
    # Matchday 3 — Aug 16
    ("Kagera Sugar", "Simba", "2026-08-16", "18:00"),
    ("Jkt Tanzania", "United", "2026-08-16", "20:30"),
    # Matchday 4 — Aug 18
    ("Fountain", "Mashujaa FC", "2026-08-18", "16:00"),
    ("Namungo", "Geita Gold FC", "2026-08-18", "19:00"),
    # Matchday 5 — Aug 19
    ("Mbeya City", "Dodoma FC", "2026-08-19", "14:00"),
    ("Pamba Jiji", "Simba", "2026-08-19", "16:15"),
    ("Kagera Sugar", "Singida Black Stars SC", "2026-08-19", "19:00"),
    # Matchday 6 — Aug 20
    ("Polisi Tanzania FC", "Jkt Tanzania", "2026-08-20", "16:00"),
    ("Young Africans SC", "Coastal Union FC", "2026-08-20", "18:30"),
    ("Azam", "United", "2026-08-20", "21:00"),
    # Matchday 7 — Aug 22
    ("Singida Black Stars SC", "Simba", "2026-08-22", "18:00"),
    ("Geita Gold FC", "Kagera Sugar", "2026-08-22", "20:30"),
    # Matchday 8 — Aug 23
    ("Mbeya City", "Mashujaa FC", "2026-08-23", "16:00"),
    ("Azam", "Pamba Jiji", "2026-08-23", "19:00"),
    # Matchday 9 — Aug 24
    ("Young Africans SC", "Jkt Tanzania", "2026-08-24", "18:00"),
    ("Coastal Union FC", "United", "2026-08-24", "20:30"),
    # Matchday 10 — Aug 25
    ("Namungo", "Fountain", "2026-08-25", "18:00"),
    ("Dodoma FC", "Polisi Tanzania FC", "2026-08-25", "20:30"),
    # Matchday 11 — Aug 27
    ("Mashujaa FC", "Kagera Sugar", "2026-08-27", "16:00"),
    ("Simba", "Coastal Union FC", "2026-08-27", "19:00"),
    # Matchday 12 — Aug 28
    ("Fountain", "Mbeya City", "2026-08-28", "16:00"),
    ("Geita Gold FC", "Azam", "2026-08-28", "18:30"),
    ("Young Africans SC", "Pamba Jiji", "2026-08-28", "21:00"),
    # Matchday 13 — Aug 29
    ("United", "Dodoma FC", "2026-08-29", "16:00"),
    ("Singida Black Stars SC", "Polisi Tanzania FC", "2026-08-29", "18:30"),
    ("Jkt Tanzania", "Namungo", "2026-08-29", "21:00"),
    # Matchday 14 — Aug 31
    ("Simba", "Geita Gold FC", "2026-08-31", "18:00"),
    ("Kagera Sugar", "Azam", "2026-08-31", "20:30"),
    # Matchday 15 — Sep 1
    ("Fountain", "Young Africans SC", "2026-09-01", "16:00"),
    ("Singida Black Stars SC", "Namungo", "2026-09-01", "19:00"),
    # Matchday 16 — Sep 4
    ("United", "Mbeya City", "2026-09-04", "16:00"),
    ("Dodoma FC", "Mashujaa FC", "2026-09-04", "19:00"),
    # Matchday 17 — Sep 5
    ("Jkt Tanzania", "Pamba Jiji", "2026-09-05", "19:00"),
    # Matchday 18 — Sep 6
    ("Polisi Tanzania FC", "Coastal Union FC", "2026-09-06", "16:00"),
    # Matchday 19 — Sep 8
    ("Mashujaa FC", "Singida Black Stars SC", "2026-09-08", "16:00"),
    ("Young Africans SC", "Geita Gold FC", "2026-09-08", "19:00"),
    # Matchday 20 — Sep 9
    ("Azam", "Simba", "2026-09-09", "19:00"),
    # Matchday 21 — Sep 11
    ("Dodoma FC", "Namungo", "2026-09-11", "19:00"),
    # Matchday 22 — Sep 12
    ("Polisi Tanzania FC", "Mbeya City", "2026-09-12", "16:00"),
    ("Coastal Union FC", "Jkt Tanzania", "2026-09-12", "19:00"),
    # Matchday 23 — Sep 13
    ("Pamba Jiji", "United", "2026-09-13", "16:00"),
    ("Kagera Sugar", "Fountain", "2026-09-13", "19:00"),
    # Matchday 24 — Oct 8
    ("Mashujaa FC", "Polisi Tanzania FC", "2026-10-08", "14:00"),
    ("Pamba Jiji", "Geita Gold FC", "2026-10-08", "16:15"),
    ("Namungo", "United", "2026-10-08", "18:30"),
    ("Coastal Union FC", "Azam", "2026-10-08", "21:00"),
    # Matchday 25 — Oct 9
    ("Fountain", "Jkt Tanzania", "2026-10-09", "14:00"),
    ("Mbeya City", "Kagera Sugar", "2026-10-09", "16:15"),
    ("Dodoma FC", "Singida Black Stars SC", "2026-10-09", "19:00"),
    # Matchday 26 — Oct 10
    ("Simba", "Young Africans SC", "2026-10-10", "19:00"),
    # Matchday 27 — Oct 12
    ("Coastal Union FC", "Singida Black Stars SC", "2026-10-12", "18:00"),
    ("Azam", "Namungo", "2026-10-12", "20:30"),
    # Matchday 28 — Oct 13
    ("United", "Young Africans SC", "2026-10-13", "16:00"),
    ("Simba", "Mashujaa FC", "2026-10-13", "19:00"),
    # Matchday 29 — Oct 16
    ("Fountain", "Pamba Jiji", "2026-10-16", "16:00"),
    ("Geita Gold FC", "Dodoma FC", "2026-10-16", "19:00"),
    # Matchday 30 — Oct 17
    ("Kagera Sugar", "Polisi Tanzania FC", "2026-10-17", "19:00"),
    # Matchday 31 — Oct 18
    ("Jkt Tanzania", "Mbeya City", "2026-10-18", "19:00"),
    # Matchday 32 — Oct 23
    ("Dodoma FC", "Young Africans SC", "2026-10-23", "TBA"),
    ("Singida Black Stars SC", "United", "2026-10-23", "TBA"),
    ("Simba", "Mbeya City", "2026-10-23", "TBA"),
    ("Azam", "Mashujaa FC", "2026-10-23", "TBA"),
    ("Polisi Tanzania FC", "Pamba Jiji", "2026-10-23", "16:00"),
    # Matchday 33 — Oct 24
    ("Jkt Tanzania", "Kagera Sugar", "2026-10-24", "18:00"),
    ("Namungo", "Coastal Union FC", "2026-10-24", "20:30"),
    # Matchday 34 — Oct 25
    ("Geita Gold FC", "Fountain", "2026-10-25", "19:00"),
    # Matchday 35 — Oct 27
    ("Pamba Jiji", "Singida Black Stars SC", "2026-10-27", "16:00"),
    ("Young Africans SC", "Mashujaa FC", "2026-10-27", "18:30"),
    ("Dodoma FC", "Jkt Tanzania", "2026-10-27", "21:00"),
    # Matchday 36 — Oct 28
    ("Fountain", "Simba", "2026-10-28", "16:00"),
    ("Azam", "Mbeya City", "2026-10-28", "18:30"),
    ("Coastal Union FC", "Kagera Sugar", "2026-10-28", "21:00"),
    # Matchday 37 — Oct 29
    ("United", "Geita Gold FC", "2026-10-29", "16:00"),
    ("Namungo", "Polisi Tanzania FC", "2026-10-29", "19:00"),
    # Matchday 38 — Oct 31
    ("Mbeya City", "Singida Black Stars SC", "2026-10-31", "16:00"),
    ("Jkt Tanzania", "Azam", "2026-10-31", "18:30"),
    ("Coastal Union FC", "Dodoma FC", "2026-10-31", "21:00"),
    # Matchday 39 — Nov 1
    ("Polisi Tanzania FC", "Geita Gold FC", "2026-11-01", "16:00"),
    ("Young Africans SC", "Kagera Sugar", "2026-11-01", "19:00"),
    # Matchday 40 — Nov 2
    ("United", "Fountain", "2026-11-02", "14:00"),
    ("Mashujaa FC", "Pamba Jiji", "2026-11-02", "16:15"),
    ("Simba", "Namungo", "2026-11-02", "19:00"),
    # Matchday 41 — Nov 20
    ("Polisi Tanzania FC", "Young Africans SC", "2026-11-20", "16:00"),
    ("Namungo", "Mbeya City", "2026-11-20", "18:30"),
    ("Azam", "Singida Black Stars SC", "2026-11-20", "21:00"),
    # Matchday 42 — Nov 21
    ("Pamba Jiji", "Coastal Union FC", "2026-11-21", "16:00"),
    ("Jkt Tanzania", "Simba", "2026-11-21", "18:30"),
    ("Dodoma FC", "Fountain", "2026-11-21", "21:00"),
    # Matchday 43 — Nov 22
    ("Kagera Sugar", "United", "2026-11-22", "18:00"),
    ("Geita Gold FC", "Mashujaa FC", "2026-11-22", "20:30"),
    # Matchday 44 — Nov 27
    ("Simba", "Polisi Tanzania FC", "2026-11-27", "TBA"),
    ("Mbeya City", "Young Africans SC", "2026-11-27", "TBA"),
    ("Fountain", "Azam", "2026-11-27", "TBA"),
    ("Singida Black Stars SC", "Jkt Tanzania", "2026-11-27", "TBA"),
    ("Pamba Jiji", "Namungo", "2026-11-27", "16:00"),
    ("Kagera Sugar", "Dodoma FC", "2026-11-27", "19:00"),
    # Matchday 45 — Nov 28
    ("Mashujaa FC", "United", "2026-11-28", "16:00"),
    # Matchday 46 — Nov 29
    ("Geita Gold FC", "Coastal Union FC", "2026-11-29", "19:00"),
    # Matchday 47 — Dec 4
    ("Young Africans SC", "Azam", "2026-12-04", "TBA"),
    ("Singida Black Stars SC", "Geita Gold FC", "2026-12-04", "TBA"),
    ("Simba", "Dodoma FC", "2026-12-04", "TBA"),
    ("United", "Polisi Tanzania FC", "2026-12-04", "14:00"),
    ("Mbeya City", "Pamba Jiji", "2026-12-04", "16:15"),
    # Matchday 48 — Dec 5
    ("Coastal Union FC", "Fountain", "2026-12-05", "19:00"),
    # Matchday 49 — Dec 6
    ("Mashujaa FC", "Jkt Tanzania", "2026-12-06", "16:00"),
    ("Kagera Sugar", "Namungo", "2026-12-06", "19:00"),
    # Matchday 50 — Dec 11
    ("Pamba Jiji", "Kagera Sugar", "2026-12-11", "14:00"),
    ("Mbeya City", "Coastal Union FC", "2026-12-11", "16:15"),
    ("United", "Simba", "2026-12-11", "16:15"),
    # Matchday 51 — Dec 12
    ("Fountain", "Polisi Tanzania FC", "2026-12-12", "16:00"),
    ("Singida Black Stars SC", "Young Africans SC", "2026-12-12", "18:30"),
    ("Azam", "Dodoma FC", "2026-12-12", "21:00"),
    # Matchday 52 — Dec 13
    ("Mashujaa FC", "Namungo", "2026-12-13", "16:00"),
    ("Geita Gold FC", "Jkt Tanzania", "2026-12-13", "19:00"),
    # Matchday 53 — Dec 29
    ("Namungo", "Singida Black Stars SC", "2026-12-29", "16:00"),
    ("Kagera Sugar", "Pamba Jiji", "2026-12-29", "18:30"),
    ("Dodoma FC", "United", "2026-12-29", "21:00"),
    # Matchday 54 — Dec 30
    ("Fountain", "Geita Gold FC", "2026-12-30", "16:00"),
    ("Azam", "Young Africans SC", "2026-12-30", "19:00"),
    # Matchday 55 — Dec 31
    ("Polisi Tanzania FC", "Simba", "2026-12-31", "16:00"),
    ("Jkt Tanzania", "Mashujaa FC", "2026-12-31", "18:30"),
    ("Coastal Union FC", "Mbeya City", "2026-12-31", "21:00"),
    # Matchday 56 — Jan 15
    ("Polisi Tanzania FC", "Singida Black Stars SC", "2027-01-15", "TBA"),
    ("Simba", "Kagera Sugar", "2027-01-15", "TBA"),
    ("Young Africans SC", "Fountain", "2027-01-15", "TBA"),
    ("Namungo", "Azam", "2027-01-15", "TBA"),
    ("Jkt Tanzania", "Dodoma FC", "2027-01-15", "18:00"),
    # Matchday 57 — Jan 16
    ("United", "Coastal Union FC", "2027-01-16", "16:00"),
    ("Geita Gold FC", "Pamba Jiji", "2027-01-16", "19:00"),
    # Matchday 58 — Jan 17
    ("Mashujaa FC", "Mbeya City", "2027-01-17", "16:00"),
    # Matchday 59 — Jan 22
    ("Geita Gold FC", "Singida Black Stars SC", "2027-01-22", "TBA"),
    ("Simba", "Fountain", "2027-01-22", "TBA"),
    ("Azam", "Polisi Tanzania FC", "2027-01-22", "TBA"),
    ("Coastal Union FC", "Young Africans SC", "2027-01-22", "TBA"),
    ("Dodoma FC", "Mbeya City", "2027-01-22", "19:00"),
    # Matchday 60 — Jan 23
    ("Namungo", "Kagera Sugar", "2027-01-23", "19:00"),
    # Matchday 61 — Jan 24
    ("Pamba Jiji", "Mashujaa FC", "2027-01-24", "14:00"),
    ("United", "Jkt Tanzania", "2027-01-24", "16:15"),
    # Matchday 62 — Feb 2
    ("Mashujaa FC", "Geita Gold FC", "2027-02-02", "14:00"),
    ("United", "Pamba Jiji", "2027-02-02", "16:15"),
    ("Coastal Union FC", "Simba", "2027-02-02", "19:00"),
    # Matchday 63 — Feb 3
    ("Mbeya City", "Namungo", "2027-02-03", "16:00"),
    ("Singida Black Stars SC", "Kagera Sugar", "2027-02-03", "18:30"),
    ("Young Africans SC", "Polisi Tanzania FC", "2027-02-03", "21:00"),
    # Matchday 64 — Feb 4
    ("Jkt Tanzania", "Fountain", "2027-02-04", "18:00"),
    ("Dodoma FC", "Azam", "2027-02-04", "20:30"),
    # Matchday 65 — Feb 6
    ("Young Africans SC", "Simba", "2027-02-06", "19:00"),
    # Matchday 66 — Feb 7
    ("Polisi Tanzania FC", "United", "2027-02-07", "16:00"),
    ("Kagera Sugar", "Mbeya City", "2027-02-07", "18:30"),
    ("Dodoma FC", "Pamba Jiji", "2027-02-07", "21:00"),
    # Matchday 67 — Feb 8
    ("Fountain", "Coastal Union FC", "2027-02-08", "16:00"),
    ("Geita Gold FC", "Namungo", "2027-02-08", "18:30"),
    ("Singida Black Stars SC", "Mashujaa FC", "2027-02-08", "18:30"),
    ("Azam", "Jkt Tanzania", "2027-02-08", "21:00"),
    # Matchday 68 — Feb 11
    ("United", "Singida Black Stars SC", "2027-02-11", "14:00"),
    ("Mashujaa FC", "Young Africans SC", "2027-02-11", "16:15"),
    ("Azam", "Coastal Union FC", "2027-02-11", "19:00"),
    # Matchday 69 — Feb 12
    ("Fountain", "Namungo", "2027-02-12", "14:00"),
    ("Pamba Jiji", "Mbeya City", "2027-02-12", "16:15"),
    ("Kagera Sugar", "Geita Gold FC", "2027-02-12", "19:00"),
    # Matchday 70 — Feb 13
    ("Polisi Tanzania FC", "Dodoma FC", "2027-02-13", "16:00"),
    ("Simba", "Jkt Tanzania", "2027-02-13", "19:00"),
    # Matchday 71 — Feb 15
    ("United", "Azam", "2027-02-15", "16:00"),
    ("Geita Gold FC", "Mbeya City", "2027-02-15", "19:00"),
    ("Singida Black Stars SC", "Coastal Union FC", "2027-02-15", "21:00"),
    # Matchday 72 — Feb 16
    ("Mashujaa FC", "Fountain", "2027-02-16", "16:00"),
    ("Namungo", "Jkt Tanzania", "2027-02-16", "18:30"),
    ("Dodoma FC", "Simba", "2027-02-16", "21:00"),
    # Matchday 73 — Feb 17
    ("Pamba Jiji", "Polisi Tanzania FC", "2027-02-17", "16:00"),
    ("Kagera Sugar", "Young Africans SC", "2027-02-17", "19:00"),
    # Matchday 74 — Feb 23
    ("Jkt Tanzania", "Singida Black Stars SC", "2027-02-23", "18:00"),
    ("Simba", "Pamba Jiji", "2027-02-23", "20:30"),
    # Matchday 75 — Feb 24
    ("Young Africans SC", "Dodoma FC", "2027-02-24", "18:00"),
    ("Azam", "Geita Gold FC", "2027-02-24", "20:30"),
    # Matchday 76 — Feb 26
    ("Mbeya City", "Fountain", "2027-02-26", "14:00"),
    ("United", "Mashujaa FC", "2027-02-26", "16:15"),
    # Matchday 77 — Feb 27
    ("Polisi Tanzania FC", "Kagera Sugar", "2027-02-27", "16:00"),
    # Matchday 78 — Feb 28
    ("Coastal Union FC", "Namungo", "2027-02-28", "19:00"),
    # Matchday 79 — Mar 5
    ("Fountain", "Singida Black Stars SC", "2027-03-05", "TBA"),
    ("Young Africans SC", "United", "2027-03-05", "TBA"),
    ("Simba", "Azam", "2027-03-05", "TBA"),
    ("Polisi Tanzania FC", "Mashujaa FC", "2027-03-05", "16:00"),
    ("Namungo", "Pamba Jiji", "2027-03-05", "19:00"),
    # Matchday 80 — Mar 6
    ("Mbeya City", "Jkt Tanzania", "2027-03-06", "16:00"),
    # Matchday 81 — Mar 7
    ("Coastal Union FC", "Geita Gold FC", "2027-03-07", "18:00"),
    ("Dodoma FC", "Kagera Sugar", "2027-03-07", "20:30"),
    # Matchday 82 — Mar 12
    ("Polisi Tanzania FC", "Fountain", "2027-03-12", "16:00"),
    ("Young Africans SC", "Mbeya City", "2027-03-12", "19:00"),
    # Matchday 83 — Mar 13
    ("Namungo", "Mashujaa FC", "2027-03-13", "16:00"),
    ("Simba", "United", "2027-03-13", "18:30"),
    ("Azam", "Kagera Sugar", "2027-03-13", "21:00"),
    # Matchday 84 — Mar 14
    ("Singida Black Stars SC", "Dodoma FC", "2027-03-14", "16:00"),
    ("Jkt Tanzania", "Geita Gold FC", "2027-03-14", "18:30"),
    ("Coastal Union FC", "Pamba Jiji", "2027-03-14", "21:00"),
    # Matchday 85 — Apr 6
    ("Pamba Jiji", "Young Africans SC", "2027-04-06", "16:00"),
    # Matchday 86 — Apr 7
    ("Mbeya City", "Simba", "2027-04-07", "16:00"),
    ("Singida Black Stars SC", "Azam", "2027-04-07", "19:00"),
    # Matchday 87 — Apr 9
    ("Mashujaa FC", "Coastal Union FC", "2027-04-09", "16:00"),
    ("Kagera Sugar", "Jkt Tanzania", "2027-04-09", "19:00"),
    # Matchday 88 — Apr 10
    ("United", "Namungo", "2027-04-10", "16:00"),
    ("Geita Gold FC", "Polisi Tanzania FC", "2027-04-10", "19:00"),
    # Matchday 89 — Apr 11
    ("Fountain", "Dodoma FC", "2027-04-11", "16:00"),
    # Matchday 90 — Apr 16
    ("Simba", "Singida Black Stars SC", "2027-04-16", "TBA"),
    ("Geita Gold FC", "Young Africans SC", "2027-04-16", "TBA"),
    ("Pamba Jiji", "Jkt Tanzania", "2027-04-16", "14:00"),
    ("Mbeya City", "Azam", "2027-04-16", "TBA"),
    ("Mashujaa FC", "Dodoma FC", "2027-04-16", "16:15"),
    # Matchday 91 — Apr 17
    ("Fountain", "United", "2027-04-17", "16:00"),
    # Matchday 92 — Apr 18
    ("Polisi Tanzania FC", "Namungo", "2027-04-18", "16:00"),
    ("Kagera Sugar", "Coastal Union FC", "2027-04-18", "19:00"),
    # Matchday 93 — May 3 (7 matches — super matchday)
    ("Singida Black Stars SC", "Pamba Jiji", "2027-05-03", "16:00"),
    ("Jkt Tanzania", "Young Africans SC", "2027-05-03", "16:00"),
    ("Mbeya City", "United", "2027-05-03", "16:00"),
    ("Namungo", "Simba", "2027-05-03", "16:00"),
    ("Kagera Sugar", "Mashujaa FC", "2027-05-03", "16:00"),
    ("Coastal Union FC", "Polisi Tanzania FC", "2027-05-03", "16:00"),
    ("Dodoma FC", "Geita Gold FC", "2027-05-03", "16:00"),
    ("Azam", "Fountain", "2027-05-03", "16:00"),
    # Matchday 94 — May 12 (7 matches — super matchday)
    ("Singida Black Stars SC", "Mbeya City", "2027-05-12", "16:00"),
    ("Young Africans SC", "Namungo", "2027-05-12", "16:00"),
    ("Jkt Tanzania", "Polisi Tanzania FC", "2027-05-12", "16:00"),
    ("Pamba Jiji", "Fountain", "2027-05-12", "16:00"),
    ("Mashujaa FC", "Azam", "2027-05-12", "16:00"),
    ("United", "Kagera Sugar", "2027-05-12", "16:00"),
    ("Geita Gold FC", "Simba", "2027-05-12", "16:00"),
    ("Dodoma FC", "Coastal Union FC", "2027-05-12", "16:00"),
    # Matchday 95 — May 16 (7 matches — super matchday)
    ("Jkt Tanzania", "Coastal Union FC", "2027-05-16", "16:00"),
    ("Mbeya City", "Polisi Tanzania FC", "2027-05-16", "16:00"),
    ("Namungo", "Dodoma FC", "2027-05-16", "16:00"),
    ("Pamba Jiji", "Azam", "2027-05-16", "16:00"),
    ("Mashujaa FC", "Simba", "2027-05-16", "16:00"),
    ("Geita Gold FC", "United", "2027-05-16", "16:00"),
    ("Young Africans SC", "Singida Black Stars SC", "2027-05-16", "16:00"),
    ("Fountain", "Kagera Sugar", "2027-05-16", "16:00"),
]

print(f"Total fixtures: {len(FIXTURES)}")

# Build SQL
# 1. Create teams first
team_sql = []
for team in TEAMS:
    slug = re.sub(r'[^a-z0-9-]', '', team.lower().replace(' ', '-'))[:60]
    team_id = f"ftz-{slug}"
    safe_name = team.replace("'", "''")
    team_sql.append(
        f"INSERT INTO \"Team\" (id, name, slug, country, \"countryCode\", sportId, leagueId, source, verified, \"isActive\", \"createdAt\", \"updatedAt\") "
        f"VALUES ('{team_id}', '{safe_name}', '{slug}', 'Tanzania', 'TZ', "
        f"(SELECT id FROM \"Sport\" WHERE name = 'Football' LIMIT 1), "
        f"'ftz-nbc-premier-league', 'admin', true, true, NOW(), NOW()) "
        f"ON CONFLICT (id) DO NOTHING;"
    )

# 2. Create matches
match_sql = []
for home, away, date_str, time_str in FIXTURES:
    safe_home = home.replace("'", "''")
    safe_away = away.replace("'", "''")
    if time_str == "TBA":
        kickoff = f"{date_str} 18:00:00+03"  # Default 6pm EAT for TBA
    else:
        kickoff = f"{date_str} {time_str}:00+03"
    match_sql.append(
        f"INSERT INTO \"Match\" (id, league, \"homeTeam\", \"awayTeam\", status, \"kickoffAt\", continent, country, \"createdAt\", \"updatedAt\") "
        f"VALUES (gen_random_uuid(), 'NBC Premier League', '{safe_home}', '{safe_away}', 'upcoming', '{kickoff}', 'Africa', 'Tanzania', NOW(), NOW()) "
        f"ON CONFLICT DO NOTHING;"  # No unique constraint so just insert
    )

# Combine all SQL
all_sql = "-- NBC Premier League 2025/26 Season Seed\n"
all_sql += "-- Teams\n" + "\n".join(team_sql) + "\n\n"
all_sql += "-- Matches\n" + "\n".join(match_sql)

# Write SQL file locally
with open('/home/z/my-project/scripts/seed-nbc-fixtures.sql', 'w') as f:
    f.write(all_sql)

print(f"SQL file written: {len(team_sql)} teams, {len(match_sql)} matches")

# Upload and execute
encoded = all_sql.encode('utf-8').hex()
print("Uploading to server...")
out, err = ssh_cmd(f"echo '{encoded}' | xxd -r -p > /tmp/seed-nbc-fixtures.sql")

print("Executing SQL...")
out, err = ssh_cmd(f"PGPASSWORD='SS_Secure_2024!' psql -U sportsphere_admin -d sportsphere -f /tmp/seed-nbc-fixtures.sql 2>&1 | tail -20")
print(out)
if err:
    print(f"STDERR: {err}")

# Verify
print("\nVerifying...")
out, err = ssh_cmd(f"PGPASSWORD='SS_Secure_2024!' psql -U sportsphere_admin -d sportsphere -c \"SELECT COUNT(*) as teams FROM \\\"Team\\\";\"")
print(f"Teams: {out.strip()}")
out, err = ssh_cmd(f"PGPASSWORD='SS_Secure_2024!' psql -U sportsphere_admin -d sportsphere -c \"SELECT COUNT(*) as matches FROM \\\"Match\\\";\"")
print(f"Matches: {out.strip()}")
out, err = ssh_cmd(f"PGPASSWORD='SS_Secure_2024!' psql -U sportsphere_admin -d sportsphere -c \"SELECT MIN(\\\"kickoffAt\\\") as first_match, MAX(\\\"kickoffAt\\\") as last_match FROM \\\"Match\\\";\"")
print(f"Range: {out.strip()}")
