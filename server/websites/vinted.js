import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

// Configuration des headers pour les requêtes
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'fr',
  Connection: 'keep-alive',
};

/**
 * Fonction pour récupérer un token CSRF et les cookies nécessaires
 * @returns {Object} - Contient les cookies et le token CSRF
 */
async function getCsrfTokenAndCookies() {
  const url = 'https://www.vinted.fr/';
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Initial request failed with status: ${response.status}`);
    }

    const cookies = response.headers.get('set-cookie');
    const text = await response.text();
    const csrfTokenMatch = text.match(/"CSRF_TOKEN":"([^"]+)"/);
    const csrfToken = csrfTokenMatch ? csrfTokenMatch[1] : null;

    if (!csrfToken) {
      throw new Error('Unable to retrieve CSRF token');
    }

    return { cookies, csrfToken };
  } catch (error) {
    console.error('Error retrieving CSRF token and cookies:', error);
    throw error;
  }
}

/**
 * Analyse les données de la réponse et retourne les deals
 * @param {Object} data - Données JSON issues de l'API
 * @param {String} itemId - Identifiant de l'article recherché
 * @returns {Array} - Liste des deals
 */
function parseDeals(data, itemId) {
  return data.items.map((item) => {
    const title = item.title || 'Unknown title';
    const price = parseFloat(item.total_item_price.amount) || 0; // Total item price
    const link = item.url || '';
    const publishedAt = new Date(item.photo.high_resolution.timestamp * 1000).toLocaleString();
    const uuid = uuidv4();

    return {
      id: itemId,
      title,
      price,
      link,
      publishedAt,
      uuid,
    };
  });
}

/**
 * Scrape une page Vinted pour les deals correspondants à un ID donné
 * @param {String} url - URL de la page à scraper
 * @param {String} itemId - Identifiant de l'article recherché
 * @returns {Array|null} - Liste des deals ou null en cas d'erreur
 */
export async function scrape(url, itemId) {
  try {
    const { csrfToken, cookies } = await getCsrfTokenAndCookies();

    const response = await fetch(url, {
      headers: {
        ...headers,
        'X-Csrf-Token': csrfToken,
        Cookie: cookies,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Response error: status ${response.status} - ${response.statusText}\n${errorText}`);
      return null;
    }

    const data = await response.json();
    return parseDeals(data, itemId);
  } catch (error) {
    console.error(`Error scraping URL ${url}:`, error);
    return null;
  }
}
