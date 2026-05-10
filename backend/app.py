"""
Small Flask API for the game leaderboard.

Scores are stored in MongoDB Atlas (cloud database) so they survive server restarts.
"""

import os
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote_plus, unquote_plus

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import ConfigurationError, PyMongoError

# Load `.env` from this file's folder — works even when you run `python` from another directory.
_BACKEND_DIR = Path(__file__).resolve().parent
_ENV_FILE = _BACKEND_DIR / ".env"
load_dotenv(_ENV_FILE)


def _env_file_hint_missing_uri() -> str:
    """Beginner-facing hint when `.env` exists but forgot `MONGODB_URI=` or used UTF-8 BOM."""
    try:
        text = _ENV_FILE.read_text(encoding="utf-8-sig").strip()
    except OSError:
        return ""
    if not text or text.startswith("#"):
        return "\nTip: `.env` is empty or all comments — add `MONGODB_URI=your_connection_string`."
    first_line = text.splitlines()[0].strip()
    if first_line.startswith(("mongodb+srv://", "mongodb://")) and "=" not in first_line:
        return (
            '\nTip: Dotenv expects `KEY=value`. Start the line with `MONGODB_URI=` then paste the URI, e.g.\n'
            "    MONGODB_URI=mongodb+srv://...\n"
            'Remove angle brackets `<` `>` around the password—they are placeholders in Atlas docs, not part of the URI.'
        )
    return ""

app = Flask(__name__)
CORS(app)

# --- MongoDB setup ---


def escape_mongodb_credentials(uri: str) -> str:
    """
    MongoDB URIs must encode special characters in the username and password (RFC 3986).
    If your Atlas password contains @, :, /, etc., PyMongo raises InvalidURI unless they
    are percent-encoded — this helper fixes a typical copy-paste string from Atlas.

    The host (e.g. cluster0.xxxxx.mongodb.net) never contains '@', so we split *credentials*
    from *host* at the last '@' in the authority — not the first — so passwords with '@'
    still parse correctly.
    """
    uri = uri.strip().strip('"').strip("'")
    m_scheme = re.match(r"^(mongodb(?:\+srv)?://)(.+)$", uri, re.IGNORECASE)
    if not m_scheme:
        return uri
    prefix, after_scheme = m_scheme.groups()
    # Separate `user:pass@host` from `/database?retryWrites…` — stop before '/' or '?'.
    cutoff = len(after_scheme)
    for marker in "/", "?":
        i = after_scheme.find(marker)
        if i != -1:
            cutoff = min(cutoff, i)
    authority = after_scheme[:cutoff].strip("/")
    path_and_query = after_scheme[cutoff:]
    if "@" not in authority:
        return uri
    userinfo, host_and_rest = authority.rsplit("@", 1)
    if ":" in userinfo:
        username, password = userinfo.split(":", 1)
    else:
        username, password = userinfo, ""
    # If the string was already partly encoded, normalize then re-encode once.
    username = unquote_plus(username)
    password = unquote_plus(password)
    encoded_user = quote_plus(username)
    encoded_pass = quote_plus(password)
    userinfo_encoded = (
        f"{encoded_user}:{encoded_pass}" if password != "" else encoded_user
    )
    return f"{prefix}{userinfo_encoded}@{host_and_rest}{path_and_query}"


# Paste your Atlas connection string in the environment (see MongoDB Atlas → Connect → Drivers).
# Example: mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/MY_DB_NAME?retryWrites=true&w=majority
MONGODB_URI = os.environ.get("MONGODB_URI") or ""
MONGODB_URI = MONGODB_URI.strip().strip('"').strip("'")

if not MONGODB_URI:
    exists = _ENV_FILE.is_file()
    raise RuntimeError(
        "Missing MONGODB_URI (empty or unset).\n"
        f"• Expected file: {_ENV_FILE}\n"
        f"• File exists: {exists}\n"
        "• Line must look exactly like (name is case-sensitive):\n"
        '    MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.a1b2c3.mongodb.net/DBNAME?retryWrites=true&w=majority\n'
        "  Quotes around the URI are okay; spaces around '=' are discouraged.\n"
        "• Or set MONGODB_URI in Windows environment variables before running Flask.\n"
        + _env_file_hint_missing_uri()
    )

