// Initialize map
        const map = L.map('map').setView([0, 0], 2);
        const marker = L.marker([0, 0]).addTo(map);
        let currentLat = 0;
        let currentLng = 0;
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Update the time in the sidebar
        function updateTime() {
            const now = new Date();
            const timeStr = now.toLocaleTimeString();
            document.getElementById('lastUpdate').textContent = timeStr;
        }
        
        // Format coordinates for display
        function formatCoords(lat, lng) {
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
        
        // Update location
        async function updateLocation() {
            try {
                const res = await fetch(`/get_location/${window.deviceId}`);
                if (!res.ok) {
                    throw new Error('Failed to fetch location');
                }
                
                const data = await res.json();
                currentLat = parseFloat(data.lat) || 0;
                currentLng = parseFloat(data.lng) || 0;
                
                // Update marker and map
                marker.setLatLng([currentLat, currentLng]);
                
                // Update UI
                document.getElementById('coordinates').textContent = formatCoords(currentLat, currentLng);
                document.getElementById('locationStatus').textContent = 'Location updated';
                updateTime();
                
                // Update battery and network if available
                if (data.battery) {
                    const batteryLevel = parseInt(data.battery);
                    document.getElementById('batteryPercentage').textContent = `${batteryLevel}%`;
                    document.getElementById('batteryFill').style.width = `${batteryLevel}%`;
                    
                    // Change battery color based on level
                    const batteryFill = document.getElementById('batteryFill');
                    if (batteryLevel < 20) {
                        batteryFill.style.background = '#f44336'; // Red for low battery
                    } else if (batteryLevel < 50) {
                        batteryFill.style.background = '#ff9800'; // Orange for medium
                    } else {
                        batteryFill.style.background = '#4CAF50'; // Green for good
                    }
                }
                
                if (data.network) {
                    document.getElementById('networkStatus').textContent = data.network;
                }
                
                console.log("✅ Updated location on map:", currentLat, currentLng);
            } catch (err) {
                document.getElementById('locationStatus').textContent = 'Failed to update location';
                console.error("❌ Failed to fetch location", err);
            }
        }
        
        // Center map button
        document.getElementById('centerMapBtn').addEventListener('click', function() {
            map.setView([currentLat, currentLng], 16);
        });
        
        // Refresh location button
        document.getElementById('refreshBtn').addEventListener('click', function() {
            document.getElementById('locationStatus').textContent = 'Refreshing...';
            updateLocation();
        });
        
        // Play sound button (placeholder functionality)
        document.getElementById('playSoundBtn').addEventListener('click', function() {
            alert('This feature will be implemented soon!');
        });
        
        // History button (placeholder functionality)
        document.getElementById('historyBtn').addEventListener('click', function() {
            alert('Location history will be available soon!');
        });
        
        // Initial update
        updateLocation();
        
        // Set up periodic updates
        setInterval(updateLocation, 10000); // Update every 10 seconds