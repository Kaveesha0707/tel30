const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const connectToDatabase = async () => {
  if (mongoose.connection.readyState) return;
  const MONGO_URI = process.env.MONGO_URI;
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Database connection failed");
  }
};

// Define the keyword schema
const keywordSchema = new mongoose.Schema({
  username: { type: String, required: true },
  channels: [{ type: String, required: true }],
  available: { type: Boolean, default: false },
  unavailable: { type: Boolean, default: false },
  created: { type: Boolean, default: false },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: null },
});

// Create the keyword model
const Keyword = mongoose.model('Keyword', keywordSchema);

module.exports = async (req, res) => {
  try {
    await connectToDatabase(); // Ensure DB connection is established

    // Handle GET request for keywords with pagination
    if (req.method === 'GET') {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 15;

      const totalKeywords = await Keyword.countDocuments();
      const totalPages = Math.ceil(totalKeywords / limit);
      const keywords = await Keyword.find()
        .skip((page - 1) * limit)
        .limit(limit);

      res.json({
        keywords,
        totalPages,
      });

    // Handle POST request to save new keyword data
    } else if (req.method === 'POST') {
      const { username, channels, available, unavailable, created, createdBy, createdAt } = req.body;

      if (!username || !channels) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Create a keyword for each channel
      const createdKeywords = await Promise.all(channels.map(async (channel) => {
        const newKeyword = new Keyword({
          username,
          channels: [channel],
          available,
          unavailable,
          created,
          createdBy,
          createdAt,
        });

        await newKeyword.save();
        return newKeyword;
      }));

      res.status(201).json({ message: 'Keywords saved successfully', createdKeywords });

    // Handle DELETE request to delete a keyword
    } else// Handle DELETE request to delete a keyword
    if (req.method === 'DELETE') {
      const { id } = req.query;
    
      if (!id) {
        return res.status(400).json({ message: 'Keyword ID is required' });
      }
    
      const deletedKeyword = await Keyword.findByIdAndDelete(id);
      if (!deletedKeyword) {
        return res.status(404).json({ message: 'Keyword not found' });
      }
    
      res.status(200).json({ message: 'Keyword deleted successfully' });
          
    } else {
      res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
