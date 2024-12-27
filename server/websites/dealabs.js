import { load } from 'cheerio'; // Importing the 'cheerio' library to parse and query HTML
import fetch from 'node-fetch'; // Importing 'node-fetch' to make HTTP requests
import { v4 as uuidv4 } from 'uuid'; // Importing 'uuid' to generate unique IDs

// Function to fetch the HTML content of a URL
async function fetchHTML(url) {
  // Define custom headers to simulate a real browser request
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };

  // Send a GET request to the URL with the specified headers
  const response = await fetch(url, { headers });
  
  // If the response is not successful (status code not OK), throw an error
  if (!response.ok) {
    throw new Error(`Error fetching the page: ${response.statusText}`);
  }

  // Return the HTML content as a text string
  return await response.text();
}

// Main function to scrape the list of deals from the given URL
export async function scrape(url) {
  try {
    // Fetch the HTML content of the main URL
    const html = await fetchHTML(url);
    const $ = load(html); // Load the HTML content into Cheerio for parsing

    const deals = []; // Array to store the extracted deal information

    // Loop through each article (deal) in the list of threads
    $('.js-threadList article.thread').each((_, element) => {
      // Extract the JSON data from the 'data-vue2' attribute of the element
      const vueData = $(element).find('.js-vue2').attr('data-vue2');

      if (vueData) {
        try {
          // Parse the JSON data from the 'data-vue2' attribute
          const data = JSON.parse(vueData);

          if (data?.props?.thread) {
            const thread = data.props.thread; // Extract the thread (deal) information

            // Extract the relevant deal data
            const community = 'dealabs'; // The community name
            const title = thread.title || ''; // The title of the deal
            const price = thread.price || 0; // The price of the deal
            const nextBestPrice = thread.nextBestPrice || 0; // The next best price
            const commentCount = thread.commentCount || 0; // The number of comments
            const temperature = thread.temperature || 0; // The community temperature (upvotes or rating)
            const publishedAt = thread.publishedAt || ''; // The timestamp of when the deal was posted
            const link = thread.link || ''; // The link to the deal page

            // Calculate the discount if nextBestPrice is available
            const discount =
              nextBestPrice > 0
                ? parseFloat((100 - (price / nextBestPrice) * 100).toFixed(2))
                : null;

            // Try to extract the deal ID from the title (ID enclosed in parentheses)
            const parenthesisMatch = title.match(/\((\d{5,})\)/);
            let id = parenthesisMatch ? parenthesisMatch[1] : null;
            if (!id) {
              // If no ID is found in parentheses, try to extract a number from the title
              const words = title.split(' ');
              id = words.find((word) => /^\d{5,}$/.test(word)) || null;
            }

            // Extract the image URL if available
            const dataVue2 = $(element).find('div.threadGrid div div').attr('data-vue2');
            let photo = '';
            if (dataVue2) {
              try {
                const dataVue2Json = JSON.parse(dataVue2); // Parse the image data
                photo = dataVue2Json.props.threadImageUrl || ''; // Extract the image URL
              } catch (err) {
                console.error('Error parsing the image data-vue2:', err.message);
              }
            }

            // Generate a unique UUID for the deal
            const uuid = uuidv4();

            // Push the extracted deal data to the deals array
            deals.push({
              community, // The community name
              title, // The deal title
              id, // The deal ID
              price, // The price of the deal
              nextBestPrice, // The next best price
              discount, // The calculated discount percentage
              commentCount, // The number of comments
              temperature, // The temperature (rating) from the community
              publishedAt: new Date(publishedAt * 1000).toLocaleString(), // Convert the timestamp to a human-readable date
              link, // The link to the deal
              photo, // The URL of the image associated with the deal
              uuid, // The generated UUID for the deal
            });
          }
        } catch (err) {
          // Log any errors that occur while parsing the 'data-vue2' attribute
          console.error('Error parsing data-vue2:', err.message);
        }
      }
    });

    // Return the list of deals
    return deals;
  } catch (error) {
    // Log any errors that occur during the scraping process
    console.error(`Error during scraping: ${error.message}`);
    throw error; // Rethrow the error for further handling
  }
}
