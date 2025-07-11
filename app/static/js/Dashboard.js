document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Initialize modal immediately - don't wait for QRCode
    initializeAddDeviceModal();
    initializeDashboard();
    
    // Check QRCode library availability separately
    function checkQRCode() {
        if (typeof QRCode !== 'undefined') {
            console.log('QRCode library loaded successfully');
        } else {
            console.log('QRCode library not available - QR codes will show fallback');
        }
    }
    
    // Check after a short delay
    setTimeout(checkQRCode, 1000);
});

// Add Device Modal System - Modern Implementation
function initializeAddDeviceModal() {
    console.log('Initializing add device modal...');
    
    const modal = document.getElementById('addDeviceModal');
    const addDeviceBtns = document.querySelectorAll('.add-device-btn');
    const closeBtn = modal?.querySelector('.close');
    const modalContent = modal?.querySelector('.modal-content');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');
    
    console.log('Modal elements found:', {
        modal: !!modal,
        addDeviceBtns: addDeviceBtns.length,
        closeBtn: !!closeBtn,
        modalBody: !!modalBody,
        modalFooter: !!modalFooter
    });
    
    if (addDeviceBtns.length === 0) {
        console.error('No add device buttons found! Retrying in 1 second...');
        setTimeout(initializeAddDeviceModal, 1000);
        return;
    }
    
    if (!modal) {
        console.error('Modal not found! Check HTML structure.');
        return;
    }
    
    let currentStep = 1;
    const totalSteps = 3;
    let selectedConnectionMethod = null;
    let qrGenerated = false;
    
    // Open modal when add device button is clicked
    console.log('Setting up event listeners for', addDeviceBtns.length, 'add device buttons');
    addDeviceBtns.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Add device button clicked - opening modal');
            openModal();
        });
    });
    
    // Close modal
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    function openModal() {
        console.log('Opening modal...');
        
        if (modal) {
            modal.classList.add('show');
            currentStep = 1;
            qrGenerated = false;
            selectedConnectionMethod = null;
            showStep(currentStep);
            console.log('Modal opened successfully');
        } else {
            console.error('Modal element not found');
        }
    }
    
    function closeModal() {
        if (modal) {
            modal.classList.remove('show');
            currentStep = 1;
            qrGenerated = false;
            selectedConnectionMethod = null;
        }
    }
    
    function showStep(step) {
        // Add smooth transition
        if (modalBody && modalContent) {
            modalBody.style.opacity = '0.7';
            modalBody.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                switch(step) {
                    case 1:
                        showStep1();
                        break;
                    case 2:
                        showStep2();
                        break;
                    case 3:
                        showStep3();
                        break;
                }
                updateFooter(step);
                adjustModalSize(step);
                
                // Smooth fade in
                setTimeout(() => {
                    modalBody.style.opacity = '1';
                    modalBody.style.transform = 'translateY(0)';
                }, 50);
            }, 200);
        }
    }
    
    function adjustModalSize(step) {
        if (!modalContent) return;
        
        const sizes = {
            1: { width: '520px', height: 'auto' },
            2: { width: '480px', height: 'auto' },
            3: { width: '450px', height: 'auto' }
        };
        
        const size = sizes[step];
        modalContent.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        modalContent.style.maxWidth = size.width;
    }
    
    function showStep1() {
        const githubUrl = 'https://github.com/himaanshuuyadav/unilocator/releases/latest';
        
        modalBody.innerHTML = `
            <div class="step-content">
                <div class="step-title">Download UniLocator App</div>
                <div class="step-description">Scan the QR code or download directly to get the UniLocator app</div>
                
                <div id="qrSection" class="transform-container">
                    <div class="qr-container">
                        <div id="githubQR" class="qr-code"></div>
                    </div>
                    <p style="color: #ccc; font-size: 0.85rem; margin: 12px 0;">Scan with your phone's camera</p>
                    <button class="download-secondary-btn" id="directDownload">
                        <i class="fas fa-download"></i>
                        Download APK Here
                    </button>
                </div>
                
                <div id="downloadSection" class="transform-container hidden">
                    <p style="color: #ccc; margin-bottom: 16px;">Click below to download the APK file</p>
                    <a href="${githubUrl}" target="_blank" class="download-primary-btn">
                        <i class="fab fa-android"></i>
                        Download APK Now
                    </a>
                </div>
            </div>
        `;
        
        // Generate QR code immediately
        generateGitHubQR(githubUrl);
        
        // Add event listeners for the download flow
        setupDownloadFlow();
    }
    
    function setupDownloadFlow() {
        const qrSection = document.getElementById('qrSection');
        const downloadSection = document.getElementById('downloadSection');
        const directDownload = document.getElementById('directDownload');
        
        if (directDownload) {
            directDownload.addEventListener('click', () => {
                // Smooth transition from QR to download button
                qrSection.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                qrSection.style.opacity = '0';
                qrSection.style.transform = 'translateY(-20px)';
                
                setTimeout(() => {
                    qrSection.classList.add('hidden');
                    downloadSection.classList.remove('hidden');
                    downloadSection.style.opacity = '0';
                    downloadSection.style.transform = 'translateY(20px)';
                    
                    setTimeout(() => {
                        downloadSection.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                        downloadSection.style.opacity = '1';
                        downloadSection.style.transform = 'translateY(0)';
                    }, 100);
                }, 400);
            });
        }
    }
    
    function generateGitHubQR(url) {
        console.log('generateGitHubQR called with URL:', url);
        const qrContainer = document.getElementById('githubQR');
        if (!qrContainer) {
            console.error('QR container "githubQR" not found');
            return;
        }
        
        // Clear container
        qrContainer.innerHTML = '';
        
        // Check if QRCode library is available
        if (typeof QRCode === 'undefined') {
            console.warn('QRCode library not loaded - showing fallback');
            qrContainer.innerHTML = `
                <div style="background: #fff; padding: 20px; border-radius: 8px; text-align: center;">
                    <p style="color: #666; margin-bottom: 10px;">QR Code not available</p>
                    <a href="${url}" target="_blank" style="color: #047a39; font-weight: 600;">Click here to download</a>
                </div>
            `;
            return;
        }
        
        try {
            // Create canvas element
            const canvas = document.createElement('canvas');
            qrContainer.appendChild(canvas);
            
            // Generate QR code using promise-based approach
            QRCode.toCanvas(canvas, url, {
                width: 180,
                height: 180,
                color: {
                    dark: '#047a39',
                    light: '#ffffff'
                },
                margin: 2,
                errorCorrectionLevel: 'M'
            }).then(() => {
                console.log('GitHub QR Code generated successfully');
                qrGenerated = true;
            }).catch((error) => {
                console.error('QR Code generation failed:', error);
                // Fallback to text
                qrContainer.innerHTML = `
                    <div style="background: #fff; padding: 20px; border-radius: 8px; text-align: center;">
                        <p style="color: #666; margin-bottom: 10px;">QR generation failed</p>
                        <a href="${url}" target="_blank" style="color: #047a39; font-weight: 600;">Click here to download</a>
                    </div>
                `;
            });
        } catch (error) {
            console.error('QR generation error:', error);
            qrContainer.innerHTML = `
                <div style="background: #fff; padding: 20px; border-radius: 8px; text-align: center;">
                    <p style="color: #666; margin-bottom: 10px;">QR generation error</p>
                    <a href="${url}" target="_blank" style="color: #047a39; font-weight: 600;">Click here to download</a>
                </div>
            `;
        }
    }
    
    function showStep2() {
        modalBody.innerHTML = `
            <div class="step-content">
                <div class="step-title">Choose Connection Method</div>
                <div class="step-description">How would you like to connect your device?</div>
                
                <div class="connection-methods">
                    <button class="connection-method-btn" data-method="qr">
                        <i class="fas fa-qrcode"></i>
                        <span>QR Code</span>
                        <small>Scan QR code with your device</small>
                    </button>
                    <button class="connection-method-btn" data-method="code">
                        <i class="fas fa-keyboard"></i>
                        <span>Enter Code</span>
                        <small>Manually enter pairing code</small>
                    </button>
                </div>
            </div>
        `;
        
        // Add click handlers for connection methods
        const methodBtns = modalBody.querySelectorAll('.connection-method-btn');
        methodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                methodBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                selectedConnectionMethod = btn.dataset.method;
            });
        });
    }
    
    function showStep3() {
        if (selectedConnectionMethod === 'qr') {
            showQRStep();
        } else {
            showCodeStep();
        }
    }
    
    function showQRStep() {
        modalBody.innerHTML = `
            <div class="step-content">
                <div class="step-title">Scan QR Code</div>
                <div class="step-description">Open the UniLocator app and scan this QR code to connect</div>
                
                <div class="qr-container">
                    <div id="connectionQR" class="qr-code"></div>
                </div>
                
                <p style="color: #ccc; font-size: 0.85rem; margin-top: 16px;">
                    The QR code will refresh automatically every 2 minutes
                </p>
            </div>
        `;
        
        generateConnectionQR();
    }
    
    function showCodeStep() {
        const code = generatePairingCode();
        
        modalBody.innerHTML = `
            <div class="step-content">
                <div class="step-title">Enter Pairing Code</div>
                <div class="step-description">Open the UniLocator app and enter this code to connect</div>
                
                <div class="connection-code">
                    <div class="code-display">${code}</div>
                    <div class="code-description">Enter this code in the app</div>
                </div>
                
                <p style="color: #ccc; font-size: 0.85rem; margin-top: 16px;">
                    Code expires in 10 minutes
                </p>
            </div>
        `;
    }
    
    function generateConnectionQR() {
        const qrContainer = document.getElementById('connectionQR');
        if (!qrContainer) return;
        
        // Clear container
        qrContainer.innerHTML = '';
        
        // Generate connection data
        const connectionData = {
            type: 'unilocator_connection',
            server: window.location.origin,
            code: generatePairingCode(),
            timestamp: Date.now()
        };
        
        // Check if QRCode library is available
        if (typeof QRCode === 'undefined') {
            console.error('QRCode library not loaded');
            qrContainer.innerHTML = `<p style="color: #666; padding: 20px;">QR library not available. Use manual code instead.</p>`;
            return;
        }
        
        // Create canvas element
        const canvas = document.createElement('canvas');
        qrContainer.appendChild(canvas);
        
        // Generate QR code using promise-based approach
        QRCode.toCanvas(canvas, JSON.stringify(connectionData), {
            width: 180,
            height: 180,
            color: {
                dark: '#047a39',
                light: '#ffffff'
            },
            margin: 2,
            errorCorrectionLevel: 'M'
        }).then(() => {
            console.log('Connection QR Code generated successfully');
        }).catch((error) => {
            console.error('Connection QR Code generation failed:', error);
            // Fallback to text
            qrContainer.innerHTML = `<p style="color: #666; padding: 20px;">QR generation failed. Use manual code instead.</p>`;
        });
    }
    
    function generatePairingCode() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }
    
    function updateFooter(step) {
        if (!modalFooter) return;
        
        if (step === 1) {
            // Only Next button on the right
            modalFooter.innerHTML = `
                <div></div>
                <button class="btn btn-primary" id="nextBtn">
                    Next
                    <i class="fas fa-arrow-right"></i>
                </button>
            `;
        } else if (step === 2) {
            // Previous on left, Next on right
            modalFooter.innerHTML = `
                <button class="btn btn-secondary" id="prevBtn">
                    <i class="fas fa-arrow-left"></i>
                    Previous
                </button>
                <button class="btn btn-primary" id="nextBtn" ${!selectedConnectionMethod ? 'disabled' : ''}>
                    Next
                    <i class="fas fa-arrow-right"></i>
                </button>
            `;
        } else if (step === 3) {
            // Previous on left, Done on right
            modalFooter.innerHTML = `
                <button class="btn btn-secondary" id="prevBtn">
                    <i class="fas fa-arrow-left"></i>
                    Previous
                </button>
                <button class="btn btn-primary" id="finishBtn">
                    <i class="fas fa-check"></i>
                    Done
                </button>
            `;
        }
        
        // Add event listeners
        const prevBtn = modalFooter.querySelector('#prevBtn');
        const nextBtn = modalFooter.querySelector('#nextBtn');
        const finishBtn = modalFooter.querySelector('#finishBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentStep > 1) {
                    currentStep--;
                    showStep(currentStep);
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentStep < totalSteps && (currentStep !== 2 || selectedConnectionMethod)) {
                    currentStep++;
                    showStep(currentStep);
                }
            });
        }
        
        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                closeModal();
            });
        }
        
        // Update next button state on step 2
        if (step === 2) {
            const methodBtns = modalBody.querySelectorAll('.connection-method-btn');
            methodBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const nextButton = modalFooter.querySelector('#nextBtn');
                    if (nextButton) {
                        nextButton.disabled = false;
                    }
                });
            });
        }
    }
}

