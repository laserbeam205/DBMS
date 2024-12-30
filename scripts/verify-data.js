const { connectDB, Article } = require('../models/database');

async function verifyDatabase() {
    try {
        await connectDB();
        
        // Count total articles
        const totalCount = await Article.countDocuments();
        console.log(`\nTotal articles in database: ${totalCount}`);

        if (totalCount === 0) {
            console.error('No articles found! Please run generateSampleData.js first');
            return;
        }

        // Get sample articles
        const samples = await Article.find().limit(3);
        console.log('\nSample articles:');
        samples.forEach((article, index) => {
            console.log(`\nArticle ${index + 1}:`);
            console.log('Title:', article.title);
            console.log('Category:', article.category);
            console.log('Tags:', article.tags);
            console.log('Content preview:', article.content.substring(0, 100) + '...');
        });

        // Check categories
        const categories = await Article.distinct('category');
        console.log('\nAvailable categories:', categories);

        // Check tags
        const tags = await Article.distinct('tags');
        console.log('\nSample tags:', tags.slice(0, 10));

        // Test a simple search
        const searchTerm = 'java';
        const results = await Article.find({
            $or: [
                { title: { $regex: searchTerm, $options: 'i' } },
                { content: { $regex: searchTerm, $options: 'i' } },
                { tags: searchTerm }
            ]
        }).limit(2);

        console.log(`\nTest search for '${searchTerm}':`);
        console.log(`Found ${results.length} results`);
        if (results.length > 0) {
            console.log('First result:', {
                title: results[0].title,
                category: results[0].category,
                tags: results[0].tags
            });
        }

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        process.exit();
    }
}

verifyDatabase(); 