import { scrape } from './dealabs.js';
import fs from 'fs';  // Importer le module fs pour écrire dans un fichier

async function sandbox(website = 'https://www.dealabs.com/groupe/lego') {
  try {
    console.log(`🕵️‍♀️  Browsing ${website} website`);

    // Récupère les offres de la fonction scrape
    const deals = await scrape(website);

    // Si aucune offre n'est trouvée
    if (deals.length === 0) {
      console.log('🔍 No deals found.');
    } else {
      console.log('🎉 Found the following deals:');
      // Affiche chaque deal trouvé
      deals.forEach(deal => {
        console.log(`- ${deal.title}\n  Validity: ${deal.validity}\n  Description: ${deal.description}\n  Link: ${deal.link}\n`);
      });

      // Sauvegarder les deals dans un fichier JSON
      const filePath = './dealabs_deals.json';  // Nom du fichier où les données seront stockées
      fs.writeFileSync(filePath, JSON.stringify(deals, null, 2), 'utf-8');  // Écrire les données dans le fichier JSON

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
