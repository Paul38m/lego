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

    // Vérification de la présence des balises <a> avec la classe "pn"
    const test = $('a.pn').length;  // Compte le nombre de <a> avec la classe "pn"
    console.log(`Found ${test} deals`);

    const deals = [];

    // Sélectionnez chaque bloc de deal avec le tag <a> et la classe "pn"
    $('a.pn').each((index, element) => {
      const title = $(element).find('h3.pn-lib').text().trim();
      const validity = $(element).find('span.pn-dat').text().trim();
      const description = $(element).find('span.pn-txt').text().trim();
      const link = $(element).attr('href');

      if (title && validity && description && link) {
        deals.push({
          title,
          validity,
          description,
          link: link ? `https://www.avenuedelabrique.com${link}` : null,
        });
      }
    });

    return deals;
  } catch (error) {
    console.error(`Erreur lors du scraping: ${error.message}`);
    throw error;
  }
}
