// models/searchModel.js
import fetch from "node-fetch";

export async function searchYouTube(query, apiKey) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(
    query
  )}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Données reçues de YouTube:", data);

    return data.items || [];
  } catch (error) {
    console.error("Erreur lors de la requête à YouTube:", error);
    throw new Error("Erreur lors de la recherche YouTube");
  }
}

export async function getYouTubeSuggestions(query) {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    // L'API retourne un tableau où data[1] contient les suggestions
    return data[1] || [];
  } catch (error) {
    console.error("Erreur lors de la requête de suggestions:", error);
    throw new Error("Erreur lors de la récupération des suggestions");
  }
}
