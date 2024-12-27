require('dotenv').config();

const cors = require('cors');  // Middleware to enable CORS (Cross-Origin Resource Sharing)
const express = require('express');  // Web framework for building the server
const helmet = require('helmet');  // Middleware to secure Express apps by setting HTTP headers
const { MongoClient } = require('mongodb');  // MongoDB client to interact with MongoDB database

const PORT = 8092;  // Port on which the server will run
const MONGO_URL = 'mongodb+srv://Paul:Carapuce38@cluster0.udtxd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';  // MongoDB connection string
const DB_NAME = 'lego';  // Name of the database
const COLLECTION_NAME = 'deals';  // Name of the collection in MongoDB that stores the deals

const app = express();  // Create an Express app

module.exports = app;  // Export the app for testing or further usage

// Middleware setup
app.use(require('body-parser').json());  // Middleware to parse incoming JSON request bodies
app.use(cors());  // Enable CORS for all routes
app.use(helmet());  // Use Helmet to secure HTTP headers
app.options('*', cors());  // Handle pre-flight OPTIONS requests for all routes

let db;  // Variable to store the database connection

// Connect to MongoDB
MongoClient.connect(MONGO_URL, { useUnifiedTopology: true })
  .then(client => {
    db = client.db(DB_NAME);  // Set the database instance
    console.log('🌟 Connected to MongoDB');  // Log when connection is successful
  })
  .catch(error => {
    console.error('🚨 Failed to connect to MongoDB:', error);  // Log error if connection fails
  });

// Routes
app.get('/', (request, response) => {
  response.send({ ack: true });  // Basic route to check server status
});

// Search for deals with optional query parameters
app.get('/deals/search', async (request, response) => {
  const { limit = 12, price, date, filterBy, sortBy } = request.query;  // Extract query parameters

  let query = {};  // Initialize query object

  // Price filter: Find deals with a price less than or equal to the specified price
  if (price) {
    query.price = { $lte: parseFloat(price) };
  }

  // Date filter: Find deals published on or after the specified date
  if (date) {
    const dateFilter = new Date(date);
    query.publishedAt = { $gte: dateFilter };
  }

  // Set default sort order (by price in ascending order)
  let sortOrder = { price: 1 };

  // Sorting and filtering logic based on query parameters
  if (filterBy === 'best-discount') {
    sortOrder = { discount: -1 };  // Sort by discount in descending order
  } else if (filterBy === 'most-commented') {
    sortOrder = { commentCount: -1 };  // Sort by comment count in descending order
  }

  if (sortBy === 'date') {
    sortOrder = { publishedAt: 1 };  // Sort by date in ascending order
  } else if (sortBy === 'price') {
    sortOrder = { price: 1 };  // Sort by price in ascending order
  } else if (sortBy === 'price-desc') {
    sortOrder = { price: -1 };  // Sort by price in descending order
  } else if (sortBy === 'date-desc') {
    sortOrder = { publishedAt: -1 };  // Sort by date in descending order
  }

  try {
    // Fetch deals from the database with filtering, sorting, and limiting options
    const deals = await db.collection(COLLECTION_NAME)
      .aggregate([
        {
          $addFields: {
            publishedAt: {
              $dateFromString: {
                dateString: '$publishedAt',
                format: '%d/%m/%Y %H:%M:%S',  // Parse the 'publishedAt' string into a Date object
                onError: new Date('1970-01-01'),  // Default date if parsing fails
                onNull: new Date('1970-01-01')  // Default date if value is null
              }
            }
          }
        },
        { $match: query },  // Apply filters based on the query
        { $sort: sortOrder },  // Apply sorting based on the defined order
        { $limit: parseInt(limit) }  // Limit the number of results based on the 'limit' query parameter
      ])
      .toArray();  // Convert the cursor to an array

    // Fetch the total count of documents matching the query (for pagination)
    const total = await db.collection(COLLECTION_NAME).countDocuments(query);

    // Format the result data to be returned in the response
    const results = deals.map(deal => ({
      link: deal.link,
      retail: deal.retail,
      price: deal.price,
      discount: deal.discount,
      temperature: deal.temperature,
      photo: deal.photo,
      comments: deal.commentCount,
      published: deal.publishedAt.toISOString().split('T')[0],  // Format the 'publishedAt' date as YYYY-MM-DD
      title: deal.title,
      id: deal.id,
      community: deal.community,
      uuid: deal.uuid,
    }));

    // Send the search results in the response
    response.send({
      limit: parseInt(limit),
      total: total,
      results: results,
    });
  } catch (error) {
    console.error('🚨 Error fetching deals:', error);  // Log error if something goes wrong
    response.status(500).send({ error: 'Internal Server Error' });  // Send error response
  }
});

// Fetch a specific deal by its UUID
app.get('/deals/:id', async (request, response) => {
  const dealId = request.params.id;  // Extract deal ID from the URL

  try {
    // Fetch the deal from the database using the UUID
    const deal = await db.collection(COLLECTION_NAME).findOne({ uuid: dealId });

    if (!deal) {
      return response.status(404).send({ error: 'Deal not found' });  // Return 404 if the deal is not found
    }

    response.send(deal);  // Send the deal in the response
  } catch (error) {
    console.error('🚨 Error fetching deal:', error);  // Log error if something goes wrong
    response.status(500).send({ error: 'Internal Server Error' });  // Send error response
  }
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`📡 Running on port ${PORT}`);  // Log when the server is up and running
});
