const { getStore, connectLambda } = require("@netlify/blobs");

const STORE_NAME = "shark-run-leaderboard";
const KEY = "scores";
const MAX_ENTRIES = 5;

exports.handler = async (event) => {
  connectLambda(event);

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const store = getStore(STORE_NAME);
    let list = await store.get(KEY, { type: "json" });
    if (!Array.isArray(list)) list = [];

    list.sort((a, b) => b.score - a.score);
    list = list.slice(0, MAX_ENTRIES);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(list)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error" })
    };
  }
};
