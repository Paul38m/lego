import { load } from 'cheerio';
import fetch from 'node-fetch';

export async function scrape(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération de la page: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = load(html);

    // Stocker les annonces trouvées
    const deals = [];

    // Parcours des éléments contenant les annonces
    $('div[data-testid^="product-item-id-"]').each((index, element) => {
      const title = $(element).find('[data-testid$="--description-title"]').text().trim();
      const price = $(element).find('[data-testid$="--price-text"]').text().trim();
      const link = $(element).find('a.new-item-box__overlay').attr('href');
      const imageUrl = $(element).find('img[data-testid$="--image--img"]').attr('src');

      if (title && price && link) {
        deals.push({
          title,
          price,
          link: link.startsWith('http') ? link : `https://www.vinted.fr${link}`,
          imageUrl: imageUrl || null,
        });
      }
    });

    console.log(`🎉 Found ${deals.length} deals`);
    return deals;
  } catch (error) {
    console.error(`Erreur lors du scraping: ${error.message}`);
    throw error;
  }
}
