document.addEventListener('DOMContentLoaded', () => {
    // Handle tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    const devicesGrid = document.querySelector('.devices-grid');
    // Clear any existing device cards
    devicesGrid.innerHTML = '';
    
    function addDeviceCard(device) {
        const card = document.createElement('div');
        card.className = 'device-card';
        card.innerHTML = `
            <div class="device-info">
                <h3>${device.name}</h3>
                <p class="status ${device.status.toLowerCase()}">${device.status}</p>
                <p class="location"><i class="fas fa-map-marker-alt"></i> ${device.location}</p>
            </div>
            <button class="track-btn">Track Device</button>
        `;
        devicesGrid.appendChild(card);
    }

    // Add device button functionality
    const addDeviceBtn = document.querySelector('.add-device-btn');
    addDeviceBtn.addEventListener('click', () => {
        // Add your logic to open device addition modal/form
        console.log('Add device button clicked');
    });
});