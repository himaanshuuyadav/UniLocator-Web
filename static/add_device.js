document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('addDeviceModal');
    const addBtn = document.getElementById('addDeviceBtn');
    const closeBtn = document.querySelector('.close');
    const steps = document.querySelectorAll('.step');
    let currentStep = 0;
    
    // Open modal
    addBtn.addEventListener('click', () => {
        modal.classList.add('show');
        currentStep = 0;
        showStep(currentStep);
    });

    // Close modal
    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.remove('show');
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });

    // Prevent modal from closing when clicking inside
    modal.querySelector('.modal-content').addEventListener('click', (event) => {
        event.stopPropagation();
    });

    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            step.classList.toggle('active', index === stepIndex);
        });
        
        const prevBtn = document.querySelector('.btn-previous');
        const nextBtn = document.querySelector('.btn-next');
        
        prevBtn.disabled = stepIndex === 0;
        nextBtn.textContent = stepIndex === 2 ? 'Finish' : 'Next';
        
        if (stepIndex === 2) {
            generateDeviceCode();
        }
    }

    // Handle next/previous buttons
    document.querySelector('.btn-next').addEventListener('click', () => {
        if (currentStep < steps.length - 1) {
            currentStep++;
            showStep(currentStep);
        } else if (currentStep === steps.length - 1) {
            modal.style.display = 'none';
        }
    });
    
    document.querySelector('.btn-previous').addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            showStep(currentStep);
        }
    });

    async function generateDeviceCode() {
        try {
            const response = await fetch('/add-device', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            document.getElementById('qrCode').src = `data:image/png;base64,${data.qr_code}`;
            document.getElementById('deviceCode').textContent = data.unique_code;
        } catch (error) {
            console.error('Error generating device code:', error);
        }
    }

    // Handle connection method selection
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const method = btn.dataset.method;
            document.querySelector('.qr-method').classList.toggle('hidden', method !== 'qr');
            document.querySelector('.code-method').classList.toggle('hidden', method !== 'code');
        });
    });

    // Handle copy code button
    document.getElementById('copyCode').addEventListener('click', () => {
        const code = document.getElementById('deviceCode').textContent;
        navigator.clipboard.writeText(code);
        const icon = document.querySelector('#copyCode i');
        icon.className = 'fas fa-check';
        setTimeout(() => {
            icon.className = 'fas fa-copy';
        }, 2000);
    });
});