// Live Map JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Live Map script loaded');
    
    let map = null;
    let markers = [];
    let deviceData = [];
    let currentFilter = 'all';
    
    // Initialize map when map page becomes active
    function initializeLiveMap() {
        setupMapControls();
        initializeMap();
        loadDevices();
        setupDevicePanel();
    }

    // Setup Map Controls
    function setupMapControls() {
        const filterBtns = document.querySelectorAll('.map-filter-btn');
        const centerMapBtn = document.getElementById('centerMapBtn');
        const refreshMapBtn = document.getElementById('refreshMapBtn');
        const fullscreenMapBtn = document.getElementById('fullscreenMapBtn');

        // Filter buttons
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active to clicked button
                this.classList.add('active');
                
                currentFilter = this.dataset.filter;
                filterDevicesOnMap(currentFilter);
            });
        });

        // Map action buttons
        if (centerMapBtn) {
            centerMapBtn.addEventListener('click', centerMapToDevices);
        }

        if (refreshMapBtn) {
            refreshMapBtn.addEventListener('click', function() {
                this.querySelector('i').classList.add('fa-spin');
                refreshDevices();
                
                setTimeout(() => {
                    this.querySelector('i').classList.remove('fa-spin');
                }, 1000);
            });
        }

        if (fullscreenMapBtn) {
            fullscreenMapBtn.addEventListener('click', toggleFullscreen);
        }
    }

    // Initialize the map
    function initializeMap() {
        const mapContainer = document.getElementById('liveMap');
        if (!mapContainer) return;

        // Remove loading state
        const loadingElement = mapContainer.querySelector('.map-loading');
        if (loadingElement) {
            loadingElement.remove();
        }

        // For this implementation, we'll create a simple interactive map using CSS and JavaScript
        // In a real application, you'd use Google Maps, Leaflet, or Mapbox
        
        const mapElement = document.createElement('div');
        mapElement.className = 'interactive-map';
        mapElement.innerHTML = `
            <div class="map-background">
                <div class="map-grid"></div>
                <div class="map-devices-layer" id="mapDevicesLayer"></div>
            </div>
        `;
        
        mapContainer.appendChild(mapElement);

        // Simulate map interactivity
        makeMapInteractive(mapElement);
    }

    // Make map interactive
    function makeMapInteractive(mapElement) {
        let isDragging = false;
        let startX, startY;
        let translateX = 0, translateY = 0;
        let scale = 1;

        const mapBackground = mapElement.querySelector('.map-background');

        // Mouse events for dragging
        mapElement.addEventListener('mousedown', function(e) {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            mapElement.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            
            updateMapTransform();
        });

        document.addEventListener('mouseup', function() {
            isDragging = false;
            mapElement.style.cursor = 'grab';
        });

        // Zoom with mouse wheel
        mapElement.addEventListener('wheel', function(e) {
            e.preventDefault();
            
            const zoomFactor = 0.1;
            const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
            
            scale = Math.max(0.5, Math.min(3, scale + delta));
            updateMapTransform();
        });

        function updateMapTransform() {
            mapBackground.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        }

        // Initialize map style
        mapElement.style.cursor = 'grab';
        mapBackground.style.transform = 'translate(0px, 0px) scale(1)';
    }

    // Load devices from API
    function loadDevices() {
        fetch('/api/map/devices')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    deviceData = data.devices;
                    renderDevicesOnMap(deviceData);
                    updateDevicesList(deviceData);
                } else {
                    showNotification('Failed to load map devices', 'error');
                }
            })
            .catch(error => {
                console.error('Error loading devices:', error);
                showNotification('Error loading map devices', 'error');
            });
    }

    // Render devices on map
    function renderDevicesOnMap(devices) {
        const mapDevicesLayer = document.getElementById('mapDevicesLayer');
        if (!mapDevicesLayer) return;

        // Clear existing markers
        markers = [];
        mapDevicesLayer.innerHTML = '';

        devices.forEach(device => {
            const marker = createDeviceMarker(device);
            mapDevicesLayer.appendChild(marker);
            markers.push({ element: marker, device: device });
        });
    }

    // Create device marker
    function createDeviceMarker(device) {
        const marker = document.createElement('div');
        marker.className = `device-marker ${device.category}`;
        marker.dataset.deviceId = device.id;
        marker.dataset.category = device.category;
        
        // Position marker based on coordinates (simplified for demo)
        const x = ((device.location.lng + 180) / 360) * 100;
        const y = ((90 - device.location.lat) / 180) * 100;
        
        marker.style.left = `${x}%`;
        marker.style.top = `${y}%`;
        
        marker.innerHTML = `
            <div class="marker-icon">
                <i class="fas fa-${getDeviceIcon(device.type)}"></i>
            </div>
            <div class="marker-popup hidden">
                <div class="popup-content">
                    <h4>${device.name}</h4>
                    <p class="device-type">${device.type}</p>
                    <p class="device-location">${device.location.lat.toFixed(4)}, ${device.location.lng.toFixed(4)}</p>
                    <p class="device-last-seen">Last seen: ${device.lastSeen}</p>
                    <div class="popup-actions">
                        <button onclick="trackDevice('${device.id}')" class="track-btn">
                            <i class="fas fa-crosshairs"></i> Track
                        </button>
                        <button onclick="getDirections('${device.id}')" class="directions-btn">
                            <i class="fas fa-route"></i> Directions
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add click event to show popup
        marker.addEventListener('click', function(e) {
            e.stopPropagation();
            hideAllPopups();
            const popup = this.querySelector('.marker-popup');
            popup.classList.remove('hidden');
        });

        return marker;
    }

    // Filter devices on map
    function filterDevicesOnMap(filter) {
        markers.forEach(marker => {
            const device = marker.device;
            const element = marker.element;
            
            let show = false;
            
            switch(filter) {
                case 'all':
                    show = true;
                    break;
                case 'my-devices':
                    show = device.category === 'my-device';
                    break;
                case 'groups':
                    show = device.category === 'group-device';
                    break;
                case 'friends':
                    show = device.category === 'friend-device';
                    break;
            }
            
            element.style.display = show ? 'block' : 'none';
        });
        
        updateDevicesList(getFilteredDevices(filter));
    }

    // Get filtered devices
    function getFilteredDevices(filter) {
        if (filter === 'all') return deviceData;
        
        return deviceData.filter(device => {
            switch(filter) {
                case 'my-devices':
                    return device.category === 'my-device';
                case 'groups':
                    return device.category === 'group-device';
                case 'friends':
                    return device.category === 'friend-device';
                default:
                    return true;
            }
        });
    }

    // Setup device panel
    function setupDevicePanel() {
        const panelToggleBtn = document.getElementById('panelToggleBtn');
        const devicePanel = document.getElementById('mapDevicePanel');
        const deviceSearchInput = document.getElementById('deviceSearchInput');

        if (panelToggleBtn && devicePanel) {
            panelToggleBtn.addEventListener('click', function() {
                devicePanel.classList.toggle('open');
                const icon = this.querySelector('i');
                
                if (devicePanel.classList.contains('open')) {
                    icon.className = 'fas fa-chevron-left';
                } else {
                    icon.className = 'fas fa-chevron-right';
                }
            });
        }

        if (deviceSearchInput) {
            deviceSearchInput.addEventListener('input', function() {
                const query = this.value.toLowerCase().trim();
                searchDevices(query);
            });
        }

        // Close panel on map click
        document.addEventListener('click', function(e) {
            if (!e.target.closest('#mapDevicePanel') && !e.target.closest('#panelToggleBtn')) {
                hideAllPopups();
            }
        });
    }

    // Update devices list in panel
    function updateDevicesList(devices) {
        const devicesList = document.getElementById('trackedDevicesList');
        if (!devicesList) return;

        if (devices.length === 0) {
            devicesList.innerHTML = `
                <div class="no-devices">
                    <i class="fas fa-search"></i>
                    <p>No devices found</p>
                </div>
            `;
            return;
        }

        const devicesHTML = devices.map(device => `
            <div class="tracked-device-item" data-device-id="${device.id}">
                <div class="device-marker-small ${device.category}"></div>
                <div class="device-info">
                    <h5>${device.name}</h5>
                    <p class="device-category">${getCategoryName(device.category)}</p>
                    <p class="device-coords">${device.location.lat.toFixed(4)}, ${device.location.lng.toFixed(4)}</p>
                </div>
                <div class="device-actions">
                    <button onclick="focusOnDevice('${device.id}')" title="Focus on map">
                        <i class="fas fa-crosshairs"></i>
                    </button>
                    <button onclick="trackDevice('${device.id}')" title="Track device">
                        <i class="fas fa-location-arrow"></i>
                    </button>
                </div>
            </div>
        `).join('');

        devicesList.innerHTML = devicesHTML;
    }

    // Search devices
    function searchDevices(query) {
        const filtered = deviceData.filter(device => 
            device.name.toLowerCase().includes(query) ||
            device.type.toLowerCase().includes(query) ||
            getCategoryName(device.category).toLowerCase().includes(query)
        );
        
        updateDevicesList(filtered);
        
        // Also filter markers on map
        markers.forEach(marker => {
            const device = marker.device;
            const element = marker.element;
            const matches = device.name.toLowerCase().includes(query) ||
                          device.type.toLowerCase().includes(query) ||
                          getCategoryName(device.category).toLowerCase().includes(query);
            
            element.style.display = matches ? 'block' : 'none';
        });
    }

    // Helper functions
    function getDeviceIcon(type) {
        switch(type) {
            case 'mobile': return 'mobile-alt';
            case 'tablet': return 'tablet-alt';
            case 'laptop': return 'laptop';
            case 'desktop': return 'desktop';
            default: return 'mobile-alt';
        }
    }

    function getCategoryName(category) {
        switch(category) {
            case 'my-device': return 'My Device';
            case 'group-device': return 'Group Device';
            case 'friend-device': return 'Friend Device';
            case 'individual-device': return 'Individual Device';
            default: return 'Unknown';
        }
    }

    function hideAllPopups() {
        const popups = document.querySelectorAll('.marker-popup');
        popups.forEach(popup => popup.classList.add('hidden'));
    }

    function centerMapToDevices() {
        showNotification('Centering map to show all devices', 'info');
        // In a real map implementation, this would center the view on all visible devices
    }

    function refreshDevices() {
        loadDevices();
        showNotification('Devices refreshed', 'success');
    }

    function toggleFullscreen() {
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
            if (!document.fullscreenElement) {
                mapContainer.requestFullscreen().catch(err => {
                    showNotification('Fullscreen not supported', 'error');
                });
            } else {
                document.exitFullscreen();
            }
        }
    }

    // Global functions for device actions
    window.trackDevice = function(deviceId) {
        showNotification(`Tracking device ${deviceId}`, 'success');
        // This would start real-time tracking for the device
    };

    window.getDirections = function(deviceId) {
        showNotification(`Getting directions to device ${deviceId}`, 'info');
        // This would open directions in a mapping service
    };

    window.focusOnDevice = function(deviceId) {
        const marker = markers.find(m => m.device.id === deviceId);
        if (marker) {
            hideAllPopups();
            const popup = marker.element.querySelector('.marker-popup');
            popup.classList.remove('hidden');
            
            // Scroll marker into view (simplified)
            marker.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            showNotification(`Focused on ${marker.device.name}`, 'success');
        }
    };

    // Notification function
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--accent)'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 0.9rem;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Initialize when map page is shown
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'map-page' && mutation.target.classList.contains('active')) {
                setTimeout(initializeLiveMap, 100);
            }
        });
    });

    const mapPage = document.getElementById('map-page');
    if (mapPage) {
        observer.observe(mapPage, { attributes: true, attributeFilter: ['class'] });
        
        // Initialize immediately if map page is already active
        if (mapPage.classList.contains('active')) {
            setTimeout(initializeLiveMap, 100);
        }
    }
});