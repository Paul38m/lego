import { scrape as scrapeAvenueDeLaBrique } from './websites/avenuedelabrique.js';
import { scrape as scrapeDealabs } from './websites/dealabs.js';
import { scrape as scrapeVinted } from './websites/vinted.js';
import fs from 'fs';
import {
  findBestDiscountDeals,
  findMostCommentedDeals,
  findDealsSortedByPrice,
  findDealsSortedByDate,
  countDealsById,
  findRecentSales
} from './queries.js';
import { MongoClient } from 'mongodb';

// MongoDB connection URI and database name
const MONGODB_URI = 'mongodb+srv://Paul:Carapuce38@cluster0.udtxd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB_NAME = 'lego';

async function sandbox(option) {
  let client;

  try {
    console.log('📦 Connecting to MongoDB...');
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');

    // If the user selected any scraping option, clear the previous deals
    if (['avenue', 'dealabs', 'vinted', 'all'].includes(option)) {
      console.log('🧹 Clearing previous deals from MongoDB...');
      await collection.deleteMany({});
    }

    let deals = [];

    // Scraping deals from Avenue de la Brique
    if (option === 'avenue') {
      console.log('🕵️‍♀️ Scraping deals from Avenue de la Brique...');
      deals = await scrapeAvenueDeLaBrique('https://www.avenuedelabrique.com/promotions-et-bons-plans-lego');
    } 
    // Scraping deals from Dealabs with pagination
    else if (option === 'dealabs') {
      console.log('🕵️‍♀️ Scraping deals from Dealabs...');
    
      let deals = [];
      let page = 1;
      let hasMorePages = true;
    
      try {
        while (hasMorePages) {
          const url = `https://www.dealabs.com/groupe/lego?hide_expired=true&time_frame=30&page=${page}`;
    
          try {
            const pageDeals = await scrapeDealabs(url);
    
            if (pageDeals.length === 0) {
              hasMorePages = false; // Stop if no more deals are found
            } else {
              deals = deals.concat(pageDeals); // Accumulate results
              page++; // Move to the next page
            }
          } catch (error) {
            if (error.message.includes('Gone')) {
              console.error('❌ Pagination limit reached (HTTP 410). Stopping.');
              hasMorePages = false;
            } else {
              console.error(`❌ Error scraping page ${page}:`, error.message);
              hasMorePages = false; // Stop on unexpected errors
            }
          }
        }
    
        if (deals.length > 0) {
          console.log(`📂 Inserting ${deals.length} deals into MongoDB...`);
          const result = await collection.insertMany(deals);
          console.log(`✅ ${result.insertedCount} deals have been inserted into the database.`);
    
          const filePath = `./dealabs_deals.json`;
          fs.writeFileSync(filePath, JSON.stringify(deals, null, 2), 'utf-8');
          console.log(`📝 Deals have been saved to ${filePath}`);
        } else {
          console.log('🔍 No deals found.');
        }
      } catch (globalError) {
        console.error(`❌ An unexpected error occurred: ${globalError.message}`);
      } finally {
        if (client) {
          console.log('🔌 Closing MongoDB connection...');
          await client.close();
        }
        console.log('👋 Exiting program...');
        process.exit(0); // Force the program to terminate cleanly
      }
    } 
    // Scraping deals from Vinted with pagination
    else if (option === 'vinted') {
      console.log('🛍️ Scraping deals from Vinted...');
    
      const searchText = 'lego';
      let vintedDeals = [];
      let vintedPage = 1;
      let hasMoreVintedPages = true;
    
      try {
        while (hasMoreVintedPages) {
          try {
            const pageDeals = await scrapeVinted(searchText, vintedPage);
    
            if (pageDeals.length === 0) {
              console.log(`✅ No more deals found on Vinted. Stopping at page ${vintedPage}.`);
              hasMoreVintedPages = false; // Stop pagination
            } else {
              vintedDeals = vintedDeals.concat(pageDeals);
              console.log(`📄 Fetched ${pageDeals.length} deals from Vinted page ${vintedPage}.`);
              vintedPage++;
            }
          } catch (error) {
            if (error.message.includes('429')) {
              console.warn(`⚠️ Vinted rate limit hit (HTTP 429 Too Many Requests). Stopping pagination.`);
            } else {
              console.error(`❌ Error scraping Vinted page ${vintedPage}: ${error.message}`);
            }
            hasMoreVintedPages = false; // Stop on error
          }
        }
    
        console.log(`✅ Fetched ${vintedDeals.length} deals from Vinted.`);
    
        // Insert the results into MongoDB
        if (vintedDeals.length > 0) {
          console.log(`📂 Inserting ${vintedDeals.length} deals into MongoDB...`);
          const result = await collection.insertMany(vintedDeals);
          console.log(`✅ ${result.insertedCount} deals have been inserted into the database.`);
    
          // Save the results to a JSON file
          const filePath = `./vinted_deals.json`;
          fs.writeFileSync(filePath, JSON.stringify(vintedDeals, null, 2), 'utf-8');
          console.log(`📝 Deals have been saved to ${filePath}`);
        } else {
          console.log('🔍 No deals found on Vinted.');
        }
      } catch (error) {
        console.error(`❌ An unexpected error occurred while scraping Vinted: ${error.message}`);
      } finally {
        if (client) {
          console.log('🔌 Closing MongoDB connection...');
          await client.close();
        }
        console.log('👋 Exiting program...');
        process.exit(0); // Force clean termination of the program
      }
    } 
    // Scraping from all sources (Avenue, Dealabs, and Vinted)
    else if (option === 'all') {
      console.log('🕵️‍♀️ Scraping deals from all sources...');
    
      let allDeals = [];
    
      try {
        // Scraping Avenue de la Brique
        /*console.log('🧱 Scraping deals from Avenue de la Brique...');
        const avenueDeals = await scrapeAvenueDeLaBrique('https://www.avenuedelabrique.com/promotions-et-bons-plans-lego');
        console.log(`✅ Found ${avenueDeals.length} deals from Avenue de la Brique.`);
        allDeals = allDeals.concat(avenueDeals);*/
    
        // Scraping Dealabs with pagination
        console.log('🔥 Scraping deals from Dealabs...');
        let dealabsDeals = [];
        let dealabsPage = 1;
        let hasMoreDealabsPages = true;
    
        while (hasMoreDealabsPages) {
          const url = `https://www.dealabs.com/groupe/lego?hide_expired=true&time_frame=30&page=${dealabsPage}`;
          try {
            const pageDeals = await scrapeDealabs(url);
    
            if (pageDeals.length === 0) {
              hasMoreDealabsPages = false; // Stop pagination
            } else {
              dealabsDeals = dealabsDeals.concat(pageDeals);
              console.log(`📄 Fetched ${pageDeals.length} deals from Dealabs page ${dealabsPage}.`);
              dealabsPage++;
            }
          } catch (error) {
            if (error.message.includes('Gone')) {
              console.warn(`⚠️ Dealabs pagination stopped at page ${dealabsPage} (HTTP 410 Gone).`);
            } else {
              console.error(`❌ Error scraping Dealabs page ${dealabsPage}: ${error.message}`);
            }
            hasMoreDealabsPages = false;
          }
        }
        console.log(`✅ Fetched ${dealabsDeals.length} deals from Dealabs.`);
        allDeals = allDeals.concat(dealabsDeals);
    
        // Scraping Vinted with pagination
        console.log('🛍️ Scraping deals from Vinted...');
        const searchText = 'lego';
        let vintedDeals = [];
        let vintedPage = 1;
        let hasMoreVintedPages = true;
    
        while (hasMoreVintedPages) {
          try {
            const pageDeals = await scrapeVinted(searchText, vintedPage);
            if (pageDeals.length === 0) {
              console.log(`✅ No more deals found on Vinted. Stopping at page ${vintedPage}.`);
              hasMoreVintedPages = false;
            } else {
              vintedDeals = vintedDeals.concat(pageDeals);
              console.log(`📄 Fetched ${pageDeals.length} deals from Vinted page ${vintedPage}.`);
              vintedPage++;
            }
          } catch (error) {
            if (error.message.includes('429')) {
              console.warn(`⚠️ Vinted rate limit hit (HTTP 429 Too Many Requests). Stopping pagination.`);
            } else {
              console.error(`❌ Error scraping Vinted page ${vintedPage}: ${error.message}`);
            }
            hasMoreVintedPages = false;
          }
        }
        console.log(`✅ Fetched ${vintedDeals.length} deals from Vinted.`);
        allDeals = allDeals.concat(vintedDeals);
    
        // Display the total number of deals scraped
        console.log(`🔍 Total deals scraped: ${allDeals.length}`);
    
        // Insert the collected deals into the database
        if (allDeals.length > 0) {
          console.log(`📂 Inserting ${allDeals.length} deals into MongoDB...`);
          const result = await collection.insertMany(allDeals);
          console.log(`✅ ${result.insertedCount} deals have been inserted into the database.`);
    
          const filePath = `./all_deals.json`;
          fs.writeFileSync(filePath, JSON.stringify(allDeals, null, 2), 'utf-8');
          console.log(`📝 Deals have been saved to ${filePath}`);
        } else {
          console.log('🔍 No deals found from any source.');
        }
      } catch (error) {
        console.error(`❌ An unexpected error occurred while scraping: ${error.message}`);
      } finally {
        if (client) {
          console.log('🔌 Closing MongoDB connection...');
          await client.close();
        }
        console.log('👋 Exiting program...');
        process.exit(0); // Force the program to terminate cleanly
      }
    }
    
    // If the user selected queries, execute MongoDB queries
    if (option === 'queries') {
      console.log('🔍 Executing MongoDB queries...');

      console.log('🔍 Finding best discount deals...');
      const bestDiscounts = await findBestDiscountDeals();
      console.log(bestDiscounts);

      console.log('🔍 Finding most commented deals...');
      const mostCommented = await findMostCommentedDeals();
      console.log(mostCommented);

      console.log('🔍 Finding deals sorted by price...');
      const dealsByPrice = await findDealsSortedByPrice();
      console.log(dealsByPrice);

      console.log('🔍 Finding deals sorted by date...');
      const dealsByDate = await findDealsSortedByDate();
      console.log(dealsByDate);

      console.log('🔍 Counting unique models and their occurrences...');
      const idCounts = await countDealsById();
      console.log('📊 Models and their counts:', idCounts);

      console.log('🔍 Finding recent sales (less than 3 weeks old)...');
      const recentSales = await findRecentSales();
      console.log(recentSales);
    }

    console.log('✅ Done');
  } catch (e) {
    console.error(`❌ Error: ${e.message}`);
  } finally {
    if (client) {
      console.log('🔌 Closing MongoDB connection...');
      await client.close();
    }
  }
}

// Execute the sandbox function with the provided option from command-line arguments
const [,, option] = process.argv;
sandbox(option);
