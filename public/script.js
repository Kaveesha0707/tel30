const API_URL = "/api/keywords";
const saveBtn = document.getElementById('save-btn');
const bulkDeleteBtn = document.getElementById('bulk-delete');
const selectAllCheckbox = document.getElementById('select-all');
const cardGrid = document.getElementById('card-grid');
const usernameInput = document.getElementById('username-input');
const channelTextarea = document.getElementById('channel-textarea');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageNumber = document.getElementById('page-number');

let currentPage = 1;
let totalPages = 1;

// Fetch keywords with pagination
async function fetchKeywords(page = 1) {
  try {
    const response = await fetch(`${API_URL}?page=${page}&limit=15`);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const result = await response.json();
    totalPages = result.totalPages;
    displayKeywords(result.keywords);
  } catch (err) {
    console.error(`Error fetching keywords: ${err.message}`);
  }
}

// Display keywords as cards
function displayKeywords(keywords) {
  cardGrid.innerHTML = ''; // Clear existing cards
  keywords.forEach((keyword) => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.setAttribute('data-id', keyword._id);

    // Render channels as a comma-separated string
    const channels = keyword.channels.join(', ');

    card.innerHTML = `
      <div class="card-header">
        <input type="checkbox" class="card-selector">
        <span class="username">Channel Name: ${channels}</span>
        <button class="delete-btn" onclick="deleteKeyword('${keyword._id}')">🗑</button>
      </div>
      <ul>
        <li>Available - ${keyword.available ? "✅" : "❌"}</li>
        <li>Unavailable - ${keyword.unavailable ? "✅" : "❌"}</li>
        <li>Created - ${keyword.created ? "✅" : "❌"}</li>
      </ul>
      <p class="items">Created By - ${keyword.createdBy}</p>
      <p class="date">Created At - ${keyword.createdAt}</p>
    `;
    cardGrid.appendChild(card);
  });
}

// Handle page navigation
prevPageBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    pageNumber.textContent = `Page ${currentPage}`;
    fetchKeywords(currentPage);
  }
});

nextPageBtn.addEventListener('click', () => {
  if (currentPage < totalPages) {
    currentPage++;
    pageNumber.textContent = `Page ${currentPage}`;
    fetchKeywords(currentPage);
  }
});

// Save new data
saveBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  const channelNames = channelTextarea.value.trim().split(',').map(item => item.trim());

  if (!username || channelNames.length === 0) {
    return alert("Please provide both username and channel names.");
  }

  // Validate channel names format (channel01, channel02, etc.)
  const validChannelNames = channelNames.every(name => /^[a-zA-Z0-9]+$/.test(name));
  if (!validChannelNames) {
    return alert("Channel names must be alphanumeric (e.g., channel01, channel02).");
  }

  try {
    // Create multiple entries for each valid channel
    const promises = channelNames.map(async (channelName) => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          channels: [channelName], // Single channel per row
          available: false,
          unavailable: false,
          created: false,
          createdBy: username,
          createdAt: null,
        }),
      });
      return response.json();
    });

    await Promise.all(promises);
    fetchKeywords(); // Reload the data
  } catch (err) {
    console.error('Error saving data:', err);
  }
});

// Handle bulk delete
bulkDeleteBtn.addEventListener('click', async () => {
  const selectedCards = document.querySelectorAll('.card-selector:checked');
  const idsToDelete = Array.from(selectedCards).map(card => card.closest('.card').dataset.id);
  if (idsToDelete.length === 0) return alert("Please select at least one item to delete.");

  try {
    await Promise.all(idsToDelete.map(id => fetch(`${API_URL}?id=${id}`, { method: 'DELETE' })));
    fetchKeywords(); // Reload data
  } catch (err) {
    console.error('Error deleting keywords:', err);
  }
});

// Handle Select All checkbox
selectAllCheckbox.addEventListener('change', (e) => {
  const allCheckboxes = document.querySelectorAll('.card-selector');
  allCheckboxes.forEach(checkbox => checkbox.checked = e.target.checked);
});

// Delete a single keyword
async function deleteKeyword(id) {
  try {
    const response = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
    if (response.ok) {
      fetchKeywords(); // Reload the data after deletion
    } else {
      const error = await response.json();
      alert(`Error: ${error.message}`);
    }
  } catch (err) {
    console.error('Error deleting keyword:', err);
  }
}

// Initial fetch
fetchKeywords(currentPage);
