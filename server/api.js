const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const { MongoClient } = require('mongodb');

const PORT = 8092;
const MONGO_URL = 'mongodb+srv://Paul:Carapuce38@cluster0.udtxd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'lego';
const COLLECTION_NAME = 'deals';

const app = express();

module.exports = app;

// Middleware
app.use(require('body-parser').json());
app.use(cors());
app.use(helmet());
app.options('*', cors());

let db;

// Connexion à MongoDB
MongoClient.connect(MONGO_URL, { useUnifiedTopology: true })
  .then(client => {
    db = client.db(DB_NAME);
    console.log('🌟 Connected to MongoDB');
  })
  .catch(error => {
    console.error('🚨 Failed to connect to MongoDB:', error);
  });

// Routes
app.get('/', (request, response) => {
  response.send({ ack: true });
});

app.get('/deals/search', async (request, response) => {
  const { limit = 12, price, date, filterBy } = request.query;

  // Build query object
  let query = {};

  // Price filter
  if (price) {
    query.price = { $lte: parseFloat(price) };  // Deals with price less than or equal to the provided value
  }

  // Date filter (assuming 'publishedAt' is stored as a date or a timestamp)
  if (date) {
    const dateFilter = new Date(date);
    query.publishedAt = { $gte: dateFilter };  // Deals published on or after the specified date
  }

  // Filter by specific values (best-discount or most-commented)
  if (filterBy === 'best-discount') {
    // No extra filtering needed for the query, but you'll sort by the highest discount later
  } else if (filterBy === 'most-commented') {
    // Sort by comment count later
  }

  try {
    // Fetch deals from MongoDB with the applied filters
    const deals = await db
      .collection(COLLECTION_NAME)
      .find(query)
      .sort({ price: 1 })  // Sort by price in ascending order
      .limit(parseInt(limit))  // Limit the number of results to the specified 'limit'
      .toArray();

    // Prepare the response data
    const total = await db.collection(COLLECTION_NAME).countDocuments(query);

    const results = deals.map(deal => ({
      link: deal.shareableLink,
      retail: deal.retail,
      price: deal.price,
      discount: deal.discount,
      temperature: deal.temperature,
      photo: deal.photo,
      comments: deal.commentCount,
      published: new Date(deal.publishedAt).getTime() / 1000,  // Convert to UNIX timestamp
      title: deal.title,
      id: deal.id,
      community: deal.community,
      uuid: deal.uuid,
    }));

    // Send the response
    response.send({
      limit: parseInt(limit),
      total: total,
      results: results,
    });
  } catch (error) {
    console.error('🚨 Error fetching deals:', error);
    response.status(500).send({ error: 'Internal Server Error' });
  }
});




app.get('/deals/:id', async (request, response) => {
  const dealId = request.params.id;

  try {
    const deal = await db.collection(COLLECTION_NAME).findOne({ uuid: dealId });

    if (!deal) {
      return response.status(404).send({ error: 'Deal not found' });
    }

    response.send(deal);
  } catch (error) {
    console.error('🚨 Error fetching deal:', error);
    response.status(500).send({ error: 'Internal Server Error' });
  }
});



// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`📡 Running on port ${PORT}`);
});