MONGODB_URI = escape_mongodb_credentials(MONGODB_URI)

# Tutorial / docs often show a fake hostname—DNS will fail with NXDOMAIN.
if re.search(r"cluster0\.abcd\.mongodb\.net", MONGODB_URI, re.IGNORECASE):
    raise RuntimeError(
        "MONGODB_URI uses the example host cluster0.abcd.mongodb.net (not a real cluster).\n"
        "In MongoDB Atlas: open your project → Database → your cluster → Connect → "
        "Drivers → copy the real string. The host looks like cluster0.<random>.mongodb.net."
    )

# One client object is reused for all requests (efficient connection pooling).
try:
    mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10_000)
except ConfigurationError as e:
    msg = str(e).lower()
    hint = (
        "\n\n• If you see DNS / NXDOMAIN: the hostname in MONGODB_URI must be your own from "
        "Atlas (Connect → Drivers), not a placeholder from a tutorial.\n"
        "• Check internet access; some networks block SRV lookups for mongodb.net."
    )
    raise RuntimeError(f"MongoDB connection string problem: {e}{hint}") from e

# Strings like ...mongodb.net/?appName=... have no `/databaseName` segment, so PyMongo has
# nothing to call “default”; pass `trial_car_db` (or override with MONGODB_DB_NAME in `.env`).
_db_fallback = os.environ.get("MONGODB_DB_NAME", "trial_car_db").strip()
_database = mongo_client.get_default_database(default=_db_fallback)

# This is our "leaderboard collection" (like a named table).
# Calling create_collection ensures it appears in Atlas UI even before the first score.
LEADERBOARD_NAME = "leaderboard"
if LEADERBOARD_NAME not in _database.list_collection_names():
    _database.create_collection(LEADERBOARD_NAME)

leaderboard_coll = _database[LEADERBOARD_NAME]

# Helps MongoDB serve "top scores" queries quickly as the dataset grows (optional but useful).
leaderboard_coll.create_index([("score", -1)])


def _serialize_doc(doc: dict) -> dict:
    """Turn a MongoDB document into plain JSON-friendly data (strings for dates and IDs)."""
    out = dict(doc)
    if "_id" in out:
        out["_id"] = str(out["_id"])
    if "created_at" in out and isinstance(out["created_at"], datetime):
        out["created_at"] = out["created_at"].astimezone(timezone.utc).isoformat()
    return out


@app.route("/")
def home():
    return {"message": "Backend running"}


@app.route("/leaderboard", methods=["GET"])
def get_leaderboard():
    """
    Return leaderboard entries sorted by highest score first.
    Limits to 50 entries—you can raise this if your game grows huge.
    """
    try:
        cursor = leaderboard_coll.find().sort("score", -1).limit(50)
        rows = [_serialize_doc(doc) for doc in cursor]
        return jsonify(rows)
    except PyMongoError as e:
        return jsonify({"error": "Could not read leaderboard", "detail": str(e)}), 500


@app.route("/add_score", methods=["POST"])
def add_score():
    """Save one score permanently in Atlas and return an updated leaderboard slice."""
    if not request.json:
        return jsonify({"error": "Expected JSON body"}), 400

    data = request.json

    try:
        name = str(data["name"]).strip()
        score = int(data["score"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "JSON needs string 'name' and integer 'score'"}), 400

    # Each document represents one player's score submission.
    doc = {
        "name": name[:64],  # keep names short—adjust if needed
        "score": score,
        "created_at": datetime.now(timezone.utc),
    }

    try:
        leaderboard_coll.insert_one(doc)

        sorted_rows = list(leaderboard_coll.find().sort("score", -1).limit(50))
        leaderboard = [_serialize_doc(d) for d in sorted_rows]

        return jsonify({
            "message": "Score added",
            "leaderboard": leaderboard,
        })
    except PyMongoError as e:
        return jsonify({"error": "Could not save score", "detail": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
