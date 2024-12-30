const axios = require('axios');

// Function to get the server URL
const getServerUrl = () => {
    const port = process.env.PORT || 3000;
    return `http://localhost:${port}`;
};

async function testDatabase() {
    try {
        const baseUrl = getServerUrl();
        
        // Test database connection
        console.log('\nTesting database connection...');
        const dbResponse = await axios.get(`${baseUrl}/test-db`);
        console.log('Database status:', dbResponse.data);

        if (dbResponse.data.articleCount === 0) {
            console.error('No articles found in database! Run generateSampleData.js first.');
            return;
        }

        // Test sample articles
        console.log('\nFetching sample articles...');
        const articlesResponse = await axios.get(`${baseUrl}/test-articles`);
        console.log('Sample article:', articlesResponse.data[0]);

        // Test direct search
        const searchTerms = ['javascript', 'python', 'database', 'api'];
        for (const term of searchTerms) {
            console.log(`\nTesting direct search for "${term}"...`);
            const searchResponse = await axios.get(`${baseUrl}/test-search/${term}`);
            console.log(`Found ${searchResponse.data.resultsCount} results`);
            if (searchResponse.data.results.length > 0) {
                console.log('First result:', {
                    title: searchResponse.data.results[0].title,
                    category: searchResponse.data.results[0].category,
                    tags: searchResponse.data.results[0].tags
                });
            }
        }

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

testDatabase(); 