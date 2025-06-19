document.addEventListener('DOMContentLoaded', function() {
    // Toggle active state for nav items
    const navItems = document.querySelectorAll('.nav-links li');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Simulate real-time updates (for demo purposes)
    setInterval(() => {
        updateRandomStats();
        addRandomActivity();
    }, 5000);
});

function updateRandomStats() {
    const numbers = document.querySelectorAll('.stat-number');
    const randomIndex = Math.floor(Math.random() * numbers.length);
    const randomChange = Math.floor(Math.random() * 5) + 1;
    
    const currentNumber = parseInt(numbers[randomIndex].textContent);
    numbers[randomIndex].textContent = currentNumber + randomChange;
}

function addRandomActivity() {
    const activities = [
        'Device "iPhone 13" updated location',
        'Low battery alert: "Galaxy A03"',
        'New device connected',
        'Location history updated'
    ];

    const activityList = document.querySelector('.activity-list');
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