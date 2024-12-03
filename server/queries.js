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

// 4. Trouver tous les deals triés par date
export async function findDealsSortedByDate() {
  const { client, db } = await connectToDatabase();
  try {
    const collection = db.collection('deals');
    const sortedByDate = await collection.find({})
      .sort({ publishedAt: -1 }) // Trier par date décroissante
      .toArray();
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
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21); // Date d'il y a 3 semaines

    // Requête pour récupérer les deals publiés dans les 3 dernières semaines
    const recentSales = await collection.find({
      publishedAt: {
        $gte: threeWeeksAgo.toISOString()  // Convertir en ISO string
      }
    }).toArray();

    return recentSales;
  } finally {
    await client.close();
  }
}
