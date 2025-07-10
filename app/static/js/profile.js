document.addEventListener('DOMContentLoaded', function() {
    // Display Firebase username in navbar and profile
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
    const settingToggles = document.querySelectorAll('.setting-item input[type="checkbox"]');
    settingToggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const settingName = this.id;
            const isEnabled = this.checked;
            
            console.log(`Setting ${settingName} changed to:`, isEnabled);
            
            // You can add API calls here to save settings
            // saveUserSetting(settingName, isEnabled);
        });
    });

    // Security button handlers
    const securityBtns = document.querySelectorAll('.security-btn');
    securityBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const buttonText = this.textContent.trim();
            
            switch(buttonText) {
                case 'Change Password':
                    handleChangePassword();
                    break;
                case 'Two-Factor Authentication':
                    handleTwoFactor();
                    break;
                case 'Download Account Data':
                    handleDownloadData();
                    break;
            }
        });
    });

    function handleChangePassword() {
        alert('Password change functionality would be implemented here. This would redirect to Firebase Auth password reset.');
        // In a real implementation, you'd redirect to Firebase Auth password reset
        if (window.firebase && window.firebase.auth) {
            const user = window.firebase.auth().currentUser;
            if (user && user.email) {
                window.firebase.auth().sendPasswordResetEmail(user.email)
                    .then(() => {
                        alert('Password reset email sent to ' + user.email);
                    })
                    .catch((error) => {
                        console.error('Error sending password reset email:', error);
                        alert('Error sending password reset email. Please try again.');
                    });
            }
        }
    }

    function handleTwoFactor() {
        alert('Two-factor authentication setup would be implemented here.');
        // This would involve setting up Firebase phone authentication
    }

    function handleDownloadData() {
        // Download user data as JSON
        fetch('/auth/download-data', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        })
        .then(response => {
            if (response.ok) {
                return response.blob();
            }
            throw new Error('Failed to download data');
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'unilocator-data.json';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error downloading data:', error);
            alert('Error downloading account data. Please try again.');
        });
    }

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
