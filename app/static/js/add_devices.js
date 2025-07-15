/* ====================
   ADD DEVICE MODAL JAVASCRIPT
   ==================== */

console.log('Add Device Modal script loading...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing Add Device Modal');
    
    // Modal elements
    const modal = document.getElementById('addDeviceModal');
    if (!modal) {
        console.error('Add Device Modal not found');
        return;
    }
    
    const modalClose = modal.querySelector('.modal-close');
    const addDeviceBtn = document.getElementById('addDeviceBtn');
    const prevBtn = document.getElementById('modalPrevBtn');
    const nextBtn = document.getElementById('modalNextBtn');
    
    // Log element availability
    console.log('Elements found:', {
        modal: !!modal,
        modalClose: !!modalClose,
        addDeviceBtn: !!addDeviceBtn,
        prevBtn: !!prevBtn,
        nextBtn: !!nextBtn
    });
    
    // Step containers
    const stepContainers = modal.querySelectorAll('.step-container');
    
    // Method selection
    const methodOptions = modal.querySelectorAll('.method-option');
    
    // Connection display elements
    const connectionQrCode = document.getElementById('connectionQrCode');
    const connectionCodeDisplay = document.getElementById('connectionCodeDisplay');
    const refreshTimer = document.getElementById('refreshTimer');
    
    // Modal state
    let currentStep = 1;
    let selectedMethod = null;
    let currentCode = null;
    let refreshInterval = null;
    let timerInterval = null;
    let timeRemaining = 120;
    
    // GitHub releases URL for QR code
    const GITHUB_RELEASES_URL = 'https://github.com/himaanshuuyadav/Unilocator/releases';
    
    console.log('Add Device Modal initialized');
    
    // Event Listeners with error handling
    if (addDeviceBtn) {
        addDeviceBtn.addEventListener('click', function(e) {
            console.log('Add Device button clicked');
            e.preventDefault();
            openModal();
        });
    } else {
        console.warn('Add Device button not found');
    }
    
    if (modalClose) {
        modalClose.addEventListener('click', function(e) {
            console.log('Close button clicked');
            e.preventDefault();
            closeModal();
        });
    } else {
        console.warn('Modal close button not found');
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            console.log('Previous button clicked');
            e.preventDefault();
            goToPreviousStep();
        });
    } else {
        console.warn('Previous button not found');
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            console.log('Next button clicked');
            e.preventDefault();
            goToNextStep();
        });
    } else {
        console.warn('Next button not found');
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });
    
    // Method selection handlers
    methodOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            console.log('Method option clicked:', this.dataset.method);
            e.preventDefault();
            selectMethod(this.dataset.method);
        });
    });
    
    // Connection code click to copy
    if (connectionCodeDisplay) {
        connectionCodeDisplay.addEventListener('click', function() {
            if (currentCode) {
                copyToClipboard(currentCode);
            }
        });
    }
    
    /**
     * Open the modal and initialize first step
     */
    function openModal() {
        console.log('Opening Add Device Modal - Function Called');
        console.log('Modal element:', modal);
        console.log('Modal classes before:', modal.className);
        
        // Reset modal state
        currentStep = 1;
        selectedMethod = null;
        currentCode = null;
        
        // Show modal
        modal.classList.add('show');
        console.log('Modal classes after adding show:', modal.className);
        
        // Initialize first step
        showStep(1);
        generateGitHubQR();
        
        // Clear any existing intervals
        clearRefreshTimer();
        
        console.log('Modal should now be visible');
    }
    
    /**
     * Close the modal and cleanup
     */
    function closeModal() {
        console.log('Closing Add Device Modal');
        
        modal.classList.remove('show');
        
        // Cleanup intervals
        clearRefreshTimer();
        
        // Reset state after animation
        setTimeout(() => {
            resetModal();
        }, 300);
    }
    
    /**
     * Reset modal to initial state
     */
    function resetModal() {
        currentStep = 1;
        selectedMethod = null;
        currentCode = null;
        
        // Clear stored QR URL
        window.currentConnectionQR = null;
        
        // Clear method selections
        methodOptions.forEach(option => {
            option.classList.remove('selected');
        });
        
        // Clear generated content
        if (connectionQrCode) connectionQrCode.innerHTML = '';
        if (connectionCodeDisplay) connectionCodeDisplay.textContent = '';
        
        // Reset container visibility
        if (connectionQrCode && connectionQrCode.parentElement) {
            connectionQrCode.parentElement.style.display = 'block';
        }
        if (connectionCodeDisplay && connectionCodeDisplay.parentElement) {
            connectionCodeDisplay.parentElement.style.display = 'block';
        }
        
        showStep(1);
    }
    
    /**
     * Show specific step with animation
     */
    function showStep(step) {
        console.log(`Showing step ${step}`);
        
        currentStep = step;
        
        // Update step containers
        stepContainers.forEach((container, index) => {
            const stepNumber = index + 1;
            
            if (stepNumber === step) {
                container.classList.add('active');
                container.classList.remove('exit-left', 'enter-right');
            } else {
                container.classList.remove('active');
                if (stepNumber < step) {
                    container.classList.add('exit-left');
                    container.classList.remove('enter-right');
                } else {
                    container.classList.add('enter-right');
                    container.classList.remove('exit-left');
                }
            }
        });
        
        // Update button states
        updateButtons();
        
        // Step-specific logic
        if (step === 3) {
            // If we already have a code and method, just update display
            if (currentCode && selectedMethod) {
                updateConnectionDisplay();
                resetTimer();
            } else {
                // Generate new code
                generateConnectionCode();
            }
            startRefreshTimer();
        } else if (step === 2) {
            // Ensure method selection is preserved visually
            if (selectedMethod) {
                methodOptions.forEach(option => {
                    if (option.dataset.method === selectedMethod) {
                        option.classList.add('selected');
                    } else {
                        option.classList.remove('selected');
                    }
                });
            }
            clearRefreshTimer();
        } else {
            clearRefreshTimer();
        }
    }
    
    /**
     * Update button states based on current step
     */
    function updateButtons() {
        // Previous button
        if (prevBtn) {
            prevBtn.disabled = currentStep === 1;
        }
        
        // Next button
        if (nextBtn) {
            if (currentStep === 2) {
                // Step 2: Check if method is selected
                nextBtn.disabled = !selectedMethod;
                nextBtn.innerHTML = '<span>Next</span> <i class="fas fa-arrow-right"></i>';
            } else if (currentStep === 3) {
                // Step 3: Show close button
                nextBtn.disabled = false;
                nextBtn.innerHTML = '<span>Close</span> <i class="fas fa-times"></i>';
            } else {
                // Step 1: Always enabled
                nextBtn.disabled = false;
                nextBtn.innerHTML = '<span>Next</span> <i class="fas fa-arrow-right"></i>';
            }
        }
    }
    
    /**
     * Go to previous step
     */
    function goToPreviousStep() {
        if (currentStep > 1) {
            showStep(currentStep - 1);
        }
    }
    
    /**
     * Go to next step
     */
    function goToNextStep() {
        if (currentStep === 3) {
            closeModal();
        } else if (currentStep === 2 && !selectedMethod) {
            // Don't proceed if no method selected
            return;
        } else if (currentStep < 3) {
            showStep(currentStep + 1);
        }
    }
    
    /**
     * Select connection method
     */
    function selectMethod(method) {
        console.log(`Selected method: ${method}`);
        
        selectedMethod = method;
        
        // Update UI
        methodOptions.forEach(option => {
            if (option.dataset.method === method) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
        
        // Update button state
        updateButtons();
        
        // If we're on step 3 and have a current code, update the display
        if (currentStep === 3 && currentCode) {
            updateConnectionDisplay();
        }
    }
    
    /**
     * Generate GitHub QR code for app download
     */
    function generateGitHubQR() {
        const githubQrContainer = document.getElementById('githubQrCode');
        if (!githubQrContainer) return;
        
        console.log('Generating GitHub QR code');
        
        // Show loading
        githubQrContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div><span>Generating QR code...</span></div>';
        
        // Use QR API to generate modern styled QR code
        setTimeout(() => {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(GITHUB_RELEASES_URL)}&bgcolor=ffffff&color=037d3a&format=svg&qzone=1&margin=10`;
            githubQrContainer.innerHTML = `<img src="${qrUrl}" alt="Download App QR Code" style="width: 100%; height: 100%; border-radius: 8px;">`;
        }, 1000);
    }
    
    /**
     * Generate connection code and QR
     */
    function generateConnectionCode() {
        console.log('Generating connection code');
        
        // Show loading states
        if (connectionQrCode) {
            connectionQrCode.innerHTML = '<div class="loading"><div class="loading-spinner"></div><span>Generating...</span></div>';
        }
        if (connectionCodeDisplay) {
            connectionCodeDisplay.textContent = 'Generating...';
        }
        
        // Create AbortController for timeout (increased to 30 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('Request timeout triggered after 30 seconds');
            controller.abort();
        }, 30000); // 30 second timeout
        
        console.log('Making fetch request to /devices/generate-code');
        
        // Call backend to generate code
        fetch('/devices/generate-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include',
            signal: controller.signal
        })
        .then(response => {
            console.log('Received response:', response.status, response.statusText);
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            if (data.success) {
                currentCode = data.code;
                displayConnectionCode(data.code, data.qr_code);
                resetTimer();
                console.log('Code generated successfully:', data.code);
            } else {
                throw new Error(data.error || 'Failed to generate code');
            }
        })
        .catch(error => {
            clearTimeout(timeoutId);
            console.error('Error generating code:', error);
            if (error.name === 'AbortError') {
                console.log('Request was aborted due to timeout');
                showError('Request timed out. Please try again.');
            } else {
                console.log('Request failed with error:', error.message);
                showError('Failed to generate connection code. Please try again.');
            }
        });
    }
    
    /**
     * Update connection display based on selected method
     */
    function updateConnectionDisplay() {
        if (!currentCode) return;
        
        console.log('Updating connection display for method:', selectedMethod);
        
        // Ensure both containers are visible first
        if (connectionQrCode && connectionQrCode.parentElement) {
            connectionQrCode.parentElement.style.display = 'block';
        }
        if (connectionCodeDisplay && connectionCodeDisplay.parentElement) {
            connectionCodeDisplay.parentElement.style.display = 'block';
        }
        
        if (selectedMethod === 'qr') {
            // Show QR code with styled appearance
            if (connectionQrCode && window.currentConnectionQR) {
                connectionQrCode.innerHTML = `<img src="${window.currentConnectionQR}" alt="Connection QR Code" style="width: 100%; height: 100%; border-radius: 8px;">`;
            }
            // Hide code display
            if (connectionCodeDisplay && connectionCodeDisplay.parentElement) {
                connectionCodeDisplay.parentElement.style.display = 'none';
            }
        } else if (selectedMethod === 'code') {
            // Show code
            if (connectionCodeDisplay) {
                connectionCodeDisplay.textContent = currentCode;
                connectionCodeDisplay.parentElement.style.display = 'block';
            }
            // Hide QR code
            if (connectionQrCode && connectionQrCode.parentElement) {
                connectionQrCode.parentElement.style.display = 'none';
            }
        }
    }

    /**
     * Display the generated connection code
     */
    function displayConnectionCode(code, qrDataUrl) {
        console.log('Displaying connection code:', code);
        
        // Store the code and QR data
        currentCode = code;
        
        // Always show both containers initially
        if (connectionQrCode && connectionQrCode.parentElement) {
            connectionQrCode.parentElement.style.display = 'block';
        }
        if (connectionCodeDisplay && connectionCodeDisplay.parentElement) {
            connectionCodeDisplay.parentElement.style.display = 'block';
        }
        
        // Generate styled QR code for connection (matching GitHub QR style)
        const styledQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(code)}&bgcolor=ffffff&color=037d3a&format=svg&qzone=1&margin=10`;
        
        if (selectedMethod === 'qr') {
            // Show QR code with proper styling
            if (connectionQrCode) {
                connectionQrCode.innerHTML = `<img src="${styledQrUrl}" alt="Connection QR Code" style="width: 100%; height: 100%; border-radius: 8px;">`;
            }
            // Hide code display
            if (connectionCodeDisplay && connectionCodeDisplay.parentElement) {
                connectionCodeDisplay.parentElement.style.display = 'none';
            }
        } else if (selectedMethod === 'code') {
            // Show code
            if (connectionCodeDisplay) {
                connectionCodeDisplay.textContent = code;
                connectionCodeDisplay.parentElement.style.display = 'block';
            }
            // Hide QR code
            if (connectionQrCode && connectionQrCode.parentElement) {
                connectionQrCode.parentElement.style.display = 'none';
            }
        }
        
        // Store QR URL for method switching
        window.currentConnectionQR = styledQrUrl;
    }
    
    /**
     * Show error message
     */
    function showError(message) {
        const errorHtml = `<div class="loading" style="color: #ff6b6b;"><i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 8px;"></i><span>${message}</span></div>`;
        
        if (connectionQrCode) {
            connectionQrCode.innerHTML = errorHtml;
        }
        if (connectionCodeDisplay) {
            connectionCodeDisplay.innerHTML = errorHtml;
        }
    }
    
    /**
     * Start the refresh timer
     */
    function startRefreshTimer() {
        clearRefreshTimer();
        
        timeRemaining = 120;
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();
            
            if (timeRemaining <= 0) {
                generateConnectionCode();
                resetTimer();
            }
        }, 1000);
    }
    
    /**
     * Reset timer to 120 seconds
     */
    function resetTimer() {
        timeRemaining = 120;
        updateTimerDisplay();
    }
    
    /**
     * Update timer display
     */
    function updateTimerDisplay() {
        if (refreshTimer) {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            refreshTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    /**
     * Clear refresh timer
     */
    function clearRefreshTimer() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
    
    /**
     * Copy text to clipboard
     */
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Show success feedback
            const originalText = connectionCodeDisplay.textContent;
            connectionCodeDisplay.textContent = 'Copied!';
            connectionCodeDisplay.style.background = '#037d3a';
            
            setTimeout(() => {
                connectionCodeDisplay.textContent = originalText;
                connectionCodeDisplay.style.background = '#2a2a2a';
            }, 1000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }
    
    /**
     * Download APK file
     */
    function downloadAPK() {
        const link = document.createElement('a');
        link.href = GITHUB_RELEASES_URL;
        link.target = '_blank';
        link.click();
    }
    
    // Expose download function globally for button onclick
    window.downloadAPK = downloadAPK;
    
    // Expose modal functions globally for programmatic access
    window.openAddDeviceModal = openModal;
    window.closeAddDeviceModal = closeModal;
    
    console.log('Add Device Modal script initialized successfully');
});

/* ====================
   END ADD DEVICE MODAL JAVASCRIPT
   ==================== */
