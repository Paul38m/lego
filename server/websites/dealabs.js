import { load } from 'cheerio';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid'; // Ajout de l'importation de uuid

// Fonction pour récupérer le HTML d'une URL
async function fetchHTML(url) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération de la page: ${response.statusText}`);
  }
  return await response.text();
}

// Fonction principale pour scraper la liste des deals
export async function scrape(url) {
  try {
    const html = await fetchHTML(url);
    const $ = load(html);

    const deals = [];

    // Parcours des articles de la liste
    $('.js-threadList article.thread').each((_, element) => {
      const vueData = $(element).find('.js-vue2').attr('data-vue2');

      if (vueData) {
        try {
          // Analyse le JSON contenu dans data-vue2
          const data = JSON.parse(vueData);

          if (data?.props?.thread) {
            const thread = data.props.thread;

            // Extraction des données importantes
            const community = 'dealabs';
            const title = thread.title || '';
            const price = thread.price || 0;
            const nextBestPrice = thread.nextBestPrice || 0;
            const commentCount = thread.commentCount || 0;
            const temperature = thread.temperature || 0;
            const publishedAt = thread.publishedAt || '';
            const shareableLink = thread.shareableLink || '';

            // Calcul de la réduction
            const discount =
              nextBestPrice > 0
                ? parseFloat((100 - (price / nextBestPrice) * 100).toFixed(2))
                : null;

            // Extraction de l'ID
            const parenthesisMatch = title.match(/\((\d{5,})\)/);
            let id = parenthesisMatch ? parenthesisMatch[1] : null;
            if (!id) {
              const words = title.split(' ');
              id = words.find((word) => /^\d{5,}$/.test(word)) || null;
            }

            // Extraction de l'image
            const dataVue2 = $(element).find('div.threadGrid div div').attr('data-vue2');
            let photo = '';
            if (dataVue2) {
              try {
                const dataVue2Json = JSON.parse(dataVue2);
                photo = dataVue2Json.props.threadImageUrl || '';
              } catch (err) {
                console.error('Erreur lors de l’analyse du data-vue2 pour l’image:', err.message);
              }
            }

            // Génération d'un UUID
            const uuid = uuidv4();

            // Ajout du deal à la liste
            deals.push({
              community,
              title,
              id,
              price,
              nextBestPrice,
              discount,
              commentCount,
              temperature,
              publishedAt: new Date(publishedAt * 1000).toLocaleString(), // Converti en date lisible
              shareableLink,
              photo,
              uuid,
            });
          }
        } catch (err) {
          console.error('Erreur lors de l’analyse de data-vue2:', err.message);
        }
      }
    });

    return deals;
  } catch (error) {
    console.error(`Erreur lors du scraping: ${error.message}`);
    throw error;
  }
}
