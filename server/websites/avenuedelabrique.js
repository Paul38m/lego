import { load } from 'cheerio';
import fetch from 'node-fetch';

async function fetchHTML(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération de la page: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'URL ${url}: ${error.message}`);
    throw error;
  }
}

async function scrapeProductDetails(productUrl) {
  try {
    const html = await fetchHTML(productUrl);
    const $ = load(html);

    // Extraire les détails spécifiques au produit
    const title = $('.prodf-libelle.titre.sl').text().trim();
    const model = $('span[itemprop="model"]').text().trim();
    const brand = $('meta[itemprop="name"]').attr('content') || '';
    const sku = $('span[itemprop="sku"]').text().trim();
    const releaseDate = $('span[itemprop="releaseDate"]').text().trim();
    const category = $('span[itemprop="category"]').text().trim();
    const price = $('span.px-hidden[itemprop="lowPrice"]').text().trim();
    const discount = $('.prodf-reduc strong').text().trim();
    const imageUrl = $('.prodf-img img').attr('src');

    return {
      title,
      model,
      brand,
      sku,
      releaseDate,
      category,
      price,
      discount,
      imageUrl: imageUrl ? `https://www.avenuedelabrique.com${imageUrl}` : null,
      //productUrl,
    };
  } catch (error) {
    console.error(`Erreur lors du scraping des détails du produit : ${productUrl} - ${error.message}`);
    return null; // Retourner null en cas d'erreur pour éviter de casser l'ensemble du scraping
  }
}

async function scrape(url) {
  try {
    const html = await fetchHTML(url);
    const $ = load(html);

    // Sélectionner tous les produits de la page principale
    const products = [];
    $('a.prodl').each((index, element) => {
      const title = $(element).find('span.prodl-libelle').text().trim();
      //const ref = $(element).find('span.prodl-ref').text().trim();
      const price = $(element).find('span.prodl-prix span').text().trim();
      const discount = $(element).find('span.prodl-reduc').text().trim();
      const link = $(element).attr('href');

      if (link) {
        products.push({
          title,
          //ref,
          price,
          discount,
          link: `${link}`,
        });
      }
    });

    console.log(`Found ${products.length} deals.`);

    // Scraper les détails de chaque produit
    const detailedProducts = await Promise.all(
      products.map(async (product) => {
        const details = await scrapeProductDetails(product.link);
        return {
          ...product,
          ...details, // Fusionne les informations de la page principale avec les détails
        };
      })
    );

    return detailedProducts.filter(Boolean); // Supprime les produits dont le scraping des détails a échoué
  } catch (error) {
    console.error(`Erreur lors du scraping : ${error.message}`);
    throw error;
  }
}

// Exporter la fonction scrape comme une fonction par défaut pour être utilisée dans sandbox.js
export { scrape };
