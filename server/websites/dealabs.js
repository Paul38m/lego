import { load } from 'cheerio';
import fetch from 'node-fetch';

// Fonction pour récupérer le HTML d'une URL
async function fetchHTML(url) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération de la page: ${response.statusText}`);
  }
  return await response.text();
}

// Fonction pour scraper les détails d'un deal spécifique
async function scrapeDealDetails(dealUrl) {
  try {
    const html = await fetchHTML(dealUrl);
    const $ = load(html);

    // Extraire les informations spécifiques depuis le HTML
    const temperature = $('.cept-vote-temp').text().trim();
    const retailer = $('.threadItemCard-gallery-controls + div .link').text().trim();
    const shipping = $('.icon--truck + span').text().trim();
    const dealDate = $('[title]').attr('title'); // Date du deal

    return {
      temperature,
      retailer,
      shipping,
      dealDate,
    };
  } catch (error) {
    console.error(`Erreur lors du scraping du deal ${dealUrl}: ${error.message}`);
    return null;
  }
}

// Fonction principale pour scraper la liste des deals et leurs détails
export async function scrape(url) {
  try {
    const html = await fetchHTML(url);
    const $ = load(html);

    const deals = [];
    $('.threadGrid').each((_, element) => {
      const title = $(element).find('.threadGrid-title a').text().trim();
      const description = $(element).find('.userHtml-content').text().trim();
      const price = $(element).find('.threadItemCard-price').text().trim();
      const originalPrice = $(element).find('.color--text-NeutralSecondary.text--lineThrough').text().trim();
      const link = $(element).find('.threadGrid-title a').attr('href');

      if (title && link) {
        deals.push({
          title,
          description,
          price,
          originalPrice,
          link: `${link}`,
        });
      }
    });

    // Ajouter les détails spécifiques pour chaque deal
    for (const deal of deals) {
      const details = await scrapeDealDetails(deal.link);
      if (details) {
        deal.details = details;
      }
    }

    return deals;
  } catch (error) {
    console.error(`Erreur lors du scraping: ${error.message}`);
    throw error;
  }
}
