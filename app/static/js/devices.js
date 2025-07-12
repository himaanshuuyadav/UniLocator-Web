// Enhanced Devices Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Devices page script loaded');
    
    // Initialize devices page when it becomes active
    function initializeDevicesPage() {
        setupQuickActions();
        setupDeviceFilters();
        loadMyDevices();
        loadIndividualDevices();
        loadGroups();
        setupDeviceEventHandlers();
    }

    // Quick Actions Setup
    function setupQuickActions() {
        const addDeviceBtn = document.getElementById('addDeviceBtn');
        const createGroupBtn = document.getElementById('createGroupBtn');
        const scanQRBtn = document.getElementById('scanQRBtn');

        if (addDeviceBtn) {
            addDeviceBtn.addEventListener('click', handleAddDevice);
        }

        if (createGroupBtn) {
            createGroupBtn.addEventListener('click', handleCreateGroup);
        }

        if (scanQRBtn) {
            scanQRBtn.addEventListener('click', handleScanQR);
        }
    }

    // Device Filters Setup
    function setupDeviceFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active to clicked button
                this.classList.add('active');
                
                const filter = this.dataset.filter;
                filterDevices(filter);
            });
        });
    }

    // Load My Devices
    function loadMyDevices() {
        const myDevicesGrid = document.getElementById('myDevicesGrid');
        const myDevicesCount = document.getElementById('myDevicesCount');
        
        if (!myDevicesGrid) return;

        // Show loading state
        myDevicesGrid.innerHTML = `
            <div class="loading-placeholder">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading your devices...</span>
            </div>
        `;

        // Simulate API call to load devices
        setTimeout(() => {
            const devices = [
                {
                    id: 'dev001',
                    name: 'My iPhone',
                    type: 'mobile',
                    status: 'online',
                    lastSeen: '2 minutes ago',
                    battery: 85,
                    location: { lat: 40.7128, lng: -74.0060 }
                },
                {
                    id: 'dev002',
                    name: 'My iPad',
                    type: 'tablet',
                    status: 'offline',
                    lastSeen: '2 hours ago',
                    battery: 42,
                    location: { lat: 40.7580, lng: -73.9855 }
                }
            ];

            renderDevices(devices, myDevicesGrid);
            
            if (myDevicesCount) {
                myDevicesCount.textContent = `${devices.length} device${devices.length !== 1 ? 's' : ''}`;
            }
        }, 1000);
    }

    // Load Individual Devices
    function loadIndividualDevices() {
        const individualDevicesGrid = document.getElementById('individualDevicesGrid');
        const individualDevicesCount = document.getElementById('individualDevicesCount');
        
        if (!individualDevicesGrid) return;

        // Simulate empty state initially
        setTimeout(() => {
            const devices = []; // No individual devices initially
            
            if (devices.length === 0) {
                individualDevicesGrid.innerHTML = `
                    <div class="empty-state-mini">
                        <i class="fas fa-mobile-alt"></i>
                        <p>No individual devices added yet</p>
                        <button class="add-device-btn-mini" onclick="handleAddDevice()">Add Device</button>
                    </div>
                `;
            } else {
                renderDevices(devices, individualDevicesGrid);
            }
            
            if (individualDevicesCount) {
                individualDevicesCount.textContent = `${devices.length} device${devices.length !== 1 ? 's' : ''}`;
            }
        }, 500);
    }

    // Load Groups
    function loadGroups() {
        const groupsGrid = document.getElementById('groupsGrid');
        const groupsCount = document.getElementById('groupsCount');
        
        if (!groupsGrid) return;

        // Simulate empty state initially
        setTimeout(() => {
            const groups = []; // No groups initially
            
            if (groups.length === 0) {
                groupsGrid.innerHTML = `
                    <div class="empty-state-mini">
                        <i class="fas fa-users"></i>
                        <p>No groups created yet</p>
                        <button class="create-group-btn-mini" onclick="handleCreateGroup()">Create Group</button>
                    </div>
                `;
            } else {
                renderGroups(groups, groupsGrid);
            }
            
            if (groupsCount) {
                groupsCount.textContent = `${groups.length} group${groups.length !== 1 ? 's' : ''}`;
            }
        }, 750);
    }

    // Render Devices
    function renderDevices(devices, container) {
        if (devices.length === 0) {
            container.innerHTML = `
                <div class="empty-state-mini">
                    <i class="fas fa-mobile-alt"></i>
                    <p>No devices found</p>
                </div>
            `;
            return;
        }

        const devicesHTML = devices.map(device => `
            <div class="device-card" data-device-id="${device.id}" data-status="${device.status}">
                <div class="device-card-header">
                    <div class="device-info">
                        <div class="device-icon">
                            <i class="fas fa-${getDeviceIcon(device.type)}"></i>
                        </div>
                        <div class="device-details">
                            <h3 class="device-name">${device.name}</h3>
                            <div class="device-status-badge ${device.status}">
                                <i class="fas fa-circle"></i>
                                <span>${device.status === 'online' ? 'Online' : 'Offline'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="device-actions">
                        <button class="device-menu-btn" onclick="toggleDeviceMenu('${device.id}')">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="device-menu-dropdown hidden" id="menu-${device.id}">
                            <button onclick="editDevice('${device.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button onclick="trackDevice('${device.id}')">
                                <i class="fas fa-location-arrow"></i> Track
                            </button>
                            <button onclick="removeDevice('${device.id}')" class="danger">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="device-card-body">
                    <div class="device-stat">
                        <i class="fas fa-clock"></i>
                        <div class="stat-info">
                            <span class="stat-label">Last Seen</span>
                            <span class="stat-value">${device.lastSeen}</span>
                        </div>
                    </div>
                    
                    <div class="device-stat">
                        <i class="fas fa-battery-${getBatteryIcon(device.battery)}"></i>
                        <div class="stat-info">
                            <span class="stat-label">Battery</span>
                            <span class="stat-value">${device.battery}%</span>
                        </div>
                    </div>
                    
                    <div class="device-stat">
                        <i class="fas fa-map-marker-alt"></i>
                        <div class="stat-info">
                            <span class="stat-label">Location</span>
                            <span class="stat-value">${device.location.lat.toFixed(4)}, ${device.location.lng.toFixed(4)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="device-card-footer">
                    <button class="track-btn" onclick="trackDevice('${device.id}')">
                        <i class="fas fa-location-arrow"></i>
                        Track Device
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = devicesHTML;
    }

    // Filter Devices
    function filterDevices(filter) {
        const deviceCards = document.querySelectorAll('.device-card');
        
        deviceCards.forEach(card => {
            const status = card.dataset.status;
            
            switch(filter) {
                case 'all':
                    card.style.display = 'block';
                    break;
                case 'online':
                    card.style.display = status === 'online' ? 'block' : 'none';
                    break;
                case 'offline':
                    card.style.display = status === 'offline' ? 'block' : 'none';
                    break;
            }
        });
    }

    // Event Handlers Setup
    function setupDeviceEventHandlers() {
        // Add individual device button
        const addIndividualDeviceBtn = document.getElementById('addIndividualDeviceBtn');
        if (addIndividualDeviceBtn) {
            addIndividualDeviceBtn.addEventListener('click', handleAddDevice);
        }

        // Create group main button
        const createGroupMainBtn = document.getElementById('createGroupMainBtn');
        if (createGroupMainBtn) {
            createGroupMainBtn.addEventListener('click', handleCreateGroup);
        }
    }

    // Helper Functions
    function getDeviceIcon(type) {
        switch(type) {
            case 'mobile': return 'mobile-alt';
            case 'tablet': return 'tablet-alt';
            case 'laptop': return 'laptop';
            case 'desktop': return 'desktop';
            default: return 'mobile-alt';
        }
    }

    function getBatteryIcon(battery) {
        if (battery >= 75) return 'full';
        if (battery >= 50) return 'three-quarters';
        if (battery >= 25) return 'half';
        if (battery >= 10) return 'quarter';
        return 'empty';
    }

    // Action Handlers
    window.handleAddDevice = function() {
        showNotification('Add Device functionality will be implemented', 'info');
        // This would open the existing add device modal
        const addDeviceModal = document.getElementById('addDeviceModal');
        if (addDeviceModal) {
            addDeviceModal.classList.add('show');
        }
    };

    window.handleCreateGroup = function() {
        showCreateGroupModal();
    };

    window.handleScanQR = function() {
        showNotification('QR Scanner functionality will be implemented', 'info');
    };

    window.toggleDeviceMenu = function(deviceId) {
        const menu = document.getElementById(`menu-${deviceId}`);
        if (menu) {
            menu.classList.toggle('hidden');
            menu.classList.toggle('show');
        }
    };

    window.editDevice = function(deviceId) {
        showNotification(`Edit device ${deviceId} functionality will be implemented`, 'info');
    };

    window.trackDevice = function(deviceId) {
        showNotification(`Tracking device ${deviceId}`, 'success');
        // This would redirect to the map page with the device highlighted
    };

    window.removeDevice = function(deviceId) {
        if (confirm('Are you sure you want to remove this device?')) {
            showNotification(`Device ${deviceId} removed successfully`, 'success');
            // Remove device from UI
            const deviceCard = document.querySelector(`[data-device-id="${deviceId}"]`);
            if (deviceCard) {
                deviceCard.remove();
            }
        }
    };

    // Create Group Modal
    function showCreateGroupModal() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Create New Group</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Group Name</label>
                        <input type="text" id="groupName" placeholder="Enter group name..." required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="groupDescription" placeholder="Group description (optional)..." rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Privacy</label>
                        <select id="groupPrivacy">
                            <option value="private">Private</option>
                            <option value="invite-only">Invite Only</option>
                            <option value="public">Public</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="createGroup()">Create Group</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    window.createGroup = function() {
        const groupName = document.getElementById('groupName').value;
        const groupDescription = document.getElementById('groupDescription').value;
        const groupPrivacy = document.getElementById('groupPrivacy').value;
        
        if (!groupName.trim()) {
            showNotification('Group name is required', 'error');
            return;
        }
        
        // Simulate group creation
        showNotification(`Group "${groupName}" created successfully!`, 'success');
        
        // Close modal
        const modal = document.querySelector('.modal.show');
        if (modal) {
            modal.remove();
        }
        
        // Refresh groups list
        loadGroups();
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

    // Initialize devices page
    initializeDevicesPage();
});