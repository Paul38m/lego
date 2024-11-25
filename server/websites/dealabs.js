import { load } from 'cheerio';
import fetch from 'node-fetch';

export async function scrape(url) {
  try {
    // Ajout des en-têtes pour simuler une requête depuis un navigateur
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };

    const response = await fetch(url, { headers });  // Passe les headers dans la requête

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération de la page: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = load(html);

    // Vérification de la présence des balises <div> avec la classe "threadGrid"
    const test = $('.threadGrid').length;
    console.log(`Found ${test} deals`);

    const deals = [];

    // Sélectionnez chaque bloc de deal avec le tag <div> et la classe "threadGrid"
    $('.threadGrid').each((index, element) => {
      const title = $(element).find('.threadGrid-title a').text().trim();
      const description = $(element).find('.userHtml-content').text().trim();
      const price = $(element).find('.threadItemCard-price').text().trim();
      const originalPrice = $(element).find('.color--text-NeutralSecondary.text--lineThrough').text().trim();
      const link = $(element).find('.threadGrid-title a').attr('href');
      const image = $(element).find('.threadGrid-image img').attr('src');

      // On peut aussi extraire la validité du deal s'il y a une information, mais ici, ce n'est pas disponible
      const validity = "No validity specified";  // On peut mettre une valeur par défaut si la validité n'est pas présente

      if (title && description && link) {
        deals.push({
          title,
          description,
          price,
          originalPrice,
          validity,
          link: link ? `https://www.dealabs.com${link}` : null,
          image: image ? image : null,
        });
      }
    });

    return deals;
  } catch (error) {
    console.error(`Erreur lors du scraping: ${error.message}`);
    throw error;
  }
}
