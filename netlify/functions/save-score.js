const { getStore, connectLambda } = require("@netlify/blobs");

const STORE_NAME = "shark-run-leaderboard";
const KEY = "scores";
const MAX_ENTRIES = 5;
const MAX_NAME_LEN = 12;
const MAX_SCORE = 100000;

exports.handler = async (event) => {
  connectLambda(event);

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  let name = (payload.name || "SHARK").toString().trim().toUpperCase().slice(0, MAX_NAME_LEN);
  if (!name) name = "SHARK";

  const score = parseInt(payload.score, 10);
  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid score" }) };
  }

  try {
    const store = getStore(STORE_NAME);
    let list = await store.get(KEY, { type: "json" });
    if (!Array.isArray(list)) list = [];

    list.push({ name, score, ts: Date.now() });
    list.sort((a, b) => b.score - a.score);
    list = list.slice(0, MAX_ENTRIES);

    await store.setJSON(KEY, list);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, leaderboard: list })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error" })
    };
  }
};

