const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: String,
    content: String,
    category: String,
    tags: [String],
    author: String,
    datePublished: Date,
    readingTime: Number
});

const Article = mongoose.model('Article', articleSchema);

const connectDB = async () => {
    try {
        // Replace with your MongoDB Atlas connection string
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nlp_search_db';
        await mongoose.connect(uri);
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

module.exports = { connectDB, Article }; 