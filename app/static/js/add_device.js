document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const modal = document.getElementById('addDeviceModal');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }

    // GitHub APK download URL (replace with actual GitHub releases URL)
    const GITHUB_APK_URL = 'https://github.com/himaanshuuyadav/unilocator/releases/';

    // Add event listeners for all "Add Device" buttons
    const addDeviceBtns = document.querySelectorAll('.add-device-btn');
    addDeviceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Add device button clicked');
            modal.classList.add('show');
            resetSteps();
            generateGitHubQrCode();
        });
    });

    const closeBtn = modal.querySelector('.close');
    const nextBtn = modal.querySelector('.btn-next');
    const prevBtn = modal.querySelector('.btn-previous');
    const methodBtns = modal.querySelectorAll('.connection-method-btn');
    
    // GitHub QR Code elements
    const showDirectDownloadBtn = modal.querySelector('#showDirectDownload');
    const showQrAgainBtn = modal.querySelector('#showQrAgain');
    const githubQrContainer = modal.querySelector('#githubQrContainer');
    const directDownloadContainer = modal.querySelector('#directDownloadContainer');
    const directDownloadBtn = modal.querySelector('#directDownloadBtn');
    
    console.log('Modal elements found:', {
        closeBtn: !!closeBtn,
        nextBtn: !!nextBtn,
        prevBtn: !!prevBtn,
        methodBtns: methodBtns.length,
        showDirectDownloadBtn: !!showDirectDownloadBtn,
        showQrAgainBtn: !!showQrAgainBtn
    });
    
    let currentStep = 1;
    const totalSteps = 3;

    // Add event listeners only if elements exist
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            resetSteps();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                // On step 2, only allow if a method is selected
                if (currentStep === 2) {
                    const selectedMethodBtn = modal.querySelector('.connection-method-btn.active');
                    if (!selectedMethodBtn) return;
                }
                currentStep++;
                showStep(currentStep);
                // If moving to step 3, generate code/QR for selected method
                if (currentStep === 3) {
                    const selectedMethodBtn = modal.querySelector('.connection-method-btn.active');
                    if (selectedMethodBtn) {
                        const method = selectedMethodBtn.dataset.method;
                        generateUniqueCode(method);
                    }
                }
            } else if (currentStep === totalSteps) {
                modal.classList.remove('show');
                resetSteps();
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                showStep(currentStep);
            }
        });
    }

    // Method selection handlers
    methodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            methodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const method = btn.dataset.method;
            const qrMethod = modal.querySelector('.qr-method');
            const codeMethod = modal.querySelector('.code-method');
            
            if (method === 'qr') {
                if (qrMethod) qrMethod.classList.remove('hidden');
                if (codeMethod) codeMethod.classList.add('hidden');
            } else if (method === 'code') {
                if (qrMethod) qrMethod.classList.add('hidden');
                if (codeMethod) codeMethod.classList.remove('hidden');
            }
            
            // Enable Next button if on step 2
            if (currentStep === 2 && nextBtn) nextBtn.disabled = false;
        });
    });

    // GitHub QR Code and Download Toggle Event Handlers
    if (showDirectDownloadBtn) {
        showDirectDownloadBtn.addEventListener('click', () => {
            toggleToDirectDownload();
        });
    }

    if (showQrAgainBtn) {
        showQrAgainBtn.addEventListener('click', () => {
            toggleToQrCode();
        });
    }

    if (directDownloadBtn) {
        directDownloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            downloadApkFile();
        });
    }

    function generateUniqueCode(method) {
        console.log('Generating code for method:', method);

        // Show loading state in the correct modal container
        if (method === 'qr') {
            const qrCodeEl = document.getElementById('qrCode');
            if (qrCodeEl) qrCodeEl.innerHTML = '<div class="loading">Generating QR code...</div>';
        } else {
            const connectionCodeEl = document.getElementById('connectionCode');
            if (connectionCodeEl) connectionCodeEl.innerHTML = '<div class="loading">Generating code...</div>';
        }

        fetch('/devices/generate-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                if (method === 'qr') {
                    const qrCodeEl = document.getElementById('qrCode');
                    if (qrCodeEl) {
                        qrCodeEl.innerHTML = `<img src="${data.qr_code}" alt="QR Code" class="qr-code">`;
                    }
                } else {
                    const connectionCodeEl = document.getElementById('connectionCode');
                    if (connectionCodeEl) {
                        connectionCodeEl.innerHTML = `<div class="connection-code">${data.code}</div>`;
                    }
                }
            } else {
                throw new Error(data.error || 'Failed to generate code');
            }
        })
        .catch(error => {
            console.error('Error generating code:', error);
            if (method === 'qr') {
                const qrCodeEl = document.getElementById('qrCode');
                if (qrCodeEl) {
                    qrCodeEl.innerHTML = `<div class="error-message">Error generating QR code.<br><small>${error.message}</small></div>`;
                }
            } else {
                const connectionCodeEl = document.getElementById('connectionCode');
                if (connectionCodeEl) {
                    connectionCodeEl.innerHTML = `<div class="error-message">Error generating code.<br><small>${error.message}</small></div>`;
                }
            }
        });
    }

    function showStep(step) {
        const steps = modal.querySelectorAll('.step');
        const currentActive = modal.querySelector('.step.active');
        const modalContent = modal.querySelector('.modal-content');
        const modalBody = modal.querySelector('.modal-body');
        
        // Add transition classes
        modalContent.classList.add('transitioning');
        modalBody.classList.add('height-transition');
        
        // If there's a current active step, animate it out
        if (currentActive) {
            currentActive.classList.add('step-exit');
            currentActive.style.opacity = '0';
            currentActive.style.transform = 'translateX(-30px)';
            
            setTimeout(() => {
                currentActive.classList.remove('active', 'step-exit');
                
                // Now animate in the new step
                const newActiveStep = steps[step - 1];
                if (newActiveStep) {
                    newActiveStep.classList.add('active', 'step-enter');
                    newActiveStep.style.opacity = '1';
                    newActiveStep.style.transform = 'translateX(0)';
                    
                    setTimeout(() => {
                        newActiveStep.classList.remove('step-enter');
                        // Remove transition classes after animation completes
                        modalContent.classList.remove('transitioning');
                        modalBody.classList.remove('height-transition');
                    }, 300);
                }
            }, 300);
        } else {
            // No current active step, just show the new one
            steps.forEach((s, index) => {
                s.classList.toggle('active', index + 1 === step);
            });
            setTimeout(() => {
                modalContent.classList.remove('transitioning');
                modalBody.classList.remove('height-transition');
            }, 400);
        }
        
        if (prevBtn) prevBtn.disabled = step === 1;
        
        if (nextBtn) {
            if (step === 2) {
                // On step 2, disable until method is selected
                const selectedMethod = modal.querySelector('.connection-method-btn.active');
                nextBtn.disabled = !selectedMethod;
            } else {
                // Step 1 and 3 should have Next/Close enabled
                nextBtn.disabled = false;
            }
            
            nextBtn.innerHTML = step === totalSteps ? 
                'Close <i class="fas fa-times"></i>' : 
                'Next <i class="fas fa-arrow-right"></i>';
        }
    }

    function resetSteps() {
        currentStep = 1;
        showStep(1);
        // Clear method selections
        methodBtns.forEach(btn => btn.classList.remove('active'));
        // Hide method content
        const qrMethod = modal.querySelector('.qr-method');
        const codeMethod = modal.querySelector('.code-method');
        if (qrMethod) qrMethod.classList.add('hidden');
        if (codeMethod) codeMethod.classList.add('hidden');
        // Clear generated content
        const qrCodeEl = document.getElementById('qrCode');
        const connectionCodeEl = document.getElementById('connectionCode');
        if (qrCodeEl) qrCodeEl.innerHTML = '';
        if (connectionCodeEl) connectionCodeEl.innerHTML = '';
        
        // Reset GitHub QR/Download view
        if (githubQrContainer && directDownloadContainer) {
            directDownloadContainer.style.display = 'none';
            directDownloadContainer.classList.add('hidden');
            directDownloadContainer.classList.remove('show');
            githubQrContainer.style.display = 'block';
            githubQrContainer.classList.remove('fade-out');
        }
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.remove('show');
            resetSteps();
        }
    });

    // GitHub QR Code Generation
    function generateGitHubQrCode() {
        const qrCodeContainer = document.getElementById('githubQrCode');
        if (!qrCodeContainer) return;

        // Show loading state
        qrCodeContainer.innerHTML = '<div class="loading">Generating QR code...</div>';

        // Generate QR code for GitHub APK download URL
        // Using QR.js library or API - you can replace this with your preferred QR code generator
        const qrCodeDataUrl = generateQrCodeDataUrl(GITHUB_APK_URL);
        
        setTimeout(() => {
            qrCodeContainer.innerHTML = `<img src="${qrCodeDataUrl}" alt="Download APK QR Code" />`;
        }, 1000);
    }

    // Simple QR code data URL generator (placeholder - replace with actual QR library)
    function generateQrCodeDataUrl(text) {
        // This is a placeholder using qr-server.com API
        // In production, you should use a local QR code library like qrcode.js
        return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(text)}&bgcolor=ffffff&color=047a39&margin=20`;
    }

    // Toggle to direct download view
    function toggleToDirectDownload() {
        if (!githubQrContainer || !directDownloadContainer) return;

        // Add fade out class to QR container
        githubQrContainer.classList.add('fade-out');
        
        setTimeout(() => {
            githubQrContainer.style.display = 'none';
            directDownloadContainer.style.display = 'block';
            directDownloadContainer.classList.remove('hidden');
            
            // Trigger the fade in animation
            setTimeout(() => {
                directDownloadContainer.classList.add('show');
            }, 50);
        }, 400);
    }

    // Toggle back to QR code view
    function toggleToQrCode() {
        if (!githubQrContainer || !directDownloadContainer) return;

        // Add fade out class to direct download container
        directDownloadContainer.classList.remove('show');
        
        setTimeout(() => {
            directDownloadContainer.style.display = 'none';
            directDownloadContainer.classList.add('hidden');
            githubQrContainer.style.display = 'block';
            
            // Trigger the fade in animation
            setTimeout(() => {
                githubQrContainer.classList.remove('fade-out');
            }, 50);
        }, 400);
    }

    // Download APK file
    function downloadApkFile() {
        // Update button text and show loading state
        const downloadBtn = directDownloadBtn;
        const originalText = downloadBtn.innerHTML;
        
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
        downloadBtn.style.pointerEvents = 'none';
        
        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = GITHUB_APK_URL;
        link.download = 'UniLocator.apk';
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Reset button after 3 seconds
        setTimeout(() => {
            downloadBtn.innerHTML = originalText;
            downloadBtn.style.pointerEvents = 'auto';
        }, 3000);
    }

    // Close modal when pressing escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
            resetSteps();
        }
    });

    // For debugging
    console.log('Add device script initialized');
    console.log('Modal found:', modal ? 'Yes' : 'No');
    console.log('Add device buttons found:', document.querySelectorAll('.add-device-btn').length);
});