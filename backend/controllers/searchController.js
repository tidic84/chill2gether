// controllers/searchController.js
import { searchYouTube, getYouTubeSuggestions } from "../model/searchModel.js";

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

export async function getSuggestions(req, res) {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Le paramètre 'q' est requis." });
  }

  try {
    const suggestions = await getYouTubeSuggestions(query);
    res.json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des suggestions." });
  }
}
