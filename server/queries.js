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

// 2. Trouver les deals les plus commentés
export async function findMostCommentedDeals() {
  const { client, db } = await connectToDatabase();
  try {
    const collection = db.collection('deals');
    const mostCommented = await collection.find({ comments: { $exists: true } })
      .sort({ comments: -1 })
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
      .sort({ releaseDate: -1 }) // Trier par date décroissante
      .toArray();
    return sortedByDate;
  } finally {
    await client.close();
  }
}

// 5. Trouver toutes les ventes pour un set LEGO donné
export async function findSalesForLegoSetId(legoSetId) {
  const { client, db } = await connectToDatabase();
  try {
    const collection = db.collection('sales');
    const sales = await collection.find({ legoSetId }).toArray();
    return sales;
  } finally {
    await client.close();
  }
}

// 6. Trouver toutes les ventes collectées il y a moins de 3 semaines
export async function findRecentSales() {
  const { client, db } = await connectToDatabase();
  try {
    const collection = db.collection('sales');
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21); // Date d'il y a 3 semaines
    const recentSales = await collection.find({ dateScraped: { $gte: threeWeeksAgo } }).toArray();
    return recentSales;
  } finally {
    await client.close();
  }
}
