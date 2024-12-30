import fetch from 'node-fetch';

async function testSearch() {
    const tests = [
        {
            name: "Basic Search",
            query: { query: "javascript" }
        },
        {
            name: "Category Filter",
            query: { query: "database", category: "database" }
        },
        {
            name: "High Relevance Search",
            query: { query: "machine learning", minScore: 0.7 }
        },
        {
            name: "Multi-word Search",
            query: { query: "cloud computing architecture" }
        },
        {
            name: "Tag-based Search",
            query: { query: "tensorflow" }
        }
    ];

    for (const test of tests) {
        console.log(`\nRunning test: ${test.name}`);
        try {
            const response = await fetch('http://localhost:3000/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(test.query)
            });

            const results = await response.json();
            console.log(`Found ${results.length} results`);
            
            // Display top 3 results
            results.slice(0, 3).forEach((result, i) => {
                console.log(`\nResult ${i + 1} (Score: ${Math.round(result.score * 100)}%)`);
                console.log(`Title: ${result.title}`);
                console.log(`Category: ${result.category}`);
                console.log(`Tags: ${result.tags.join(', ')}`);
            });

        } catch (error) {
            console.error(`Error in ${test.name}:`, error);
        }
    }
}

// Add error handling for the main function
testSearch().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
}); 