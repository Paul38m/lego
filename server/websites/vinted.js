import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'fr',
  Connection: 'keep-alive',
  Referer: 'https://www.vinted.fr/catalog?search_text=lego'
};

/**
 * Parse JSON data from Vinted
 * @param {Object} data - JSON response
 * @returns {Array} - Array of parsed deal objects
 */
const parse = (data) => {
  if (!data || !data.items) {
    console.error('❌ Error: No items found in the response data.');
    return [];
  }

  return data.items.map(item => ({
    id: item.id || uuidv4(),
    title: item.title || 'No title',
    price: parseFloat(item.total_item_price.amount) || 0,
    link: `https://www.vinted.fr${item.url || ''}`,
    published: new Date(item.photo.high_resolution.timestamp * 1000).toISOString(),
    uuid: uuidv4()
  }));
};

/**
 * Fetch and scrape deals from Vinted with pagination
 * @param {String} searchText - Search term (e.g., "lego")
 * @param {Number} time - Optional timestamp to filter
 * @returns {Array} - Scraped deals
 */
export async function scrape(searchText) {
  let allDeals = [];
  let page = 1;

  try {
    const { csrfToken, cookies } = await TokenCookie();

    while (true) {
      const url = `https://www.vinted.fr/api/v2/catalog/items?search_text=${searchText}&page=${page}&status_ids%5B%5D=6&status_ids%5B%5D=1`;

      const response = await fetch(url, {
        headers: {
          ...headers,
          'X-Csrf-Token': csrfToken,
          Cookie: cookies
        }
      });

      if (!response.ok) {
        console.error(`❌ Response error: ${response.status} - ${response.statusText}`);
        break;
      }

      const data = await response.json();
      const deals = parse(data);

      if (deals.length === 0) {
        console.log('✅ No more deals found. Stopping pagination.');
        break; // Stop if no more results
      }

      allDeals = allDeals.concat(deals);
      page++;
    }

    console.log(`✅ Fetched ${allDeals.length} deals in total.`);
    return allDeals;
  } catch (error) {
    console.error('❌ Error scraping Vinted:', error);
    return [];
  }
}

/**
 * Fetch CSRF token and cookies for Vinted
 * @returns {Object} - CSRF token and cookies
 */
async function TokenCookie() {
  try {
    const response = await fetch('https://www.vinted.fr/', {
      headers: { 'User-Agent': headers['User-Agent'] }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }

    const cookies = response.headers.get('set-cookie') || '';
    const text = await response.text();
    const csrfTokenMatch = text.match(/"CSRF_TOKEN":"([^"]+)"/);
    const csrfToken = csrfTokenMatch ? csrfTokenMatch[1] : '';

    if (!csrfToken) throw new Error('CSRF token not found in the response.');

    return { csrfToken, cookies };
  } catch (error) {
    console.error('❌ Error fetching token and cookies:', error);
    return { csrfToken: '', cookies: '' };
  }
}
