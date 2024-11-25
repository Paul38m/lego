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

    // Sélectionner tous les <a> avec la classe 'prodl' pour récupérer les produits
    const test = $('a.prodl').length;  // Compte le nombre de <a> avec la classe "prodl"
    console.log(`Found ${test} deals`);

    const deals = [];

    // Sélectionner chaque produit
    $('a.prodl').each((index, element) => {
      // Récupérer le titre du produit
      const title = $(element).find('span.prodl-libelle').text().trim();

      // Récupérer la référence (ID du produit)
      const ref = $(element).find('span.prodl-ref').text().trim();

      // Récupérer le prix
      const price = $(element).find('span.prodl-prix span').text().trim();

      // Récupérer le pourcentage de réduction
      const discount = $(element).find('span.prodl-reduc').text().trim();

      // Récupérer le lien du produit
      const link = $(element).attr('href');
      
      if (title && price && link) {
        // Créer un objet pour chaque deal et l'ajouter au tableau
        deals.push({
          title,
          ref,
          price,
          discount,
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
