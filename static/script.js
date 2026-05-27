
        let map, markersLayer;
        let providers = [];
        let filteredProviders = [];
        let currentUser = null;
        let currentUserType = null;
        let userLocation = null;

        // User Status Update
        function updateUserStatus() {

            const statusEl = document.getElementById('userStatus');
            const logoutBtn = document.getElementById('logoutBtn');

            if (currentUser) {

                statusEl.innerHTML = `
                    <span class="status-logged-in"
                    style="padding:8px 15px; border-radius:20px; font-size:14px;">
                        ✅ Logged in as ${currentUser}
                    </span>
                `;

                logoutBtn.style.display = 'inline-block';

            } else {

                statusEl.innerHTML = '';
                logoutBtn.style.display = 'none';
            }
        }

        // Tab Navigation
        function showTab(tabName, el) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            el.classList.add('active');

            if (tabName === 'mapTab') initMap();
            if (tabName === 'providers') loadProviders();

            if (tabName === 'myBookings') {
                loadMyBookings();
            }

            if (tabName === 'providerBookings') {
                loadProviderBookings();
            }
        }
        function showAuth(type){

            if(type === 'login'){

                document.getElementById('loginForm')
                .style.display = 'block';

                document.getElementById('signupForm')
                .style.display = 'none';
            }

            else{

                document.getElementById('loginForm')
                .style.display = 'none';

                document.getElementById('signupForm')
                .style.display = 'block';
            }
        }

        // SEARCH FUNCTIONALITY
        document.getElementById('providerSearch').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            performSearch(searchTerm);
        });

        function performSearch(searchTerm) {
            if (!searchTerm) {
                filteredProviders = [...providers];
                document.getElementById('searchResultsCount').style.display = 'none';
            } else {
                filteredProviders = providers.filter(provider => 
                    provider.name.toLowerCase().includes(searchTerm) ||
                    provider.serviceType.toLowerCase().includes(searchTerm) ||
                    provider.phone.includes(searchTerm) ||
                    (provider.serviceAreas &&
                    provider.serviceAreas.toLowerCase().includes(searchTerm)) ||
                    (provider.serviceDescription &&
                    provider.serviceDescription.toLowerCase().includes(searchTerm))
                );
                updateSearchCount(filteredProviders.length, searchTerm);
            }
            renderProvidersList(filteredProviders);
        }
        function quickAreaSearch(area) {

            document.getElementById('providerSearch').value = area;

            performSearch(area.toLowerCase());
        }

        function updateSearchCount(count, searchTerm) {
            const countEl = document.getElementById('searchResultsCount');
            countEl.textContent = `Found ${count} provider${count !== 1 ? 's' : ''} for "${searchTerm}"`;
            countEl.style.display = 'block';
        }

        function renderProvidersList(providerList) {
    const container = document.getElementById('providersList');

    if (providerList.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                ❌ No providers found
            </div>
        `;
        return;
    }

    container.innerHTML = providerList.map(p => `
        <div class="provider-card">

            <div class="provider-info">
                <div>
                     <img 
                        src="/static/uploads/${p.image}"
                        style="
                            width:100px;
                            height:100px;
                            object-fit:cover;
                            border-radius:50%;
                            margin-bottom:10px;
                            border:3px solid #667eea;
                        "
                        onerror="this.style.display='none'"
                    >

                    <div class="provider-name">${p.name}</div>

                    <div>
                        🛠️ ${p.serviceType}
                    </div>

                    <div>
                        💰 ₹${p.rate}/hr
                    </div>

                    <div style="
                        margin-top:8px;
                        color:#555;
                        line-height:1.5;
                    ">
                        📝 ${p.serviceDescription || 'No description added'}
                    </div>
                    <div>
                        ⭐ Rating: ${
                            p.avg_rating
                            ? '⭐'.repeat(Math.round(p.avg_rating))
                            : 'No Rating'
                        }

                        (${p.total_reviews || 0} reviews)
                    </div>

                    <div>
                        ${p.availability === 'online'
                            ? '🟢 Online'
                            : '🔴 Offline'}
                    </div>
                </div>

                <div>
                    📞 ${p.phone}<br>
                    📍 <strong>Areas:</strong> 
                    ${p.serviceAreas || 'No areas added'}
                </div>
            </div>

            <!-- REVIEWS -->
            <div style="margin-top:15px;">
                <h4>⭐ Reviews</h4>

                ${
                    p.reviews && p.reviews.length > 0
                    ? p.reviews.map(r => `
                        <div style="
                            background:#f5f5f5;
                            padding:10px;
                            border-radius:10px;
                            margin-top:8px;
                        ">
                            <strong>${'⭐'.repeat(r.rating)}</strong><br>
                            ${r.comment || 'No comment'}
                        </div>
                    `).join('')
                    : '<p>No reviews yet</p>'
                }
            </div>
        
            ${currentUserType === 'customer' ? `
                <div style="margin-top:15px;">

                    <button onclick="bookProvider(${p.id})"
                        class="btn small-btn btn-success">
                        📅 Book
                    </button>

                    <button onclick="reviewProvider(${p.id})"
                        class="btn small-btn">
                        ⭐ Review
                    </button>

                </div>
            ` : ''}
        
            ${currentUserType === 'provider' ? `
                <div style="margin-top:15px;">

                    <button onclick="updateProvider(${p.id})"
                        class="btn small-btn">
                        ✏️ Update
                    </button>

                    <button onclick="deleteProvider(${p.id})"
                        class="btn small-btn"
                        style="background:#dc3545;">
                        🗑️ Delete
                    </button>

                </div>
            ` : ''}

        </div>
    `).join('');
}

        // SIGNUP
        async function signupUser() {

            const name =
                document.getElementById('signupName').value;
            const email =
                document.getElementById('signupEmail').value;
            const password =
                document.getElementById('signupPassword').value;
            const userType =
                document.getElementById('signupType').value;

             if (!name || !email || !password) {
                alert('Please fill all fields');
                return;
            }

            try {
                const res = await fetch('/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        password,
                        user_type: userType
                    })
                });

                const data = await res.json();

                if (res.ok) {

                    alert('Account created successfully!');

                    document.getElementById('signupName').value = '';
                    document.getElementById('signupEmail').value = '';
                    document.getElementById('signupPassword').value = '';
                    showTab(
                        'login',
                        document.querySelectorAll('.tab')[1]
                    );


                } else {

                    alert(data.error || data.message);
                }

            } catch (err) {

                console.log(err);

                alert('Signup failed');
            }
        }

        // LOGIN
        async function loginUser() {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const res = await fetch('/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({email, password}),
                    credentials: 'include'
                });

                const data = await res.json();
                
                if (res.ok) {
                    currentUser = email;
                    currentUserType = data.user_type;
                    alert('Login successful!');
                    updateUserStatus();
                    document.getElementById('loginStatus').textContent = 'Login successful';
                     
                    // PROVIDER → REGISTER SERVICE
                    if (currentUserType === 'provider') {

                        showTab(
                            'register',
                            document.querySelectorAll('.tab')[2]
                        );

                    }

                    // CUSTOMER → PROVIDERS LIST
                    else if (currentUserType === 'customer') {

                        showTab(
                            'providers',
                            document.querySelectorAll('.tab')[4]
                        );

                    }
                } else {
                    alert(data.message);
                }
            } catch (err) {
                alert('Login failed');
            }
        }

        //LOGOUT
        async function logoutUser() {

            try {

                const res = await fetch('/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                const data = await res.json();

                if (res.ok) {
                    currentUser = null;
                    updateUserStatus();
                    alert('Logged out successfully');
                    loadProviders();
                }

            } catch (err) {
                alert('Logout failed');
            }
        }

        // REGISTER PROVIDER (FIXED)
        document.getElementById('registerForm').onsubmit = async (e) => {
            e.preventDefault();

            if (!currentUser) {
                alert('Please login first!');
                showTab('login', document.querySelector('.tab'));
                return;
            }

            const formData = new FormData();

            formData.append(
                'serviceType',
                document.getElementById('serviceType').value
            );

            formData.append(
                'experience',
                document.getElementById('experience').value || 0
            );

            formData.append(
                'rate',
                document.getElementById('rate').value || 0
            );

            formData.append(
                'phone',
                document.getElementById('phone').value
            );

            formData.append(
                'lat',
                document.getElementById('lat').value
            );

            formData.append(
                'lng',
                document.getElementById('lng').value
            );

            formData.append(
                'availability',
                document.getElementById('availability').value
            );

            formData.append(
                'serviceAreas',
                document.getElementById('serviceAreas').value
            );

            formData.append(
                'serviceDescription',
                document.getElementById('serviceDescription').value
            );

            const imageFile =
                document.getElementById('providerImage').files[0];

            if (imageFile) {
                formData.append('image', imageFile);
            }
            
            const lat = document.getElementById('lat').value;
            const lng = document.getElementById('lng').value;

            if (!lat || !lng) {
                alert('Please get your location first!');
                return;
            }
            
            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert('✅ Service registered successfully!');
                    document.getElementById('registerForm').reset();
                    document.getElementById('locationStatus').textContent = '';
                    loadProviders();
                    loadProvidersOnMap();
                } else {
                    alert(data.error || 'Registration failed');
                }
            } catch (err) {
                alert('Registration failed: ' + err.message);
            }
        };

        // Location
        document.getElementById('getLocation').onclick = () => {
            if (navigator.geolocation) {
                document.getElementById('locationStatus').textContent = '🔍 Detecting location...';
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        document.getElementById('lat').value = position.coords.latitude;
                        document.getElementById('lng').value = position.coords.longitude;
                        document.getElementById('locationStatus').innerHTML = 
                            `✅ Location: <strong>${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}</strong>`;
                    },
                    () => { 
                        document.getElementById('locationStatus').textContent = '❌ Location access denied'; 
                    }
                );
            }
        };

        // Distance calculation
        function calculateDistance(lat1, lon1, lat2, lon2) {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
            return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
        }

        // Map
        function initMap() {
            map = L.map('map').setView([28.6139, 77.2090], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            markersLayer = L.layerGroup().addTo(map);
            loadProvidersOnMap();
            setInterval(loadProvidersOnMap, 5000);
        }

        async function loadProvidersOnMap() {
            try {
                const response = await fetch('/providers');
                providers = await response.json();
                if (markersLayer) markersLayer.clearLayers();
                
                providers.forEach(provider => {
                    if (provider.lat && provider.lng) {
                        let distance = userLocation ? 
                            calculateDistance(userLocation.lat, userLocation.lng, parseFloat(provider.lat), parseFloat(provider.lng)).toFixed(2) + " km" : 
                            "N/A";
                        
                        const marker = L.marker([provider.lat, provider.lng]).addTo(markersLayer);
                        marker.bindPopup(`
                            <b>${provider.name}</b><br>
                            ${provider.serviceType}<br>
                            ₹${provider.rate}/hr<br>
                            📏 ${distance}<br>
                            ${provider.availability === 'online' ? '🟢 Online' : '🔴 Offline'}
                        `);
                    }
                });
            } catch (err) {
                console.error('Map load error:', err);
            }
        }

        // UPDATED Providers List with Search
        async function loadProviders() {
            try {
                const response = await fetch('/providers');
                providers = await response.json();
                filteredProviders = [...providers];
                
                if (userLocation) {
                    providers.forEach(p => {
                        if (p.lat && p.lng) {
                            p.distance = calculateDistance(userLocation.lat, userLocation.lng, parseFloat(p.lat), parseFloat(p.lng));
                        } else {
                            p.distance = 9999;
                        }
                    });
                    filteredProviders.sort((a, b) => a.distance - b.distance);
                }

                renderProvidersList(filteredProviders);
            } catch (err) {
                console.error('Providers load error:', err);
            }
        }


        // USER BOOKINGS
        async function loadMyBookings() {

            const container =
                document.getElementById('myBookingsList');

            // LOGGED IN USER
            if (currentUser) {

                const res = await fetch('/my_bookings', {
                    credentials: 'include'
                });

                const data = await res.json();

                if (data.length === 0) {

                    container.innerHTML =
                        '<p>No bookings yet</p>';

                    return;
                }

                container.innerHTML = data.map(b => `
                    <div class="provider-card">

                        <h3>${b.provider_name}</h3>
                        <p>🛠️ ${b.service}</p>
                        <p>📅 ${b.date}</p>
                        <p>⏰ ${b.time}</p>
                        <p>
                            Status:
                            <strong>${b.status}</strong>
                        </p>

                    </div>
                `).join('');

            }

            // GUEST USER
            else {
                container.innerHTML = '<p>Please login first</p>';
            }
        }


        // PROVIDER BOOKINGS
        async function loadProviderBookings() {

            const res = await fetch('/provider_bookings', {
                credentials: 'include'
            });

            const data = await res.json();

            const container = document.getElementById('providerBookingsList');

            if (data.length === 0) {

                container.innerHTML = `
                    <p>No bookings received</p>
                `;

                return;
            }

            container.innerHTML = data.map(b => `
                <div class="provider-card">

                    <h3>${b.customer_name}</h3>
                    <p>📞 ${b.customer_phone}</p>
                    <p>📍 ${b.customer_address}</p>
                    <p>🛠️ ${b.service}</p>
                    <p>📅 ${b.date}</p>
                    <p>⏰ ${b.time}</p>
                    <p>
                        Status:
                        <strong>${b.status}</strong>
                    </p>

                    <button
                        class="btn small-btn btn-success"
                        onclick="changeBookingStatus(${b.id}, 'accepted')">
                        ✅ Accept
                    </button>

                    <button
                        class="btn small-btn"
                        style="background:#dc3545;"
                        onclick="changeBookingStatus(${b.id}, 'cancelled')">
                        ❌ Cancel
                    </button>

                    <button
                        class="btn small-btn"
                        onclick="changeBookingStatus(${b.id}, 'completed')">
                        ✔ Complete
                    </button>

                </div>
            `).join('');
        }

        // CHANGE BOOKING STATUS
        async function changeBookingStatus(id, status) {

            const res = await fetch(`/update_booking/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },

                credentials: 'include',

                body: JSON.stringify({
                    status: status
                })
            });

            const data = await res.json();

            alert(data.message);

            loadProviderBookings();
        }

        // DELET PROVIDER
        async function deleteProvider(id) {
            if (!currentUser || !confirm('Delete this provider?')) return;
            try {
                const res = await fetch(`/delete/${id}`, {method: 'DELETE', credentials: 'include'});
                if (res.ok) {
                    alert('Deleted!');
                    loadProviders();
                    loadProvidersOnMap();
                }
            } catch (err) {
                alert('Delete failed');
            }
        }

        //UPDATE PROVIDER
        async function updateProvider(id) {
            if (!currentUser) return alert('Login required');
            const rate = prompt('New rate (₹/hr):') || '';
            const experience = prompt('New experience (years):') || '';
            const serviceType = prompt('New service type:') || '';
            
            try {
                const res = await fetch(`/update/${id}`, {
                    method: 'PUT',
                    credentials: 'include',
                    body: JSON.stringify({rate, experience, serviceType})
                });
                if (res.ok) {
                    alert('Updated!');
                    loadProviders();
                    loadProvidersOnMap();
                }
            } catch (err) {
                alert('Update failed');
            }
        }

        //BOOK PROVIdER
        async function bookProvider(id) {
            if (!currentUser) {
                alert('Please login first to book');
                showTab('login', document.querySelectorAll('.tab')[1]);
                return;
            }
            const provider = providers.find(p => p.id === id);
            const popup = document.createElement('div');

            popup.innerHTML = `
                <div id="bookingPopup" style="
                    position:fixed;
                    top:0;
                    left:0;
                    width:100%;
                    height:100%;
                    background:rgba(0,0,0,0.5);
                    display:flex;
                    justify-content:center;
                    align-items:center;
                    z-index:9999;
                ">

                    <div style="
                        background:white;
                        padding:25px;
                        border-radius:20px;
                        width:320px;
                        box-shadow:0 10px 30px rgba(0,0,0,0.3);
                    ">

                        <h2 style="margin-bottom:20px;">
                            📅 Book Provider
                        </h2>

                        <input type="text"
                            id="customerName"
                            placeholder="Your Name"
                            style="
                                width:100%;
                                padding:10px;
                                margin-top:10px;
                                margin-bottom:10px;
                                border-radius:10px;
                                border:1px solid #ccc;
                            ">

                        <input type="text"
                            id="customerPhone"
                            placeholder="Phone Number"
                            style="
                                width:100%;
                                padding:10px;
                                margin-bottom:10px;
                                border-radius:10px;
                                border:1px solid #ccc;
                            ">

                        <textarea
                            id="customerAddress"
                            placeholder="Your Address"
                            style="
                                width:100%;
                                padding:10px;
                                margin-bottom:15px;
                                border-radius:10px;
                                border:1px solid #ccc;
                                height:80px;
                            "></textarea>

                        <label>
                            Select Date
                        </label>

                        <input 
                            type="date"
                            id="bookingDate"
                            style="
                                width:100%;
                                padding:12px;
                                margin-top:8px;
                                margin-bottom:15px;
                                border-radius:10px;
                                border:1px solid #ccc;
                            "
                        >

                        <label>
                            Select Time
                        </label>

                        <input 
                            type="time"
                            id="bookingTime"
                            style="
                                width:100%;
                                padding:12px;
                                margin-top:8px;
                                margin-bottom:20px;
                                border-radius:10px;
                                border:1px solid #ccc;
                            "
                        >

                        <button 
                            id="confirmBooking"
                            style="
                                width:100%;
                                padding:12px;
                                border:none;
                                border-radius:10px;
                                background:#28a745;
                                color:white;
                                font-size:16px;
                                cursor:pointer;
                                margin-bottom:10px;
                            ">
                            ✅ Confirm Booking
                        </button>

                        <button 
                            id="cancelBooking"
                            style="
                                width:100%;
                                padding:12px;
                                border:none;
                                border-radius:10px;
                                background:#dc3545;
                                color:white;
                                font-size:16px;
                                cursor:pointer;
                            ">
                            ❌ Cancel
                        </button>

                    </div>
                </div>
            `;

            document.body.appendChild(popup);

            document.getElementById('cancelBooking').onclick = () => {
                popup.remove();
            };

            document.getElementById('confirmBooking').onclick = async () => {
                const customerName = document.getElementById('customerName').value;
                const customerPhone = document.getElementById('customerPhone').value;
                const customerAddress = document.getElementById('customerAddress').value;
                const date = document.getElementById('bookingDate').value;
                const time = document.getElementById('bookingTime').value;

                if (
                    !customerName ||
                    !customerPhone ||
                    !customerAddress ||
                    !date ||
                    !time
                ) {
                    alert('Please fill all booking details');
                    return;
                }

                try {

                    const res = await fetch('/book', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            provider_id: id,
                            customer_name: customerName,
                            customer_phone: customerPhone,
                            customer_address: customerAddress,
                
                            date: date,
                            time: time
                        })
                    });

                    const data = await res.json();

                    alert(data.message);

                    if (res.ok) {
                        popup.remove();
                        loadMyBookings();
                        loadProviderBookings();
                    }
                } catch (err) {
                    console.log(err);
                    alert('Booking failed');
                }
            };
        }
        
        //REVIEW PROVIDER
        async function reviewProvider(id) {

            let stars = prompt(
        `⭐ Rate Provider

        5 = ⭐⭐⭐⭐⭐ Excellent
        4 = ⭐⭐⭐⭐ Good
        3 = ⭐⭐⭐ Average
        2 = ⭐⭐ Bad
        1 = ⭐ Very Bad

        Enter stars (1-5):`
            );

            if (!stars) return;

            stars = parseInt(stars);

            if (stars < 1 || stars > 5) {
                alert('Please enter rating between 1 and 5');
                return;
            }

            const comment = prompt('✍️ Write review (optional):') || '';

            try {

                const res = await fetch('/review', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        provider_id: id,
                        rating: stars,
                        comment: comment
                    })
                });

                const data = await res.json();

                alert(data.message);

                if (res.ok) {
                    loadProviders();
                }

            } catch (err) {

                alert('Review failed');
            }
        }

        // Get user location on load
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                userLocation = {lat: pos.coords.latitude, lng: pos.coords.longitude};
            });
        }

        updateUserStatus();