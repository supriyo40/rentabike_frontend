// Global state
const state = {
    bikes: [],
    isAdmin: sessionStorage.getItem('isAdmin') === 'true',
    isLoading: false
  };
  
  // DOM Elements
  const elements = {
    bikeList: document.getElementById('bikeList'),
    adminPanel: document.getElementById('adminPanel'),
    adminPasswordInput: document.getElementById('adminPassword'),
    statusControls: document.getElementById('statusControls'),
    loadingIndicator: document.createElement('div')
  };
  
  // API Configuration
  const config = {
    API_URL: 'https://rentabike-backend.onrender.com/api',
    refreshInterval: 30000 // 30 seconds
  };
  
  // Initialize loading indicator
  elements.loadingIndicator.className = 'loading-indicator';
  elements.loadingIndicator.textContent = 'Loading...';
  document.body.appendChild(elements.loadingIndicator);
  
  // Utility Functions
  const showLoading = (show) => {
    elements.loadingIndicator.style.display = show ? 'block' : 'none';
    state.isLoading = show;
  };
  
  const renderBikes = () => {
    elements.bikeList.innerHTML = '';
    
    state.bikes.forEach(bike => {
      const bikeCard = document.createElement('div');
      bikeCard.className = 'bike-card';
      
      const statusInfo = {
        available: { class: 'book-btn', text: 'Book Now', disabled: false },
        pending: { class: 'book-btn pending-btn', text: 'Pending', disabled: true },
        rented: { class: 'book-btn rented-btn', text: 'Rented', disabled: true }
      };
      
      const { class: btnClass, text: btnText, disabled } = statusInfo[bike.status];
      
      bikeCard.innerHTML = `
        <img src="${bike.image}" alt="${bike.name}" class="bike-image">
        <h3 class="bike-name">${bike.name}</h3>
        <p class="bike-specs">${bike.specs}</p>
        <p class="bike-price">${bike.price}</p>
        <button class="${btnClass}" onclick="handleBooking('${bike._id}')" ${disabled ? 'disabled' : ''}>
          ${btnText}
        </button>
      `;
      
      elements.bikeList.appendChild(bikeCard);
    });
  };
  
  const populateAdminDropdown = () => {
    const bikeSelect = document.getElementById('bikeSelect');
    bikeSelect.innerHTML = '';
    
    state.bikes.forEach(bike => {
      const option = document.createElement('option');
      option.value = bike._id;
      option.textContent = `${bike.name} (${bike.status})`;
      bikeSelect.appendChild(option);
    });
  };
  
  // API Functions
  const fetchBikes = async () => {
    if (state.isLoading) return;
    
    try {
      showLoading(true);
      const response = await fetch(`${config.API_URL}/bikes`);
      
      if (!response.ok) throw new Error('Failed to fetch bikes');
      
      state.bikes = await response.json();
      renderBikes();
      if (state.isAdmin) populateAdminDropdown();
    } catch (err) {
      console.error('Error fetching bikes:', err);
      alert('Failed to load bikes. Please try again later.');
    } finally {
      showLoading(false);
    }
  };
  
  const handleBooking = async (bikeId) => {
    if (state.isLoading) return;
    
    try {
      showLoading(true);
      const response = await fetch(`${config.API_URL}/bikes/${bikeId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' })
      });
      
      if (!response.ok) throw new Error('Failed to book bike');
      
      const bike = await response.json();
      const message = `Hi, I'm interested in renting the ${bike.name}.`;
      window.open(`https://wa.me/${bike.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
      await fetchBikes();
    } catch (err) {
      console.error('Error booking bike:', err);
      alert('Failed to book bike. Please try again.');
    } finally {
      showLoading(false);
    }
  };
  
  const toggleAdminMode = async () => {
    if (state.isLoading) return;
    
    const password = elements.adminPasswordInput.value;
    if (!password) return;
    
    try {
      showLoading(true);
      const response = await fetch(`${config.API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password })
      });
      
      if (response.ok) {
        state.isAdmin = true;
        sessionStorage.setItem('isAdmin', 'true');
        elements.statusControls.style.display = 'block';
        elements.adminPasswordInput.value = '';
        populateAdminDropdown();
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      console.error('Error logging in:', err);
      state.isAdmin = false;
      sessionStorage.removeItem('isAdmin');
      elements.statusControls.style.display = 'none';
      alert('Incorrect password. Please try again.');
    } finally {
      showLoading(false);
    }
  };
  
  const updateBikeStatus = async () => {
    if (state.isLoading) return;
    
    const bikeId = document.getElementById('bikeSelect').value;
    const newStatus = document.getElementById('statusSelect').value;
    
    try {
      showLoading(true);
      const response = await fetch(`${config.API_URL}/bikes/${bikeId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      alert('Status updated successfully');
      await fetchBikes();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      showLoading(false);
    }
  };
  
  const adminLogout = () => {
    state.isAdmin = false;
    sessionStorage.removeItem('isAdmin');
    elements.statusControls.style.display = 'none';
  };
  
  // Initialize the app
  document.addEventListener('DOMContentLoaded', () => {
    // Check admin status
    if (state.isAdmin) {
      elements.statusControls.style.display = 'block';
    }
    
    // Initial data load
    fetchBikes();
    
    // Set up periodic refresh
    setInterval(fetchBikes, config.refreshInterval);
  });
  
  // Expose functions to global scope
  window.handleBooking = handleBooking;
  window.toggleAdminMode = toggleAdminMode;
  window.updateBikeStatus = updateBikeStatus;
  window.adminLogout = adminLogout;