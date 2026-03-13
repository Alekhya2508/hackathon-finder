/* ========================================
   HACKATHON FINDER - MAIN JAVASCRIPT
   All the logic for our application
======================================== */

// ========== GLOBAL VARIABLES ==========
// Get favorites from browser storage (or empty array if none)
let favorites = JSON.parse(localStorage.getItem('hackathonFavorites')) || [];

// Current filter setting
let currentFilter = 'all';

// ========== DOM ELEMENTS ==========
// Get references to HTML elements we'll use
const cardsContainer = document.getElementById('cardsContainer');
const searchInput = document.getElementById('searchInput');
const noResults = document.getElementById('noResults');
const filterButtons = document.querySelectorAll('.filter-btn');

// Stats elements
const totalHackathonsEl = document.getElementById('totalHackathons');
const upcomingCountEl = document.getElementById('upcomingCount');
const favoritesCountEl = document.getElementById('favoritesCount');


// ========== INITIALIZE APP ==========
// This runs when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Display all hackathons initially
    displayHackathons(hackathonsData);
    
    // Update statistics
    updateStats();
    
    // Set up event listeners
    setupEventListeners();
    
    // Start countdown timers (update every second)
    setInterval(updateAllCountdowns, 1000);
});


// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    // Search input - filter as user types
    searchInput.addEventListener('input', handleSearch);
    
    // Filter buttons - switch between filters
    filterButtons.forEach(button => {
        button.addEventListener('click', handleFilterClick);
    });
}


// ========== DISPLAY HACKATHONS ==========
// This function creates and shows hackathon cards
function displayHackathons(hackathons) {
    // Clear existing cards
    cardsContainer.innerHTML = '';
    
    // Check if there are hackathons to show
    if (hackathons.length === 0) {
        // Show "no results" message
        noResults.classList.add('show');
        return;
    }
    
    // Hide "no results" message
    noResults.classList.remove('show');
    
    // Loop through each hackathon and create a card
    hackathons.forEach(hackathon => {
        const card = createHackathonCard(hackathon);
        cardsContainer.appendChild(card);
    });
}


// ========== CREATE SINGLE CARD ==========
// Creates HTML for one hackathon card
function createHackathonCard(hackathon) {
    // Create card container
    const card = document.createElement('div');
    card.className = 'hackathon-card';
    card.dataset.id = hackathon.id;
    
    // Check if this hackathon is in favorites
    const isFavorite = favorites.includes(hackathon.id);
    
    // Format the date nicely
    const formattedDate = formatDate(hackathon.date);
    
    // Mode emoji and text
    const modeEmoji = hackathon.mode === 'online' ? '🌐' : '🏢';
    const modeText = hackathon.mode === 'online' ? 'Online' : 'Offline';
    
    // Create the card HTML
    card.innerHTML = `
        <!-- Card Header with gradient -->
        <div class="card-header">
            <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                    onclick="toggleFavorite(${hackathon.id})"
                    title="Add to favorites">
                ${isFavorite ? '⭐' : '☆'}
            </button>
            <h3 class="hackathon-name">🚀 ${hackathon.name}</h3>
            <span class="event-mode">${modeEmoji} ${modeText}</span>
        </div>
        
        <!-- Card Body with info -->
        <div class="card-body">
            <div class="info-item">
                <span class="info-icon">🏫</span>
                <span class="info-text">${hackathon.college}</span>
            </div>
            <div class="info-item">
                <span class="info-icon">📍</span>
                <span class="info-text">${hackathon.city}, ${hackathon.state}</span>
            </div>
            <div class="info-item">
                <span class="info-icon">📅</span>
                <span class="info-text">${formattedDate}</span>
            </div>
            
            <!-- Countdown Timer -->
            <div class="countdown" data-date="${hackathon.date}">
                ${getCountdownHTML(hackathon.date)}
            </div>
        </div>
        
        <!-- Card Footer with register button -->
        <div class="card-footer">
            <a href="${hackathon.registrationLink}" 
               target="_blank" 
               class="register-btn">
                🔗 Register Now
            </a>
        </div>
    `;
    
    return card;
}


