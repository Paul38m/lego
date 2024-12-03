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
  findRecentSales,
} from './queries.js';
import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://Paul:Carapuce38@cluster0.udtxd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB_NAME = 'lego';

async function sandbox(option) {
  let client;
  try {
    // Étape 1 : Connexion à MongoDB
    console.log('📦 Connecting to MongoDB...');
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection('deals');

    // Si l'option est 'avenue', 'dealabs', ou 'all', vider la collection avant de scraper
    if (option === 'avenue' || option === 'dealabs' || option === 'all') {
      console.log('🧹 Clearing previous deals from MongoDB...');
      await collection.deleteMany({});  // Supprime tous les documents de la collection
      console.log('✅ Previous deals cleared.');
    }

    let deals = [];

    // Scraping des deals
    if (option === 'avenue') {
      console.log('🕵️‍♀️ Scraping deals from Avenue de la Brique...');
      deals = await scrapeAvenueDeLaBrique('https://www.avenuedelabrique.com/promotions-et-bons-plans-lego');
    } else if (option === 'dealabs') {
      console.log('🕵️‍♀️ Scraping deals from Dealabs...');
      deals = await scrapeDealabs('https://www.dealabs.com/groupe/lego');
    } else if (option === 'vinted') {
      console.log('🕵️‍♀️ Scraping deals from Vinted...');
      deals = await scrapeVinted('42173'); // Rechercher des deals LEGO 42173
    } else if (option === 'all') {
      console.log('🕵️‍♀️ Scraping deals from both Avenue de la Brique and Dealabs...');
      const [avenueDeals, dealabsDeals] = await Promise.all([
        scrapeAvenueDeLaBrique('https://www.avenuedelabrique.com/promotions-et-bons-plans-lego'),
        scrapeDealabs('https://www.dealabs.com/groupe/lego'),
      ]);
      deals = [...avenueDeals, ...dealabsDeals];
    }

    // Insertion des données dans MongoDB
    if (deals.length > 0) {
      console.log('📂 Inserting scraped deals into MongoDB...');
      const result = await collection.insertMany(deals);
      console.log(`✅ ${result.insertedCount} deals have been inserted into the database.`);

      // Sauvegarde des deals en local
      const filePath = `./${option}_deals.json`;
      fs.writeFileSync(filePath, JSON.stringify(deals, null, 2), 'utf-8');
      console.log(`📝 Deals have been saved to ${filePath}`);
    } else {
      console.log('🔍 No deals found during scraping.');
    }

    // Exécution des requêtes MongoDB si l'option est 'queries'
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
    // Étape 3 : Fermer la connexion à MongoDB
    if (client) {
      console.log('🔌 Closing MongoDB connection...');
      await client.close();
    }
  }
}

// Permet de passer une option (avenue, dealabs, all, queries) en argument
const [,, option] = process.argv;

sandbox(option);