// Dashboard functionality
function initializeDashboard() {
    // Toggle active state for nav items
    const navItems = document.querySelectorAll('.nav-links li');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Initialize logout functionality
    initializeLogout();

    // Simulate real-time updates (for demo purposes) - Disabled to prevent errors
    // Only enable if dashboard stats and activity elements exist
    const hasStatsElements = document.querySelectorAll('.stat-number').length > 0;
    const hasActivityList = document.querySelector('.activity-list') !== null;
    
    if (hasStatsElements && hasActivityList) {
        setInterval(() => {
            updateRandomStats();
            addRandomActivity();
        }, 5000);
    } else {
        console.log('Dashboard simulation disabled - missing required elements');
    }
}

function updateRandomStats() {
    const numbers = document.querySelectorAll('.stat-number');
    
    if (numbers.length === 0) {
        console.log('No stat numbers found, skipping update');
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * numbers.length);
    const element = numbers[randomIndex];
    
    if (!element || !element.textContent) {
        console.log('Invalid stat element, skipping update');
        return;
    }
    
    const randomChange = Math.floor(Math.random() * 5) + 1;
    const currentNumber = parseInt(element.textContent) || 0;
    element.textContent = currentNumber + randomChange;
}

function addRandomActivity() {
    const activities = [
        'Device "iPhone 13" updated location',
        'Low battery alert: "Galaxy A03"',
        'New device connected',
        'Location history updated'
    ];

    const activityList = document.querySelector('.activity-list');
    
    if (!activityList) {
        console.log('Activity list not found, skipping activity update');
        return;
    }
    
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    
    const newActivity = document.createElement('div');
    newActivity.className = 'activity-item';
    newActivity.innerHTML = `
        <i class="fas fa-location-dot"></i>
        <div class="activity-details">
            <p>${randomActivity}</p>
            <span>Just now</span>
        </div>
    `;

    activityList.insertBefore(newActivity, activityList.firstChild);
    
    // Remove oldest activity if more than 5
    if (activityList.children.length > 5) {
        activityList.removeChild(activityList.lastChild);
    }
}

// Logout functionality
function initializeLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Show confirmation dialog
            if (confirm('Are you sure you want to logout?')) {
                performLogout();
            }
        });
    }
}

function performLogout() {
    // Show loading state
    const logoutBtn = document.getElementById('logoutBtn');
    const originalText = logoutBtn.innerHTML;
    
    logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
    logoutBtn.disabled = true;
    
    // Send logout request to server
    fetch('/auth/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (response.ok) {
            // Clear any client-side storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Redirect to login page
            window.location.href = '/auth/login';
        } else {
            throw new Error('Logout failed');
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
        alert('Logout failed. Please try again.');
        
        // Restore button state
        logoutBtn.innerHTML = originalText;
        logoutBtn.disabled = false;
    });
}