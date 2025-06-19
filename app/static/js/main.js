document.addEventListener('DOMContentLoaded', function() {
    console.log('Main script loading...');

    // Get modal elements
    const modal = document.getElementById('addDeviceModal');
    const addDeviceBtns = document.querySelectorAll('.add-device-btn');
    const closeBtn = modal?.querySelector('.close');
    const nextBtn = modal?.querySelector('.btn-next');
    const prevBtn = modal?.querySelector('.btn-previous');
    const methodBtns = modal?.querySelectorAll('.method-btn');

    let currentStep = 1;
    const totalSteps = 3;
    let uniqueCode = '';
    let qrCodeInstance = null;

    // Add click handlers to all add device buttons
    addDeviceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (modal) {
                modal.style.display = 'block';
                resetSteps();
                console.log('Opening modal');
            }
        });
    });

    function generateUniqueCode(method) {
        console.log('Generating code for method:', method); // Debug log

        // Show loading state
        document.getElementById('step3Content').innerHTML = '<div class="loading">Generating code...</div>';

        fetch('/devices/generate-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        })
        .then(response => {
            console.log('Response status:', response.status); // Debug log
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Received data:', data); // Debug log

            if (data.success) {
                const step3Content = document.getElementById('step3Content');
                if (method === 'qr') {
                    step3Content.innerHTML = `
                        <div class="qr-container">
                            <img src="${data.qr_code}" alt="QR Code" class="qr-code">
                            <p class="mt-3">Scan this QR code using the UniLocator app</p>
                        </div>`;
                } else {
                    step3Content.innerHTML = `
                        <div class="code-container">
                            <div class="connection-code">${data.code}</div>
                            <p class="mt-3">Enter this code in your UniLocator app</p>
                        </div>`;
                }
            } else {
                throw new Error(data.error || 'Failed to generate code');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('step3Content').innerHTML = `
                <div class="error-message">
                    <p>Error generating code. Please try again.</p>
                    <small>${error.message}</small>
                </div>`;
        });
    }

    // Method selection handlers
    methodBtns?.forEach(btn => {
        btn.addEventListener('click', () => {
            methodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const method = btn.dataset.method;
            const qrMethod = modal.querySelector('.qr-method');
            const codeMethod = modal.querySelector('.code-method');
            
            if (method === 'qr') {
                qrMethod.classList.remove('hidden');
                codeMethod.classList.add('hidden');
            } else {
                qrMethod.classList.add('hidden');
                codeMethod.classList.remove('hidden');
            }
            
            // Generate code when method is selected
            generateUniqueCode(method);
            currentStep = 2;
            showStep(currentStep);
        });
    });

    // Next button handler
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                currentStep++;
                showStep(currentStep);
            }
        });
    }

    // Previous button handler
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                showStep(currentStep);
            }
        });
    }

    // Close button handler
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            resetSteps();
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            resetSteps();
        }
    });

    function showStep(step) {
        const steps = modal.querySelectorAll('.step');
        steps.forEach((s, index) => {
            s.classList.toggle('active', index + 1 === step);
        });
        
        prevBtn.disabled = step === 1;
        nextBtn.innerHTML = step === totalSteps ? 
            'Finish <i class="fas fa-check"></i>' : 
            'Next <i class="fas fa-arrow-right"></i>';
    }

    function resetSteps() {
        currentStep = 1;
        showStep(1);
        uniqueCode = '';
        
        const methodBtns = modal.querySelectorAll('.method-btn');
        methodBtns.forEach(btn => btn.classList.remove('active'));
        
        const qrMethod = modal.querySelector('.qr-method');
        const codeMethod = modal.querySelector('.code-method');
        if (qrMethod && codeMethod) {
            qrMethod.classList.add('hidden');
            codeMethod.classList.add('hidden');
        }

        // Clear QR code and connection code
        const qrContainer = document.getElementById('qrCode');
        const codeContainer = document.getElementById('connectionCode');
        if (qrContainer) qrContainer.innerHTML = '';
        if (codeContainer) codeContainer.textContent = '';
    }

    function connectDevice(deviceCode) {
        fetch('/connect-device', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ device_code: deviceCode })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log('Device connected successfully:', data.message);
                // Show success message to user
                alert('Device connected successfully!');
                // Optionally reload the page to show the new device
                window.location.reload();
            } else {
                console.error('Connection failed:', data.message);
                alert('Failed to connect device: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Connection error:', error);
            alert('Error connecting device. Please try again.');
        });
    }

    // Profile dropdown functionality
    const profileDropdown = document.querySelector('.profile-dropdown');
    if (profileDropdown) {
        profileDropdown.addEventListener('click', (e) => {
            const dropdownContent = profileDropdown.querySelector('.dropdown-content');
            if (dropdownContent) {
                dropdownContent.classList.toggle('show');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target)) {
                const dropdownContent = profileDropdown.querySelector('.dropdown-content');
                if (dropdownContent && dropdownContent.classList.contains('show')) {
                    dropdownContent.classList.remove('show');
                }
            }
        });
    }

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
        `;
        devicesGrid.appendChild(deviceCard);
    }

    // Listen for new devices
    socket.on('device_added', function(device) {
        console.log('New device added:', device);
        addDeviceToUI(device);
    });

    console.log('Main script initialized');
});