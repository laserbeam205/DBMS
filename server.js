const express = require('express');
const natural = require('natural');
const { connectDB, Article } = require('./models/database');
const mongoose = require('mongoose');
const TfIdf = natural.TfIdf;
const stemmer = natural.PorterStemmer;
const tokenizer = new natural.WordTokenizer();
const app = express();

// Connect to MongoDB
connectDB().then(() => {
    console.log('Ready to handle requests');
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
});

app.use(express.static('public'));
app.use(express.json());

// Test database connection and count
app.get('/test-db', async (req, res) => {
    try {
        const count = await Article.countDocuments();
        res.json({ 
            status: 'ok', 
            articleCount: count,
            databaseConnected: mongoose.connection.readyState === 1
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get sample articles
app.get('/test-articles', async (req, res) => {
    try {
        const articles = await Article.find().limit(5);
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test search with direct MongoDB query
app.get('/test-search/:term', async (req, res) => {
    try {
        const searchTerm = req.params.term;
        const results = await Article.find({
            $or: [
                { title: { $regex: searchTerm, $options: 'i' } },
                { content: { $regex: searchTerm, $options: 'i' } },
                { tags: { $regex: searchTerm, $options: 'i' } }
            ]
        }).limit(5);
        
        res.json({
            searchTerm,
            resultsCount: results.length,
            results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/search', async (req, res) => {
    try {
        const { query, category, minScore = 0.3 } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        console.log('\n=== Search Request ===');
        console.log('Query:', query);
        console.log('Category:', category);
        console.log('Min Score:', minScore);

        const searchQuery = query.toLowerCase();
        
        // Simpler MongoDB query without word boundaries
        const mongoQuery = {
            $or: [
                { title: { $regex: searchQuery, $options: 'i' } },
                { content: { $regex: searchQuery, $options: 'i' } },
                { tags: searchQuery }
            ]
        };

        if (category) {
            mongoQuery.category = category;
        }

        console.log('\n=== MongoDB Query ===');
        console.log(JSON.stringify(mongoQuery, null, 2));

        // Get matching articles
        const articles = await Article.find(mongoQuery);
        console.log('\n=== Initial Results ===');
        console.log(`Found ${articles.length} matches`);
        
        if (articles.length > 0) {
            console.log('Sample match:', {
                title: articles[0].title,
                category: articles[0].category,
                tags: articles[0].tags
            });
        }

        if (articles.length === 0) {
            // Try a more lenient search
            const lenientQuery = {
                $or: [
                    { title: { $regex: searchQuery.split(' ')[0], $options: 'i' } },
                    { content: { $regex: searchQuery.split(' ')[0], $options: 'i' } },
                    { tags: { $regex: searchQuery.split(' ')[0], $options: 'i' } }
                ]
            };
            
            console.log('\n=== Trying Lenient Query ===');
            console.log(JSON.stringify(lenientQuery, null, 2));
            
            const lenientResults = await Article.find(lenientQuery);
            if (lenientResults.length > 0) {
                console.log(`Found ${lenientResults.length} results with lenient search`);
                articles.push(...lenientResults);
            }
        }

        if (articles.length === 0) {
            console.log('No results found');
            return res.json([]);
        }

        // Calculate relevance scores
        const tfidf = new TfIdf();
        articles.forEach(article => {
            tfidf.addDocument(`${article.title} ${article.content}`);
        });

        const results = articles.map((article, idx) => {
            // Simplified scoring for debugging
            const score = 0.5; // Set a default score for testing

            return {
                ...article.toObject(),
                score: score,
                highlights: highlightMatches(article, [searchQuery])
            };
        });

        // Filter and sort results
        const filteredResults = results
            .filter(result => result.score > minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, 20);

        console.log('\n=== Final Results ===');
        console.log(`Returning ${filteredResults.length} results`);
        
        res.json(filteredResults);

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'An error occurred during search' });
    }
});

// Helper function to highlight matching terms
function highlightMatches(article, searchTokens) {
    let title = article.title;
    let content = article.content;

    searchTokens.forEach(token => {
        const regex = new RegExp(`(${token})`, 'gi');
        title = title.replace(regex, '<mark>$1</mark>');
        content = content.replace(regex, '<mark>$1</mark>');
    });

    return { title, content };
}

// Update the server start logic
const startServer = async (retries = 5) => {
    const PORT = process.env.PORT || 3000;
    
    try {
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.log(`Port ${PORT} is busy, trying ${PORT + 1}...`);
                if (retries > 0) {
                    process.env.PORT = PORT + 1;
                    startServer(retries - 1);
                } else {
                    console.error('No available ports found');
                    process.exit(1);
                }
            } else {
                console.error('Server error:', error);
                process.exit(1);
            }
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

// Handle process termination
process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Performing cleanup...');
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Received SIGINT. Performing cleanup...');
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
    });
}); 