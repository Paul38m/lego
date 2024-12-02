import fetch from 'node-fetch';

async function scrape(query) {
  try {
    // Construire l'URL de l'API Vinted avec les paramètres de recherche
    const apiUrl = `https://www.vinted.fr/api/v2/catalog/items?search_text=${encodeURIComponent(
      query
    )}&page=1&per_page=50`;

    console.log(`🔍 Fetching deals from Vinted API for query: "${query}"`);

    // Ajouter des en-têtes pour simuler un vrai utilisateur
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      Referer: 'https://www.vinted.fr/',
    };

    // Effectuer la requête API
    const response = await fetch(apiUrl, { headers });
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des données : ${response.statusText}`);
    }

    const data = await response.json();

    // Extraire et formater les deals
    const deals = data.items.map((item) => ({
      title: item.title,
      price: item.price,
      brand: item.brand_title || 'Unknown',
      size: item.size_title || 'Unknown',
      category: item.catalog_category?.name || 'Unknown',
      imageUrl: item.photos?.[0]?.url || null,
      productUrl: `https://www.vinted.fr${item.path}`,
      condition: item.condition_title || 'Unknown',
    }));

    console.log(`✅ Found ${deals.length} deals.`);
    return deals;
  } catch (error) {
    console.error(`❌ Error fetching Vinted deals: ${error.message}`);
    throw error;
  }
}


// Exporter la fonction scrape pour être utilisée dans sandbox.js
export { scrape };
