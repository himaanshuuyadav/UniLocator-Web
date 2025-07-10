document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard script loading...');

    // Initialize Socket.IO with proper configuration
    const socket = io({
        transports: ['polling', 'websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    // Connection event handlers
    socket.on('connect', () => {
        console.log('Successfully connected to server');
        document.dispatchEvent(new CustomEvent('socketConnected'));
    });

    socket.on('server_status', (data) => {
        console.log('Server status:', data);
    });

    socket.on('device_connected', (data) => {
        console.log('New device connected:', data);
        addDeviceToUI(data);
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
    });

    function addDeviceToUI(device) {
        const devicesGrid = document.querySelector('.devices-grid');
        if (!devicesGrid) return;

        const deviceCard = document.createElement('div');
        deviceCard.className = 'device-card';
        deviceCard.dataset.deviceId = device.id;
        deviceCard.innerHTML = `
            <div class="device-header">
                <h3>${device.device_name}</h3>
                <span class="device-status">Connected</span>
            </div>
            <div class="device-info">
                <p><i class="fas fa-qrcode"></i> ID: ${device.device_code}</p>
                <p><i class="fas fa-clock"></i> Added: Just now</p>
            </div>
            <div class="device-actions">
                <button class="device-menu-btn"><i class="fas fa-ellipsis-v"></i></button>
                <div class="device-menu-dropdown">
                    <button class="remove-device-btn" data-device-code="${device.device_code}">Remove Device</button>
                </div>
            </div>
        `;
        devicesGrid.appendChild(deviceCard);
    }

    // Listen for new devices
    socket.on('device_added', function(device) {
        console.log('New device added:', device);
        addDeviceToUI(device);
    });

    // Device 3-dot menu functionality
    const deviceCards = document.querySelectorAll('.device-card');
    deviceCards.forEach(card => {
        const menuBtn = card.querySelector('.device-menu-btn');
        const menuDropdown = card.querySelector('.device-menu-dropdown');
        if (menuBtn && menuDropdown) {
            menuBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                // Close all other open menus
                document.querySelectorAll('.device-actions.open').forEach(el => {
                    if (el !== menuBtn.parentElement) el.classList.remove('open');
                });
                menuBtn.parentElement.classList.toggle('open');
            });
            // Close menu when clicking outside
            document.addEventListener('click', function(e) {
                if (!card.contains(e.target)) {
                    menuBtn.parentElement.classList.remove('open');
                }
            });
        }
    });

    // Remove device functionality
    const removeDeviceBtns = document.querySelectorAll('.remove-device-btn');
    removeDeviceBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const deviceCode = this.getAttribute('data-device-code');
            if (confirm('Are you sure you want to remove this device?')) {
                fetch('/devices/remove-device', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({ device_code: deviceCode })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        this.closest('.device-card').remove();
                        alert('Device removed successfully!');
                    } else {
                        alert('Failed to remove device: ' + data.message);
                    }
                })
                .catch(error => {
                    alert('Error removing device. Please try again.');
                    console.error(error);
                });
            }
            // Close the menu after action
            this.closest('.device-actions').classList.remove('open');
        });
    });

    console.log('Dashboard script initialized');
});