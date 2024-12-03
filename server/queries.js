  import { MongoClient } from 'mongodb';

// MongoDB URI et nom de la base de données
const MONGODB_URI = 'mongodb+srv://Paul:Carapuce38@cluster0.udtxd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB_NAME = 'lego';

// Méthode pour se connecter à MongoDB
async function connectToDatabase() {
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(MONGODB_DB_NAME);
  return { client, db };
}

// 1. Trouver toutes les meilleures remises
export async function findBestDiscountDeals() {
  const { client, db } = await connectToDatabase();
  try {
    const collection = db.collection('deals');
    const bestDeals = await collection.find({ discount: { $exists: true } })
      .sort({ discount: -1 })
      .limit(10)
      .toArray();
    return bestDeals;
  } finally {
    await client.close();
  }
}

// 2. Trouver les deals avec plus de 10 commentaires
export async function findMostCommentedDeals() {
  const { client, db } = await connectToDatabase();
  try {
    const collection = db.collection('deals');
    const mostCommented = await collection.find({ commentCount: { $gt: 10 } })
      .sort({ commentCount: -1 })
      .limit(10)
      .toArray();
    return mostCommented;
  } finally {
    await client.close();
  }
}


// 3. Trouver tous les deals triés par prix
export async function findDealsSortedByPrice() {
  const { client, db } = await connectToDatabase();
  try {
    const collection = db.collection('deals');
    const sortedByPrice = await collection.find({})
      .sort({ price: 1 }) // Trier par prix croissant
      .toArray();
    return sortedByPrice;
  } finally {
    await client.close();
  }
}

export async function findDealsSortedByDate() {
  const { client, db } = await connectToDatabase();
  try {
    const collection = db.collection('deals');

    // Récupérer tous les deals
    const deals = await collection.find({}).toArray();

    // Convertir 'publishedAt' en objet Date, trier et ensuite reconvertir en chaîne
    const sortedByDate = deals
      .map(deal => {
        // Convertir 'publishedAt' en objet Date
        deal.publishedAt = new Date(deal.publishedAt); // Conversion en objet Date
        return deal;
      })
      .sort((a, b) => b.publishedAt - a.publishedAt) // Trier par date décroissante
      .map(deal => {
        // Reconversion en chaîne après le tri
        deal.publishedAt = deal.publishedAt.toLocaleString(); // Convertir la date en chaîne
        return deal;
      });

    return sortedByDate;
  } finally {
    await client.close();
  }
}




//Compte les deals par id
export async function countDealsById() {
  const { client, db } = await connectToDatabase();
  try {
    const collection = db.collection('deals');

    // Récupère tous les deals
    const allDeals = await collection.find({}).toArray();

    // Utilise un objet pour compter les occurrences des modèles
    const idCounts = {};

    allDeals.forEach((deal) => {
      const id = deal.id;
      if (id) {
        if (idCounts[id]) {
          idCounts[id] += 1; // Incrémente le compteur si le modèle existe déjà
        } else {
          idCounts[id] = 1; // Initialise le compteur à 1 si le modèle est nouveau
        }
      }
    });

    // Retourne un tableau contenant les modèles et leurs occurrences
    const result = Object.entries(idCounts).map(([id, count]) => ({
      id,
      count,
    }));

    return result; // Retourne les modèles avec les compteurs
  } finally {
    await client.close();
  }
}


// 6. Trouver les deals publiés il y a moins de 3 semaines
export async function findRecentSales() {
  const { client, db } = await connectToDatabase();
  try {
    const collection = db.collection('deals');
    
    // Calculer la date il y a 3 semaines
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21); // Date d'il y a 3 semaines
    
    // Récupérer tous les deals
    const deals = await collection.find({}).toArray();

    // Filtrer les deals qui ont une date de publication dans les 3 dernières semaines
    const recentSales = deals
      .filter(deal => {
        // Assurez-vous que la date 'publishedAt' est un objet Date
        const dealDate = new Date(deal.publishedAt);
        return dealDate >= threeWeeksAgo; // Garder les deals publiés il y a moins de 3 semaines
      })
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)); // Trier par date décroissante

    // Reconvertir les dates en chaînes pour affichage
    const result = recentSales.map(deal => {
      deal.publishedAt = new Date(deal.publishedAt).toLocaleString(); // Convertir en chaîne
      return deal;
    });

    return result;
  } finally {
    await client.close();
  }
}

