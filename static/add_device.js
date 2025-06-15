document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('addDeviceModal');
    const steps = document.querySelectorAll('.step');
    let currentStep = 0;
    
    async function generateDeviceCode() {
        const response = await fetch('/add-device', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        
        // Update QR code image
        document.getElementById('qrCode').src = `data:image/png;base64,${data.qr_code}`;
        
        // Update unique code
        document.getElementById('deviceCode').textContent = data.unique_code;
    }
    
    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            step.classList.toggle('active', index === stepIndex);
        });
        
        // Generate codes when reaching step 3
        if (stepIndex === 2) {
            generateDeviceCode();
        }
    }
    
    // Handle next/previous buttons
    document.querySelector('.btn-next').addEventListener('click', () => {
        if (currentStep < steps.length - 1) {
            currentStep++;
            showStep(currentStep);
        }
    });
    
    document.querySelector('.btn-previous').addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            showStep(currentStep);
        }
    });
    
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
        // Show copy feedback
        const icon = document.querySelector('#copyCode i');
        icon.className = 'fas fa-check';
        setTimeout(() => {
            icon.className = 'fas fa-copy';
        }, 2000);
    });
});