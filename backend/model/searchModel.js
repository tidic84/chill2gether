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

    // Tu peux filtrer ici si tu veux renvoyer uniquement certaines infos
    return data.items || [];
  } catch (error) {
    console.error("Erreur lors de la requête à YouTube:", error);
    throw new Error("Erreur lors de la recherche YouTube");
  }
}
