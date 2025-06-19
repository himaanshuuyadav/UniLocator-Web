document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const modal = document.getElementById('addDeviceModal');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }

    const closeBtn = modal.querySelector('.close');
    const nextBtn = modal.querySelector('.btn-next');
    const prevBtn = modal.querySelector('.btn-previous');
    const methodBtns = modal.querySelectorAll('.method-btn');
    
    let currentStep = 1;
    const totalSteps = 3;

    // Add event listeners only if elements exist
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            resetSteps();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                currentStep++;
                showStep(currentStep);
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
                qrMethod.classList.remove('hidden');
                codeMethod.classList.add('hidden');
            } else {
                qrMethod.classList.add('hidden');
                codeMethod.classList.remove('hidden');
            }
        });
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
    }

    function handleFinishStep() {
        fetch('/devices/add', {  // Updated endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                device_code: document.getElementById('device-code').value,
                device_name: document.getElementById('device-name').value
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Device added successfully:', data.device);
                // Close the modal
                const modal = document.querySelector('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
                // Reset the form
                document.getElementById('add-device-form').reset();
                // Refresh the devices list
                window.location.reload();
            } else {
                console.error('Error adding device:', data.error);
                alert('Error adding device: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error adding device. Please try again.');
        });
    }

    // Update the finish button event listener
    const finishButton = document.querySelector('.finish-btn');
    if (finishButton) {
        finishButton.addEventListener('click', handleFinishStep);
    }
    
    // For debugging
    console.log('Add device script initialized');
});