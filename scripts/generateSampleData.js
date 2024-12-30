const { connectDB, Article } = require('../models/database');
const { faker } = require('@faker-js/faker');

// Categories and their associated tags
const categoryData = {
    'programming': [
        'javascript', 'python', 'java', 'cpp', 'ruby', 'php', 'golang',
        'frontend', 'backend', 'fullstack', 'web-development', 'mobile-development',
        'algorithms', 'data-structures', 'debugging', 'testing'
    ],
    'ai': [
        'machine-learning', 'deep-learning', 'neural-networks', 'nlp', 
        'computer-vision', 'robotics', 'reinforcement-learning', 'data-science',
        'tensorflow', 'pytorch', 'keras', 'scikit-learn'
    ],
    'cybersecurity': [
        'security', 'encryption', 'network-security', 'ethical-hacking',
        'penetration-testing', 'malware', 'cryptography', 'blockchain',
        'authentication', 'authorization'
    ],
    'cloud-computing': [
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'serverless',
        'microservices', 'devops', 'ci-cd', 'cloud-native'
    ],
    'database': [
        'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
        'nosql', 'data-modeling', 'indexing', 'query-optimization'
    ]
};

// Programming concepts for more realistic content generation
const programmingConcepts = [
    'variables', 'functions', 'classes', 'objects', 'inheritance',
    'polymorphism', 'encapsulation', 'algorithms', 'data structures',
    'APIs', 'REST', 'GraphQL', 'authentication', 'authorization',
    'deployment', 'testing', 'debugging', 'version control', 'git'
];

function generateArticleContent() {
    const paragraphs = faker.number.int({ min: 3, max: 6 });
    let content = '';
    
    for (let i = 0; i < paragraphs; i++) {
        const sentences = faker.number.int({ min: 3, max: 8 });
        const paragraph = [];
        
        for (let j = 0; j < sentences; j++) {
            // Mix technical terms with regular sentences
            if (faker.datatype.boolean()) {
                const concept = faker.helpers.arrayElement(programmingConcepts);
                paragraph.push(faker.lorem.sentence().replace(/\w+/, concept));
            } else {
                paragraph.push(faker.lorem.sentence());
            }
        }
        
        content += paragraph.join(' ') + '\n\n';
    }
    
    return content.trim();
}

async function generateSampleData() {
    try {
        await connectDB();
        await Article.deleteMany({}); // Clear existing articles

        const articles = [];
        const categories = Object.keys(categoryData);

        for (let i = 0; i < 1000; i++) {
            const category = faker.helpers.arrayElement(categories);
            const numTags = faker.number.int({ min: 2, max: 5 });
            const tags = faker.helpers.arrayElements(categoryData[category], numTags);

            const article = {
                title: faker.company.catchPhrase(),
                content: generateArticleContent(),
                category: category,
                tags: tags,
                author: faker.person.fullName(),
                datePublished: faker.date.past({ years: 2 }),
                readingTime: faker.number.int({ min: 3, max: 20 })
            };

            articles.push(article);

            // Log progress
            if ((i + 1) % 100 === 0) {
                console.log(`Generated ${i + 1} articles...`);
            }
        }

        await Article.insertMany(articles);
        console.log('Successfully generated 1000 sample articles!');
        
        // Log a few sample articles for verification
        const sampleArticles = await Article.find().limit(3);
        console.log('\nSample articles:');
        console.log(JSON.stringify(sampleArticles, null, 2));

    } catch (error) {
        console.error('Error generating sample data:', error);
    } finally {
        process.exit();
    }
}

generateSampleData(); 