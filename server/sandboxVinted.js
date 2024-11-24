import { scrape } from './vinted.js';
import fs from 'fs';

async function sandbox(website = 'https://www.vinted.fr/catalog?search_text=42151') {
  try {
    console.log(`🕵️‍♀️  Browsing ${website} website`);

    // Récupérer les annonces via la fonction de scraping
    const deals = await scrape(website);

    // Si aucune annonce trouvée
    if (deals.length === 0) {
      console.log('🔍 No deals found.');
    } else {
      console.log('🎉 Found the following deals:');
      deals.forEach(deal => {
        console.log(`- ${deal.title}\n  Price: ${deal.price}\n  Link: ${deal.link}\n  Image: ${deal.imageUrl || 'No image'}\n`);
      });

      // Sauvegarder les données dans un fichier JSON
      const filePath = './vinted-deals.json';
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

// Permet de passer l'URL du site en argument de ligne de commande
const [,, eshop] = process.argv;
sandbox(eshop);
