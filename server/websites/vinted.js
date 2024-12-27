import fetch from 'node-fetch'; // Importing 'node-fetch' to make HTTP requests
import { v4 as uuidv4 } from 'uuid'; // Importing 'uuid' to generate unique identifiers

// Custom headers for the request to simulate a real browser
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'fr',
  Connection: 'keep-alive',
  Referer: 'https://www.vinted.fr/catalog?search_text=lego' // Referring URL for Vinted's catalog
};

/**
 * Parse JSON data from the Vinted API response
 * @param {Object} data - The JSON response object
 * @returns {Array} - Array of parsed deal objects containing the product information
 */
const parse = (data) => {
  // Check if the response contains 'items', else log an error and return an empty array
  if (!data || !data.items) {
    console.error('❌ Error: No items found in the response data.');
    return [];
  }

  // Map through the items and extract relevant information
  return data.items.map(item => ({
    community : 'vinted', // Community name (Vinted)
    id: item.id || uuidv4(), // Use the item ID or generate a unique ID
    title: item.title || 'No title', // Extract the title or provide a default if missing
    price: parseFloat(item.total_item_price.amount) || 0, // Parse the price, default to 0 if missing
    link: `https://www.vinted.fr${item.url || ''}`, // Build the URL for the product listing
    publishedAt: new Date(item.photo.high_resolution.timestamp * 1000).toLocaleString(), // Convert timestamp to a readable date format
    uuid: uuidv4() // Generate a unique UUID for each item
  }));
};

/**
 * Main function to fetch and scrape deals from Vinted with pagination
 * @param {String} searchText - The search term to filter results (e.g., "lego")
 * @param {Number} time - Optional timestamp to filter results (not used here)
 * @returns {Array} - Array of scraped deals
 */
export async function scrape(searchText) {
  let allDeals = []; // Array to store all the deals fetched
  let page = 1; // Start from the first page

  try {
    // Fetch CSRF token and cookies needed for the request headers
    const { csrfToken, cookies } = await TokenCookie();

    // Infinite loop for paginated results
    while (true) {
      // Build the URL with pagination and search text
      const url = `https://www.vinted.fr/api/v2/catalog/items?search_text=${searchText}&page=${page}&status_ids%5B%5D=6&status_ids%5B%5D=1`;

      // Make a request to the Vinted API with necessary headers (including CSRF token and cookies)
      const response = await fetch(url, {
        headers: {
          ...headers,
          'X-Csrf-Token': csrfToken, // Add CSRF token to headers
          Cookie: cookies // Include cookies in the request
        }
      });

      // If the response is not successful, log the error and break the loop
      if (!response.ok) {
        console.error(`❌ Response error: ${response.status} - ${response.statusText}`);
        break;
      }

      // Parse the JSON response
      const data = await response.json();
      const deals = parse(data); // Parse the deals from the response

      // If no deals are found, stop the pagination
      if (deals.length === 0) {
        console.log('✅ No more deals found. Stopping pagination.');
        break; // Stop the loop if there are no more deals
      }

      // Add the fetched deals to the allDeals array
      allDeals = allDeals.concat(deals);
      page++; // Increment the page number for the next iteration
    }

    console.log(`✅ Fetched ${allDeals.length} deals in total.`); // Log the total number of deals fetched
    return allDeals; // Return the array of all deals
  } catch (error) {
    // Handle any errors that occur during the scraping process
    console.error('❌ Error scraping Vinted:', error);
    return []; // Return an empty array if there was an error
  }
}

/**
 * Fetch CSRF token and cookies from Vinted's website
 * @returns {Object} - Object containing CSRF token and cookies for making requests
 */
async function TokenCookie() {
  try {
    // Make a request to the Vinted homepage to fetch cookies and the CSRF token
    const response = await fetch('https://www.vinted.fr/', {
      headers: { 'User-Agent': headers['User-Agent'] }
    });

    // If the response is not successful, throw an error
    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }

    // Extract the cookies from the response headers
    const cookies = response.headers.get('set-cookie') || '';
    const text = await response.text(); // Get the HTML of the response body
    const csrfTokenMatch = text.match(/"CSRF_TOKEN":"([^"]+)"/); // Extract the CSRF token from the HTML

    const csrfToken = csrfTokenMatch ? csrfTokenMatch[1] : ''; // If token is found, use it; otherwise, return empty string

    // If no CSRF token is found, throw an error
    if (!csrfToken) throw new Error('CSRF token not found in the response.');

    return { csrfToken, cookies }; // Return the CSRF token and cookies for use in the API request
  } catch (error) {
    // Handle any errors that occur while fetching the CSRF token and cookies
    console.error('❌ Error fetching token and cookies:', error);
    return { csrfToken: '', cookies: '' }; // Return empty values if an error occurred
  }
}
