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

const MONGODB_URI = 'mongodb+srv://Paul:Carapuce38@cluster0.udtxd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB_NAME = 'lego';

async function sandbox(option) {
  let client;

  try {
    console.log('📦 Connecting to MongoDB...');
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');

    if (['avenue', 'dealabs', 'vinted', 'all'].includes(option)) {
      console.log('🧹 Clearing previous deals from MongoDB...');
      await collection.deleteMany({});
    }

    let deals = [];

    if (option === 'avenue') {
      console.log('🕵️‍♀️ Scraping deals from Avenue de la Brique...');
      deals = await scrapeAvenueDeLaBrique('https://www.avenuedelabrique.com/promotions-et-bons-plans-lego');
    } else if (option === 'dealabs') {
      console.log('🕵️‍♀️ Scraping deals from Dealabs...');
      
      let deals = [];
      let page = 1;
      let hasMorePages = true;
    
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
    } else if (option === 'vinted') {
      console.log('🕵️‍♀️ Scraping deals from Vinted...');
      deals = await scrapeVinted('42173'); // Exemple : recherche d'un set LEGO spécifique
    } else if (option === 'all') {
      console.log('🕵️‍♀️ Scraping deals from all sources...');
      const [avenueDeals, dealabsDeals, vintedDeals] = await Promise.all([
        scrapeAvenueDeLaBrique('https://www.avenuedelabrique.com/promotions-et-bons-plans-lego'),
        scrapeDealabs('https://www.dealabs.com/groupe/lego'),
        scrapeVinted('42173')
      ]);
      deals = [...avenueDeals, ...dealabsDeals, ...vintedDeals];
    }

    if (deals.length > 0) {
      console.log(`📂 Inserting ${deals.length} deals into MongoDB...`);
      const result = await collection.insertMany(deals);
      console.log(`✅ ${result.insertedCount} deals have been inserted into the database.`);

      const filePath = `./${option}_deals.json`;
      fs.writeFileSync(filePath, JSON.stringify(deals, null, 2), 'utf-8');
      console.log(`📝 Deals have been saved to ${filePath}`);
    } else {
      console.log('🔍 No deals found.');
    }

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

const [,, option] = process.argv;
sandbox(option);
