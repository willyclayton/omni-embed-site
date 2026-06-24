"""
Loads MLB Stats API data into MotherDuck mlb database.
Run: python load_mlb_data.py --token <your-motherduck-token>
"""
import argparse
import requests
import duckdb

BASE = "https://statsapi.mlb.com/api/v1"
SEASON = 2025


def fetch(path, **params):
    r = requests.get(f"{BASE}{path}", params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def load_teams(con):
    data = fetch("/teams", sportId=1)
    rows = []
    for t in data["teams"]:
        rows.append((
            t["id"],
            t.get("name"),
            t.get("abbreviation"),
            t.get("teamName"),
            t.get("locationName"),
            t.get("firstYearOfPlay"),
            t.get("league", {}).get("name"),
            t.get("division", {}).get("name"),
            t.get("venue", {}).get("name"),
        ))
    con.execute("DROP TABLE IF EXISTS teams")
    con.execute("""
        CREATE TABLE teams (
            team_id        INTEGER,
            name           VARCHAR,
            abbreviation   VARCHAR,
            team_name      VARCHAR,
            location       VARCHAR,
            first_year     VARCHAR,
            league         VARCHAR,
            division       VARCHAR,
            venue          VARCHAR
        )
    """)
    con.executemany("INSERT INTO teams VALUES (?,?,?,?,?,?,?,?,?)", rows)
    print(f"  teams: {len(rows)} rows")


def load_standings(con):
    data = fetch("/standings", leagueId="103,104", season=SEASON)
    rows = []
    for record in data["records"]:
        division = record.get("division", {}).get("name", "")
        for tr in record["teamRecords"]:
            lr = tr.get("leagueRecord", {})
            rows.append((
                tr["team"]["id"],
                tr["team"]["name"],
                division,
                int(tr.get("divisionRank", 0)),
                int(tr.get("leagueRank", 0)),
                int(tr.get("gamesPlayed", 0)),
                lr.get("wins", 0),
                lr.get("losses", 0),
                float(lr.get("pct", 0)),
                tr.get("gamesBack", "-"),
                tr.get("wildCardGamesBack", "-"),
                tr.get("streak", {}).get("streakCode", ""),
            ))
    con.execute("DROP TABLE IF EXISTS standings")
    con.execute("""
        CREATE TABLE standings (
            team_id             INTEGER,
            team_name           VARCHAR,
            division            VARCHAR,
            division_rank       INTEGER,
            league_rank         INTEGER,
            games_played        INTEGER,
            wins                INTEGER,
            losses              INTEGER,
            win_pct             DOUBLE,
            games_back          VARCHAR,
            wildcard_games_back VARCHAR,
            streak              VARCHAR
        )
    """)
    con.executemany("INSERT INTO standings VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", rows)
    print(f"  standings: {len(rows)} rows")


def load_batting(con):
    data = fetch("/stats", stats="season", group="hitting", gameType="R",
                 season=SEASON, limit=2000, playerPool="All", sportId=1)
    rows = []
    for split in data["stats"][0]["splits"]:
        s = split["stat"]
        p = split.get("player", {})
        t = split.get("team", {})
        rows.append((
            p.get("id"), p.get("fullName"), p.get("firstName"), p.get("lastName"),
            t.get("id"), t.get("name"),
            int(SEASON),
            s.get("gamesPlayed", 0), s.get("atBats", 0), s.get("plateAppearances", 0),
            s.get("hits", 0), s.get("doubles", 0), s.get("triples", 0),
            s.get("homeRuns", 0), s.get("runs", 0), s.get("rbi", 0),
            s.get("baseOnBalls", 0), s.get("strikeOuts", 0),
            s.get("stolenBases", 0), s.get("caughtStealing", 0),
            s.get("avg", ".000"), s.get("obp", ".000"),
            s.get("slg", ".000"), s.get("ops", ".000"),
            s.get("totalBases", 0), s.get("hitByPitch", 0),
            s.get("sacFlies", 0), s.get("sacBunts", 0),
            s.get("groundIntoDoublePlay", 0),
        ))
    con.execute("DROP TABLE IF EXISTS batting")
    con.execute("""
        CREATE TABLE batting (
            player_id       INTEGER,
            player_name     VARCHAR,
            first_name      VARCHAR,
            last_name       VARCHAR,
            team_id         INTEGER,
            team_name       VARCHAR,
            season          INTEGER,
            games_played    INTEGER,
            at_bats         INTEGER,
            plate_appearances INTEGER,
            hits            INTEGER,
            doubles         INTEGER,
            triples         INTEGER,
            home_runs       INTEGER,
            runs            INTEGER,
            rbi             INTEGER,
            walks           INTEGER,
            strikeouts      INTEGER,
            stolen_bases    INTEGER,
            caught_stealing INTEGER,
            avg             VARCHAR,
            obp             VARCHAR,
            slg             VARCHAR,
            ops             VARCHAR,
            total_bases     INTEGER,
            hit_by_pitch    INTEGER,
            sac_flies       INTEGER,
            sac_bunts       INTEGER,
            gidp            INTEGER
        )
    """)
    con.executemany("INSERT INTO batting VALUES " + "(?" + ",?" * 28 + ")", rows)
    print(f"  batting: {len(rows)} rows")


def load_pitching(con):
    data = fetch("/stats", stats="season", group="pitching", gameType="R",
                 season=SEASON, limit=2000, playerPool="All", sportId=1)
    rows = []
    for split in data["stats"][0]["splits"]:
        s = split["stat"]
        p = split.get("player", {})
        t = split.get("team", {})
        rows.append((
            p.get("id"), p.get("fullName"), p.get("firstName"), p.get("lastName"),
            t.get("id"), t.get("name"),
            int(SEASON),
            s.get("gamesPlayed", 0), s.get("gamesStarted", 0),
            s.get("wins", 0), s.get("losses", 0), s.get("saves", 0),
            s.get("saveOpportunities", 0), s.get("holds", 0), s.get("blownSaves", 0),
            s.get("inningsPitched", "0.0"),
            s.get("hits", 0), s.get("runs", 0), s.get("earnedRuns", 0),
            s.get("homeRuns", 0), s.get("baseOnBalls", 0),
            s.get("intentionalWalks", 0), s.get("strikeOuts", 0),
            s.get("era", "-.--"), s.get("whip", "-.--"),
            s.get("strikeoutsPer9Inn", "-.--"), s.get("walksPer9Inn", "-.--"),
            s.get("hitsPer9Inn", "-.--"), s.get("strikeoutWalkRatio", "-.--"),
            s.get("numberOfPitches", 0), s.get("strikes", 0),
            s.get("completeGames", 0), s.get("shutouts", 0),
        ))
    con.execute("DROP TABLE IF EXISTS pitching")
    con.execute("""
        CREATE TABLE pitching (
            player_id           INTEGER,
            player_name         VARCHAR,
            first_name          VARCHAR,
            last_name           VARCHAR,
            team_id             INTEGER,
            team_name           VARCHAR,
            season              INTEGER,
            games_played        INTEGER,
            games_started       INTEGER,
            wins                INTEGER,
            losses              INTEGER,
            saves               INTEGER,
            save_opportunities  INTEGER,
            holds               INTEGER,
            blown_saves         INTEGER,
            innings_pitched     VARCHAR,
            hits                INTEGER,
            runs                INTEGER,
            earned_runs         INTEGER,
            home_runs           INTEGER,
            walks               INTEGER,
            intentional_walks   INTEGER,
            strikeouts          INTEGER,
            era                 VARCHAR,
            whip                VARCHAR,
            k_per_9             VARCHAR,
            bb_per_9            VARCHAR,
            h_per_9             VARCHAR,
            k_bb_ratio          VARCHAR,
            pitches             INTEGER,
            strikes             INTEGER,
            complete_games      INTEGER,
            shutouts            INTEGER
        )
    """)
    con.executemany("INSERT INTO pitching VALUES " + "(?" + ",?" * 32 + ")", rows)
    print(f"  pitching: {len(rows)} rows")


def normalize_team_names(con):
    for table in ("standings", "batting", "pitching"):
        con.execute(f"""
            UPDATE {table}
            SET team_name = (
                SELECT name FROM teams WHERE teams.team_id = {table}.team_id
            )
            WHERE team_id IS NOT NULL
        """)
    print("  team_name normalized across all tables")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--token", required=True, help="MotherDuck token")
    args = parser.parse_args()

    print("Connecting to MotherDuck...")
    con = duckdb.connect(f"md:mlb?motherduck_token={args.token}")

    print(f"Loading {SEASON} MLB data...")
    load_teams(con)
    load_standings(con)
    load_batting(con)
    load_pitching(con)
    normalize_team_names(con)

    print("\nDone.")
    con.close()


if __name__ == "__main__":
    main()
