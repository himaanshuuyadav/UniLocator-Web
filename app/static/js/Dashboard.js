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
    
    // Feature tabs functionality
    initFeatureTabs();
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
    if (activityList) {
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
}

// Feature tabs functionality
function initFeatureTabs() {
    console.log("Initializing feature tabs...");
    const featureTabs = document.querySelectorAll('.feature-tab');
    if (!featureTabs.length) {
        console.log("No feature tabs found");
        return; // Exit if no feature tabs exist on the page
    }
    
    console.log(`Found ${featureTabs.length} feature tabs`);
    const featureContents = document.querySelectorAll('.feature-image-container');

    function activateTab(tabElement) {
        const tabId = tabElement.getAttribute('data-tab');
        console.log(`Activating tab: ${tabId}`);
        
        // Remove active class from all tabs and contents
        featureTabs.forEach(t => t.classList.remove('active'));
        featureContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        tabElement.classList.add('active');
        const contentElement = document.getElementById(`${tabId}-content`);
        if (contentElement) {
            contentElement.classList.add('active');
        } else {
            console.log(`Content element for tab ${tabId} not found`);
        }
    }

    featureTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            activateTab(this);
        });
    });
    
    // Auto-rotate through features every 5 seconds
    let currentFeatureIndex = 0;
    
    // Start rotation immediately
    console.log("Starting feature rotation");
    const startRotation = () => {
        return window.setInterval(() => {
            currentFeatureIndex = (currentFeatureIndex + 1) % featureTabs.length;
            console.log(`Auto-rotating to feature index: ${currentFeatureIndex}`);
            activateTab(featureTabs[currentFeatureIndex]);
        }, 5000);
    };
    
    let featureRotateInterval = startRotation();
    
    // Pause rotation when user interacts with tabs
    featureTabs.forEach(tab => {
        tab.addEventListener('mouseenter', () => {
            console.log("Mouse entered tab, clearing rotation interval");
            window.clearInterval(featureRotateInterval);
        });
    });
    
    // Resume rotation when mouse leaves the features section
    const featuresSection = document.querySelector('.features-section');
    if (featuresSection) {
        featuresSection.addEventListener('mouseleave', () => {
            console.log("Mouse left features section, restarting rotation");
            window.clearInterval(featureRotateInterval);
            featureRotateInterval = startRotation();
        });
    }
}