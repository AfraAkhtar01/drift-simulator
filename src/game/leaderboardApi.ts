/**
 * All HTTP calls to the Flask leaderboard API live here so the rest of the app
 * stays focused on UI and game logic.
 *
 * Optional: create a `.env` file in the project root with something like:
 *   VITE_API_URL=http://127.0.0.1:5000
 * so you can change the backend address without touching code (e.g. phone on LAN).
 */
const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://127.0.0.1:5000';

/** One row as returned by the server (MongoDB adds _id and created_at). */
export interface LeaderboardRow {
  name: string;
  score: number;
  _id?: string;
  created_at?: string;
}

/** Turn a loose JSON row into safe numbers/strings for React. */
function normalize(row: LeaderboardRow): LeaderboardRow {
  return {
    ...row,
    name: typeof row.name === 'string' ? row.name : 'Unknown',
    score: typeof row.score === 'number' ? row.score : Number(row.score) || 0,
  };
}

/** GET /leaderboard — receives the ranked list saved in MongoDB Atlas. */
export async function fetchLeaderboardFromServer(): Promise<LeaderboardRow[]> {
  const res = await fetch(`${API_BASE}/leaderboard`);
  const data = await res.json();

  if (!res.ok) {
    const msg = typeof data?.error === 'string' ? data.error : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  if (!Array.isArray(data)) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'Unexpected leaderboard response');
  }

  return data.map((row: LeaderboardRow) => normalize(row));
}

/** POST /add_score — persists a score; Flask responds with an updated leaderboard array. */
export async function submitScoreToServer(name: string, score: number): Promise<LeaderboardRow[]> {
  const res = await fetch(`${API_BASE}/add_score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, score: Math.round(score) }),
  });
  const data = await res.json();

  if (!res.ok) {
    const msg = typeof data?.error === 'string' ? data.error : `Save failed (${res.status})`;
    throw new Error(msg);
  }

  const list = data?.leaderboard;
  if (!Array.isArray(list)) {
    throw new Error('Unexpected response when saving score');
  }

  return list.map((row: LeaderboardRow) => normalize(row));
}
