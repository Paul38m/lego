import { load } from 'cheerio'; // Importing the 'cheerio' library to parse HTML
import fetch from 'node-fetch'; // Importing 'node-fetch' to fetch web pages

// Function to fetch the HTML content of a given URL
async function fetchHTML(url) {
  try {
    // Send a GET request to the URL
    const response = await fetch(url);

    // If the response is not successful, throw an error
    if (!response.ok) {
      throw new Error(`Error fetching page: ${response.statusText}`);
    }
    
    // Return the HTML content of the page
    return await response.text();
  } catch (error) {
    // Log any error that occurs during the fetch process
    console.error(`Error fetching the URL ${url}: ${error.message}`);
    throw error;
  }
}

// Function to scrape the details of a product from its individual page
async function scrapeProductDetails(productUrl) {
  try {
    // Fetch the HTML content of the product page
    const html = await fetchHTML(productUrl);
    const $ = load(html); // Load the HTML content into Cheerio for parsing

    // Extract specific product details using CSS selectors
    const title = $('.prodf-libelle.titre.sl').text().trim(); // Product title
    const model = $('span[itemprop="model"]').text().trim(); // Product model
    const brand = $('meta[itemprop="name"]').attr('content') || ''; // Brand name (from meta tag)
    const sku = $('span[itemprop="sku"]').text().trim(); // SKU (Stock Keeping Unit)
    const releaseDate = $('span[itemprop="releaseDate"]').text().trim(); // Release date
    const category = $('span[itemprop="category"]').text().trim(); // Category
    const price = $('span.px-hidden[itemprop="lowPrice"]').text().trim(); // Product price
    const discount = $('.prodf-reduc strong').text().trim(); // Discount information
    const imageUrl = $('.prodf-img img').attr('src'); // Product image URL

    // Return the product details in an object
    return {
      community: 'avenue de la brique', // Source of the deal (community name)
      title,
      model,
      brand,
      sku,
      releaseDate,
      category,
      price,
      discount,
      imageUrl: imageUrl ? `https://www.avenuedelabrique.com${imageUrl}` : null, // Complete the image URL if present
    };
  } catch (error) {
    // If an error occurs while scraping product details, log it and return null
    console.error(`Error scraping product details: ${productUrl} - ${error.message}`);
    return null; // Returning null to avoid breaking the scraping process
  }
}

// Main function to scrape deals from the given URL
async function scrape(url) {
  try {
    // Fetch the HTML content of the main page with deals
    const html = await fetchHTML(url);
    const $ = load(html); // Parse the HTML content with Cheerio

    // Create an array to hold all the deals on the current page
    const products = [];

    // Loop through each product element on the page
    $('a.prodl').each((index, element) => {
      const title = $(element).find('span.prodl-libelle').text().trim(); // Extract product title
      const price = $(element).find('span.prodl-prix span').text().trim(); // Extract product price
      const discount = $(element).find('span.prodl-reduc').text().trim(); // Extract product discount
      const link = $(element).attr('href'); // Get the link to the product page

      // If a product link exists, push the product details into the array
      if (link) {
        products.push({
          title,
          price,
          discount,
          link: `${link}`, // Complete the product link if necessary
        });
      }
    });

    // Log the number of deals found
    console.log(`Found ${products.length} deals.`);

    // Scrape the details for each product asynchronously
    const detailedProducts = await Promise.all(
      products.map(async (product) => {
        const details = await scrapeProductDetails(product.link); // Fetch detailed information for each product
        return {
          ...product, // Merge the basic product details with the scraped details
          ...details, 
        };
      })
    );

    // Filter out any products that failed to scrape details (i.e., where details are null)
    return detailedProducts.filter(Boolean); 
  } catch (error) {
    // Log any error that occurs during the scraping process
    console.error(`Error during scraping: ${error.message}`);
    throw error; // Rethrow the error for further handling
  }
}

// Export the scrape function as the default export to be used in other files
export { scrape };
