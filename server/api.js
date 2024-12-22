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
  const { limit = 12, price, date, filterBy, sortBy } = request.query;

  // Build query object
  let query = {};

  // Price filter
  if (price) {
    query.price = { $lte: parseFloat(price) };  // Deals with price <= specified value
  }

  // Date filter (publishedAt assumed to be a date/timestamp)
  if (date) {
    const dateFilter = new Date(date);
    query.publishedAt = { $gte: dateFilter };  // Deals published after specified date
  }

  // Filter by (best-discount or most-commented)
  if (filterBy === 'best-discount') {
    // No extra query filtering, will sort later by discount
    sortOrder = { discount: -1 };  // Sort by discount in descending order
  } else if (filterBy === 'most-commented') {
    // No extra query filtering, will sort later by comments
    sortOrder = { commentCount: -1 };  // Sort by comment count in descending order
  }

  try {
    // Determine sorting order
    if (!sortOrder) {
      sortOrder = { price: 1 };  // Default: Sort by price (ascending)
    }

    if (sortBy === 'date') {
      sortOrder = { publishedAt: 1 };  // Sort by date (oldest first)
    } else if (sortBy === 'price') {
      sortOrder = { price: 1 };  // Sort by price ascending
    } else if (sortBy === 'price-desc') {
      sortOrder = { price: -1 };  // Sort by price descending
    } else if (sortBy === 'date-desc') {
      sortOrder = { publishedAt: -1 };  // Sort by date descending (newest first)
    }

    // Fetch deals from MongoDB with applied filters and sorting
    const deals = await db
      .collection(COLLECTION_NAME)
      .find(query)
      .sort(sortOrder)
      .limit(parseInt(limit))
      .toArray();

    // Total count of matching documents
    const total = await db.collection(COLLECTION_NAME).countDocuments(query);

    // Format results
    const results = deals.map(deal => ({
      link: deal.shareableLink,
      retail: deal.retail,
      price: deal.price,
      discount: deal.discount,
      temperature: deal.temperature,
      photo: deal.photo,
      comments: deal.commentCount,
      published: deal.publishedAt.split(' ')[0],
      title: deal.title,
      id: deal.id,
      community: deal.community,
      uuid: deal.uuid,
    }));

    // Send response
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
