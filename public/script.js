let searchTimeout;
let currentSearchResults = [];

async function handleSearchInput() {
    const searchInput = document.getElementById('searchInput');
    const dropdown = document.getElementById('searchDropdown');
    const query = searchInput.value.trim();

    // Clear previous timeout
    clearTimeout(searchTimeout);

    // Hide dropdown if input is empty
    if (!query) {
        dropdown.classList.remove('active');
        return;
    }

    // Set new timeout for search
    searchTimeout = setTimeout(() => performSearch(true), 300);
}

async function performSearch(isDropdown = false) {
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categoryFilter');
    const relevanceSlider = document.getElementById('relevanceSlider');
    const dropdown = document.getElementById('searchDropdown');
    const detailedResults = document.getElementById('detailedResults');

    const query = searchInput.value.trim();
    
    if (!query) {
        dropdown.classList.remove('active');
        detailedResults.innerHTML = '';
        return;
    }

    try {
        const response = await fetch('/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                category: categorySelect.value || null,
                minScore: parseFloat(relevanceSlider.value)
            })
        });

        const results = await response.json();
        currentSearchResults = results;

        if (isDropdown) {
            // Update dropdown results
            updateDropdown(results);
        } else {
            // Update detailed results
            updateDetailedResults(results);
        }

    } catch (error) {
        console.error('Search error:', error);
        showError('An error occurred while searching');
    }
}

function updateDropdown(results) {
    const dropdown = document.getElementById('searchDropdown');
    
    if (results.length === 0) {
        dropdown.innerHTML = '<div class="result-item">No results found</div>';
    } else {
        dropdown.innerHTML = results
            .slice(0, 5) // Show only top 5 results in dropdown
            .map((result, index) => `
                <div class="result-item" onclick="showDetailedResult(${index})">
                    <div class="result-header">
                        <div class="result-title">${result.highlights.title}</div>
                        <span class="score">${Math.round(result.score * 100)}%</span>
                    </div>
                    <div class="meta">
                        <span class="category">${result.category}</span>
                        ${result.tags.slice(0, 2).map(tag => `
                            <span class="tag">${tag}</span>
                        `).join('')}
                    </div>
                </div>
            `).join('');
    }
    
    dropdown.classList.add('active');
}

function updateDetailedResults(results) {
    const detailedResults = document.getElementById('detailedResults');
    
    if (results.length === 0) {
        detailedResults.innerHTML = '<div class="no-results">No results found</div>';
        return;
    }

    detailedResults.innerHTML = results
        .map(result => `
            <div class="result-item">
                <div class="result-header">
                    <div class="result-title">${result.highlights.title}</div>
                    <span class="score">${Math.round(result.score * 100)}%</span>
                </div>
                <p>${result.highlights.content}</p>
                <div class="meta">
                    <span class="category">${result.category}</span>
                    ${result.tags.map(tag => `
                        <span class="tag">${tag}</span>
                    `).join('')}
                </div>
            </div>
        `).join('');
}

function showDetailedResult(index) {
    const result = currentSearchResults[index];
    const detailedResults = document.getElementById('detailedResults');
    const dropdown = document.getElementById('searchDropdown');

    detailedResults.innerHTML = `
        <div class="result-item">
            <div class="result-header">
                <div class="result-title">${result.highlights.title}</div>
                <span class="score">${Math.round(result.score * 100)}%</span>
            </div>
            <p>${result.highlights.content}</p>
            <div class="meta">
                <span class="category">${result.category}</span>
                ${result.tags.map(tag => `
                    <span class="tag">${tag}</span>
                `).join('')}
            </div>
        </div>
    `;

    dropdown.classList.remove('active');
}

function showError(message) {
    const dropdown = document.getElementById('searchDropdown');
    dropdown.innerHTML = `<div class="result-item error">${message}</div>`;
    dropdown.classList.add('active');
}

// Update relevance value display
document.getElementById('relevanceSlider').addEventListener('input', function() {
    document.getElementById('relevanceValue').textContent = 
        Math.round(this.value * 100) + '%';
});

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('searchDropdown');
    const searchContainer = document.querySelector('.search-container');
    
    if (!searchContainer.contains(event.target)) {
        dropdown.classList.remove('active');
    }
}); 