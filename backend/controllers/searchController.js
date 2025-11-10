// controllers/searchController.js
import { searchYouTube } from "../model/searchModel.js";

export async function getSearchResults(req, res) {
  const query = req.query.q;
  const apiKey = process.env.YT_API_KEY;

  if (!query) {
    return res.status(400).json({ error: "Le paramètre 'q' est requis." });
  }

  try {
    const results = await searchYouTube(query, apiKey);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la recherche YouTube." });
  }
}