// ========== COUNTDOWN FUNCTIONS ==========
// Get countdown HTML for a date
function getCountdownHTML(dateString) {
    const eventDate = new Date(dateString);
    const now = new Date();
    
    // Calculate difference in milliseconds
    const diff = eventDate - now;
    
    // If event has passed
    if (diff < 0) {
        return '<div class="event-ended">⏰ Event has ended</div>';
    }
    
    // Calculate days, hours, minutes, seconds
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `
        <div class="countdown-label">⏳ Event starts in:</div>
        <div class="countdown-timer">
            <div class="countdown-item">
                <span class="countdown-number">${days}</span>
                <span class="countdown-unit">Days</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-number">${hours}</span>
                <span class="countdown-unit">Hrs</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-number">${minutes}</span>
                <span class="countdown-unit">Min</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-number">${seconds}</span>
                <span class="countdown-unit">Sec</span>
            </div>
        </div>
    `;
}

// Update all countdown timers
function updateAllCountdowns() {
    const countdowns = document.querySelectorAll('.countdown');
    countdowns.forEach(countdown => {
        const date = countdown.dataset.date;
        countdown.innerHTML = getCountdownHTML(date);
    });
}


// ========== SEARCH FUNCTION ==========
function handleSearch() {
    // Get search term (convert to lowercase for easier matching)
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    // Filter hackathons based on search term
    let filtered = hackathonsData.filter(hackathon => {
        // Check if search term matches state, city, or college
        return hackathon.state.toLowerCase().includes(searchTerm) ||
               hackathon.city.toLowerCase().includes(searchTerm) ||
               hackathon.college.toLowerCase().includes(searchTerm) ||
               hackathon.name.toLowerCase().includes(searchTerm);
    });
    
    // Apply current filter on top of search
    filtered = applyFilter(filtered, currentFilter);
    
    // Display filtered results
    displayHackathons(filtered);
}


// ========== FILTER FUNCTIONS ==========
function handleFilterClick(event) {
    // Get the clicked button
    const button = event.target;
    
    // Update active button styling
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    // Get filter type from button's data attribute
    currentFilter = button.dataset.filter;
    
    // Re-run search with new filter
    handleSearch();
}

// Apply filter to hackathon array
function applyFilter(hackathons, filter) {
    switch(filter) {
        case 'online':
            return hackathons.filter(h => h.mode === 'online');
        
        case 'offline':
            return hackathons.filter(h => h.mode === 'offline');
        
        case 'favorites':
            return hackathons.filter(h => favorites.includes(h.id));
        
        default: // 'all'
            return hackathons;
    }
}


// ========== FAVORITES FUNCTIONS ==========
// Toggle favorite status (this is called from HTML onclick)
function toggleFavorite(hackathonId) {
    // Check if already in favorites
    const index = favorites.indexOf(hackathonId);
    
    if (index === -1) {
        // Not in favorites - add it
        favorites.push(hackathonId);
    } else {
        // Already in favorites - remove it
        favorites.splice(index, 1);
    }
    
    // Save to browser storage
    localStorage.setItem('hackathonFavorites', JSON.stringify(favorites));
    
    // Update the button appearance
    const card = document.querySelector(`[data-id="${hackathonId}"]`);
    if (card) {
        const favBtn = card.querySelector('.favorite-btn');
        favBtn.classList.toggle('active');
        favBtn.textContent = favorites.includes(hackathonId) ? '⭐' : '☆';
    }
    
    // Update stats
    updateStats();
    
    // If showing favorites filter, refresh the display
    if (currentFilter === 'favorites') {
        handleSearch();
    }
}


// ========== STATISTICS FUNCTIONS ==========
function updateStats() {
    // Total hackathons
    totalHackathonsEl.textContent = hackathonsData.length;
    
    // Count upcoming hackathons (date is in the future)
    const now = new Date();
    const upcoming = hackathonsData.filter(h => new Date(h.date) > now);
    upcomingCountEl.textContent = upcoming.length;
    
    // Favorites count
    favoritesCountEl.textContent = favorites.length;
}


// ========== UTILITY FUNCTIONS ==========
// Format date to readable string
function formatDate(dateString) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}
