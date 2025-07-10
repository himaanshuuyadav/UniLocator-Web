document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const profileTabs = document.querySelectorAll('.profile-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    profileTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Remove active class from all tabs and panes
            profileTabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding pane
            this.classList.add('active');
            const targetPane = document.getElementById(tabName);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });

    // Display Firebase username in profile
    function updateUsername(user) {
        var name = '';
        var email = '';
        if (user) {
            name = user.displayName || user.email || 'User';
            email = user.email || 'No email available';
        }
        
        // Update profile header
        var profileUsername = document.getElementById('profile-username');
        if (profileUsername) profileUsername.textContent = name;
        
        // Update email in profile
        var userEmail = document.getElementById('user-email');
        if (userEmail) userEmail.textContent = email;
    }

    // Initialize Firebase auth listener when available
    function initializeAuth() {
        if (window.firebase && window.firebase.auth) {
            window.firebase.auth().onAuthStateChanged(updateUsername);
        } else if (window.authService && window.authService.onAuthStateChanged) {
            window.authService.onAuthStateChanged(updateUsername);
        } else {
            // Retry in 100ms if Firebase is not ready yet
            setTimeout(initializeAuth, 100);
        }
    }
    
    initializeAuth();

    // Settings toggle handlers
    const settingToggles = document.querySelectorAll('.toggle input[type="checkbox"]');
    settingToggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const settingName = this.closest('.setting-toggle').querySelector('span').textContent;
            const isEnabled = this.checked;
            
            console.log(`Setting "${settingName}" changed to:`, isEnabled);
            
            // You can add API calls here to save settings
            // saveUserSetting(settingName, isEnabled);
        });
    });

    // Save user setting function (placeholder)
    function saveUserSetting(settingName, value) {
        fetch('/auth/save-setting', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include',
            body: JSON.stringify({
                setting: settingName,
                value: value
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Setting saved successfully');
            } else {
                console.error('Failed to save setting:', data.message);
            }
        })
        .catch(error => {
            console.error('Error saving setting:', error);
        });
    }

    console.log('Profile script initialized');
});

// Global function for logout button
function logoutUser() {
    console.log('[DEBUG] Logout button clicked');
    
    // Call Flask logout endpoint
    fetch('/logout', {
        method: 'POST',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        console.log('[DEBUG] Flask logout response:', data);
        if (data.success) {
            // Sign out from Firebase when available
            function signOutFirebase() {
                if (window.firebase && window.firebase.auth) {
                    window.firebase.auth().signOut().then(() => {
                        console.log('[DEBUG] Firebase signOut successful');
                        window.location.href = '/';
                    }).catch((error) => {
                        console.error('[DEBUG] Firebase signOut error:', error);
                        window.location.href = '/';
                    });
                } else {
                    window.location.href = '/';
                }
            }
            
            // Try to sign out from Firebase, but proceed even if it fails
            setTimeout(signOutFirebase, 100);
        } else {
            console.error('[DEBUG] Logout failed:', data.error);
            window.location.href = '/';
        }
    })
    .catch(err => {
        console.error('[DEBUG] Logout request failed:', err);
        window.location.href = '/';
    });
}

// Global functions for profile actions
function disconnectAllDevices() {
    if (confirm('Are you sure you want to disconnect all devices? This action cannot be undone.')) {
        fetch('/auth/disconnect-all-devices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('All devices have been disconnected successfully.');
                location.reload();
            } else {
                alert('Error disconnecting devices: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to disconnect devices. Please try again.');
        });
    }
}

function deleteAccount() {
    const confirmation = prompt('This will permanently delete your account and all data. Type "DELETE" to confirm:');
    if (confirmation === 'DELETE') {
        fetch('/auth/delete-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Your account has been deleted successfully.');
                window.location.href = '/';
            } else {
                alert('Error deleting account: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to delete account. Please try again.');
        });
    }
}

// Function to remove a device
function removeDevice(deviceCode) {
    if (confirm('Are you sure you want to remove this device?')) {
        fetch('/devices/remove-device', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include',
            body: JSON.stringify({ device_code: deviceCode })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Device removed successfully!');
                location.reload();
            } else {
                alert('Failed to remove device: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error removing device. Please try again.');
        });
    }
}

// Function to update profile
function updateProfile() {
    const displayName = document.getElementById('display-name').value;
    const bio = document.getElementById('bio').value;
    
    fetch('/auth/update-profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: JSON.stringify({
            display_name: displayName,
            bio: bio
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Profile updated successfully!');
        } else {
            alert('Failed to update profile: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error updating profile. Please try again.');
    });
}