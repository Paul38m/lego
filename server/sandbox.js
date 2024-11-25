import { scrape as scrapeAvenueDeLaBrique } from './websites/avenuedelabrique.js';
import { scrape as scrapeDealabs } from './websites/dealabs.js'; // Importation du scraper Dealabs
import fs from 'fs';

async function sandbox(website) {
  try {
    let deals = [];

    console.log(`🕵️‍♀️  Scraping deals for: ${website}`);

    if (website === 'avenue') {
      const url = 'https://www.avenuedelabrique.com/promotions-et-bons-plans-lego';
      deals = await scrapeAvenueDeLaBrique(url);
    } else if (website === 'dealabs') {
      const url = 'https://www.dealabs.com/groupe/lego';
      deals = await scrapeDealabs(url);
    } else if (website === 'all') {
      console.log('🕵️‍♀️  Scraping both Avenue de la Brique and Dealabs...');
      const [avenueDeals, dealabsDeals] = await Promise.all([
        scrapeAvenueDeLaBrique('https://www.avenuedelabrique.com/promotions-et-bons-plans-lego'),
        scrapeDealabs('https://www.dealabs.com/groupe/lego'),
      ]);
      deals = [...avenueDeals, ...dealabsDeals]; // Combine les résultats
    } else {
      throw new Error('Invalid website argument. Use "avenue", "dealabs", or "all".');
    }

    if (deals.length === 0) {
      console.log('🔍 No deals found.');
    } else {
      console.log('🎉 Found the following deals:');
      deals.forEach(deal => {
        console.log(`- ${deal.title}\n  Validity: ${deal.validity}\n  Description: ${deal.description}\n  Link: ${deal.link}\n`);
      });

      const filePath = `./${website}_deals.json`; // Nom de fichier spécifique pour chaque site
      fs.writeFileSync(filePath, JSON.stringify(deals, null, 2), 'utf-8');
      console.log(`📝 Deals have been saved to ${filePath}`);
    }

    console.log('✅ Done');
    process.exit(0);
  } catch (e) {
    console.error(`❌ Error: ${e.message}`);
    process.exit(1);
  }
}

// Permet de passer l'option (avenue, dealabs, all) en argument
const [,, option] = process.argv;

sandbox(option);
