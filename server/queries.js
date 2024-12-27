import { MongoClient } from 'mongodb';

// MongoDB URI and database name
const MONGODB_URI = 'mongodb+srv://Paul:Carapuce38@cluster0.udtxd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB_NAME = 'lego';

// Method to connect to MongoDB
async function connectToDatabase() {
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(MONGODB_DB_NAME);
  return { client, db };
}

// 1. Find all the best discount deals
export async function findBestDiscountDeals() {
  const { client, db } = await connectToDatabase();
  try {
    const collection = db.collection('deals');
    // Find deals with a discount, sorted in descending order, limiting to 10 results
    const bestDeals = await collection.find({ discount: { $exists: true } })
      .sort({ discount: -1 })
      .limit(10)
      .toArray();
    return bestDeals;
  } finally {
    await client.close();
  }
}

// 2. Find deals with more than 10 comments
export async function findMostCommentedDeals() {
  const { client, db } = await connectToDatabase();
  try {
    const collection = db.collection('deals');
    // Find deals with more than 10 comments, sorted by comment count in descending order, limiting to 10 results
    const mostCommented = await collection.find({ commentCount: { $gt: 10 } })
      .sort({ commentCount: -1 })
      .limit(10)
      .toArray();
    return mostCommented;
  } finally {
    await client.close();
  }
}

// 3. Find all deals sorted by price
export async function findDealsSortedByPrice() {
  const { client, db } = await connectToDatabase();
  try {
    const collection = db.collection('deals');
    // Retrieve all deals and sort them by price in ascending order
    const sortedByPrice = await collection.find({})
      .sort({ price: 1 }) // Sort by price in ascending order
      .toArray();
    return sortedByPrice;
  } finally {
    await client.close();
  }
}

// 4. Find deals sorted by the date they were published
export async function findDealsSortedByDate() {
  const { client, db } = await connectToDatabase();
  try {
    const collection = db.collection('deals');

    // Retrieve all deals
    const deals = await collection.find({}).toArray();

    // Convert 'publishedAt' to a Date object, sort, and then convert back to string
    const sortedByDate = deals
      .map(deal => {
        // Convert 'publishedAt' to a Date object
        deal.publishedAt = new Date(deal.publishedAt); // Convert to Date object
        return deal;
      })
      .sort((a, b) => b.publishedAt - a.publishedAt) // Sort by descending date
      .map(deal => {
        // Convert back to string after sorting
        deal.publishedAt = deal.publishedAt.toLocaleString(); // Convert date back to string
        return deal;
      });

    return sortedByDate;
  } finally {
    await client.close();
  }
}

// 5. Count the number of deals by ID
export async function countDealsById() {
  const { client, db } = await connectToDatabase();
  try {
    const collection = db.collection('deals');

    // Retrieve all deals
    const allDeals = await collection.find({}).toArray();

    // Use an object to count occurrences of each deal ID
    const idCounts = {};

    allDeals.forEach((deal) => {
      const id = deal.id;
      if (id) {
        if (idCounts[id]) {
          idCounts[id] += 1; // Increment the counter if the ID already exists
        } else {
          idCounts[id] = 1; // Initialize the counter to 1 if the ID is new
        }
      }
    });

    // Return an array of IDs and their respective counts
    const result = Object.entries(idCounts).map(([id, count]) => ({
      id,
      count,
    }));

    return result; // Return the IDs with their counts
  } finally {
    await client.close();
  }
}

// 6. Find deals published in the last 3 weeks
export async function findRecentSales() {
  const { client, db } = await connectToDatabase();
  try {
    const collection = db.collection('deals');
    
    // Calculate the date 3 weeks ago
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21); // Date 3 weeks ago
    
    // Retrieve all deals
    const deals = await collection.find({}).toArray();

    // Filter the deals that were published in the last 3 weeks
    const recentSales = deals
      .filter(deal => {
        // Ensure 'publishedAt' is a Date object
        const dealDate = new Date(deal.publishedAt);
        return dealDate >= threeWeeksAgo; // Keep deals published in the last 3 weeks
      })
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)); // Sort by descending date

    // Convert dates back to strings for display
    const result = recentSales.map(deal => {
      deal.publishedAt = new Date(deal.publishedAt).toLocaleString(); // Convert to string
      return deal;
    });

    return result;
  } finally {
    await client.close();
  }
}
