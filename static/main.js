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

    function generateUniqueCode() {
        fetch('/generate-device-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            uniqueCode = data.unique_code;
            
            // Update QR code
            const qrContainer = document.getElementById('qrCode');
            if (qrContainer) {
                const qrImage = document.createElement('img');
                qrImage.src = data.qr_code;
                qrImage.alt = 'QR Code';
                qrContainer.innerHTML = '';
                qrContainer.appendChild(qrImage);
            }

            // Update unique code display
            const codeContainer = document.getElementById('connectionCode');
            if (codeContainer) {
                codeContainer.innerHTML = `
                    <span class="code-text">${uniqueCode}</span>
                    <button class="copy-btn" onclick="navigator.clipboard.writeText('${uniqueCode}')">
                        <i class="fas fa-copy"></i>
                    </button>
                `;
            }
        })
        .catch(error => console.error('Error:', error));
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
            generateUniqueCode();
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

    console.log('Main script initialized');
});