document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile script loading...');
    
    // Initialize profile dashboard
    initializeProfileDashboard();
    
    // Display Firebase username in navbar and profile
    function updateUsername(user) {
        var name = '';
        var email = '';
        if (user) {
            name = user.displayName || user.email || 'User';
            email = user.email || 'No email available';
            
            // Update profile name
            const profileName = document.getElementById('profileName');
            if (profileName) profileName.textContent = name;
            
            // Update email field
            const emailField = document.getElementById('email');
            if (emailField) emailField.value = email;
            
            // Update navbar username
            const navbarUsername = document.getElementById('navbar-username');
            if (navbarUsername) navbarUsername.textContent = name;
        }
        
        // Update profile header (legacy)
        var profileUsername = document.getElementById('profile-username');
        if (profileUsername) profileUsername.textContent = name;
        
        // Update email in profile (legacy)
        var userEmail = document.getElementById('user-email');
        if (userEmail) userEmail.textContent = email;
    }

    // Initialize enhanced profile dashboard
    function initializeProfileDashboard() {
        console.log('Initializing enhanced profile dashboard...');
        
        // Load user stats
        loadProfileStats();
        
        // Load recent activity
        loadRecentActivity();
        
        // Set up event listeners
        setupProfileEventListeners();
        
        // Initialize form validation
        setupFormValidation();
    }

    // Load profile statistics
    function loadProfileStats() {
        fetch('/api/profile/stats')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const stats = data.stats;
                    
                    // Update stat cards
                    updateStatCard('totalDevices', stats.total_devices);
                    updateStatCard('locationsTracked', stats.locations_tracked);
                    updateStatCard('accountAge', stats.account_age_days);
                    updateStatCard('groupsJoined', stats.groups_joined);
                    
                    console.log('Profile stats loaded successfully');
                } else {
                    console.error('Failed to load profile stats:', data.error);
                }
            })
            .catch(error => {
                console.error('Error loading profile stats:', error);
            });
    }

    function updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            // Animate the number change
            animateNumber(element, 0, value, 1000);
        }
    }

    function animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const difference = end - start;

        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(start + (difference * progress));
            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        }

        requestAnimationFrame(updateNumber);
    }

    // Load recent activity
    function loadRecentActivity() {
        // Simulate loading recent activity (replace with actual API call)
        setTimeout(() => {
            const activityList = document.getElementById('activityList');
            if (activityList) {
                const activities = [
                    {
                        icon: 'fas fa-mobile-alt',
                        text: 'Device "My Phone" connected',
                        time: '2 hours ago'
                    },
                    {
                        icon: 'fas fa-map-marker-alt',
                        text: 'Location updated for device "My Phone"',
                        time: '4 hours ago'
                    },
                    {
                        icon: 'fas fa-user-edit',
                        text: 'Profile information updated',
                        time: '1 day ago'
                    },
                    {
                        icon: 'fas fa-shield-alt',
                        text: 'Security settings reviewed',
                        time: '3 days ago'
                    }
                ];

                activityList.innerHTML = activities.map(activity => `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <i class="${activity.icon}"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-text">${activity.text}</div>
                            <div class="activity-time">${activity.time}</div>
                        </div>
                    </div>
                `).join('');
            }
        }, 800);
    }

    // Set up all profile event listeners
    function setupProfileEventListeners() {
        // Avatar upload button
        const avatarUploadBtn = document.getElementById('avatarUploadBtn');
        if (avatarUploadBtn) {
            avatarUploadBtn.addEventListener('click', handleAvatarUpload);
        }

        // Share profile button
        const shareProfileBtn = document.getElementById('shareProfileBtn');
        if (shareProfileBtn) {
            shareProfileBtn.addEventListener('click', handleShareProfile);
        }

        // Export data button
        const exportDataBtn = document.getElementById('exportDataBtn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', handleExportData);
        }

        // Save changes button
        const saveChangesBtn = document.getElementById('saveChangesBtn');
        if (saveChangesBtn) {
            saveChangesBtn.addEventListener('click', handleSaveChanges);
        }

        // Reset changes button
        const resetChangesBtn = document.getElementById('resetChangesBtn');
        if (resetChangesBtn) {
            resetChangesBtn.addEventListener('click', handleResetChanges);
        }

        // Security buttons
        setupSecurityButtons();

        // Preference toggles
        setupPreferenceToggles();
    }

    function handleAvatarUpload() {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Create a URL for the selected image and update the avatar
                const reader = new FileReader();
                reader.onload = function(e) {
                    const userAvatar = document.getElementById('userAvatar');
                    if (userAvatar) {
                        userAvatar.src = e.target.result;
                    }
                };
                reader.readAsDataURL(file);
                
                // In a real app, you'd upload this to your server
                console.log('Avatar file selected:', file.name);
                showNotification('Avatar updated! (Demo mode)', 'success');
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    function handleShareProfile() {
        if (navigator.share) {
            navigator.share({
                title: 'Check out my UniLocator profile',
                text: 'See my device tracking profile on UniLocator',
                url: window.location.href
            });
        } else {
            // Fallback: copy link to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                showNotification('Profile link copied to clipboard!', 'success');
            }).catch(() => {
                showNotification('Could not copy link', 'error');
            });
        }
    }

    function handleExportData() {
        // Simulate data export
        const userData = {
            profile: {
                name: document.getElementById('profileName')?.textContent || 'User',
                email: document.getElementById('email')?.value || '',
                tagline: document.getElementById('profileTagline')?.value || '',
                joinDate: new Date().toISOString()
            },
            devices: [],
            preferences: {
                darkMode: document.getElementById('darkModeToggle')?.checked || false,
                emailNotifications: document.getElementById('emailNotificationsToggle')?.checked || false,
                autoRefresh: document.getElementById('autoRefreshToggle')?.checked || false
            }
        };

        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'unilocator-profile-data.json';
        link.click();

        showNotification('Profile data exported successfully!', 'success');
    }

    function handleSaveChanges() {
        const formData = {
            firstName: document.getElementById('firstName')?.value || '',
            lastName: document.getElementById('lastName')?.value || '',
            email: document.getElementById('email')?.value || '',
            bio: document.getElementById('bio')?.value || '',
            location: document.getElementById('location')?.value || '',
            tagline: document.getElementById('profileTagline')?.value || ''
        };

        // Show loading state
        const saveBtn = document.getElementById('saveChangesBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;

        // Make API call
        fetch('/api/profile/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Profile updated successfully!', 'success');
                
                // Update profile name if changed
                const fullName = `${formData.firstName} ${formData.lastName}`.trim();
                if (fullName) {
                    const profileName = document.getElementById('profileName');
                    if (profileName) profileName.textContent = fullName;
                }
            } else {
                showNotification('Failed to update profile: ' + (data.error || 'Unknown error'), 'error');
            }
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            showNotification('Network error occurred', 'error');
        })
        .finally(() => {
            // Restore button state
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        });
    }

    function handleResetChanges() {
        if (confirm('Are you sure you want to reset all changes? This will reload the page.')) {
            window.location.reload();
        }
    }

    function setupSecurityButtons() {
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        const twoFactorBtn = document.getElementById('twoFactorBtn');
        const privacySettingsBtn = document.getElementById('privacySettingsBtn');

        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                showNotification('Redirecting to password change...', 'info');
                // In a real app, this would redirect to Firebase Auth password reset
                if (window.firebase && window.firebase.auth) {
                    const user = window.firebase.auth().currentUser;
                    if (user && user.email) {
                        window.firebase.auth().sendPasswordResetEmail(user.email)
                            .then(() => {
                                showNotification('Password reset email sent to ' + user.email, 'success');
                            })
                            .catch((error) => {
                                console.error('Error sending password reset email:', error);
                                showNotification('Error sending password reset email', 'error');
                            });
                    }
                } else {
                    showNotification('Password reset functionality will be implemented', 'info');
                }
            });
        }

        if (twoFactorBtn) {
            twoFactorBtn.addEventListener('click', () => {
                showNotification('Two-factor authentication setup coming soon!', 'info');
            });
        }

        if (privacySettingsBtn) {
            privacySettingsBtn.addEventListener('click', () => {
                showNotification('Privacy settings panel coming soon!', 'info');
            });
        }
    }

    function setupPreferenceToggles() {
        const toggles = ['darkModeToggle', 'emailNotificationsToggle', 'autoRefreshToggle'];
        
        toggles.forEach(toggleId => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                toggle.addEventListener('change', function() {
                    const setting = toggleId.replace('Toggle', '');
                    console.log(`${setting} toggled:`, this.checked);
                    
                    // Save preference (in a real app, you'd make an API call)
                    localStorage.setItem(`unilocator_${setting}`, this.checked);
                    showNotification(`${setting.replace(/([A-Z])/g, ' $1')} ${this.checked ? 'enabled' : 'disabled'}`, 'success');
                });
            }
        });
    }

    function setupFormValidation() {
        const form = document.getElementById('profileForm');
        if (form) {
            const inputs = form.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', validateField);
                input.addEventListener('input', clearFieldError);
            });
        }
    }

    function validateField(e) {
        const field = e.target;
        const value = field.value.trim();
        
        // Basic validation
        if (field.required && !value) {
            showFieldError(field, 'This field is required');
            return false;
        }
        
        if (field.type === 'email' && value && !isValidEmail(value)) {
            showFieldError(field, 'Please enter a valid email address');
            return false;
        }
        
        clearFieldError(field);
        return true;
    }

    function showFieldError(field, message) {
        clearFieldError(field);
        field.style.borderColor = 'var(--danger)';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.color = 'var(--danger)';
        errorDiv.style.fontSize = '0.8rem';
        errorDiv.style.marginTop = '4px';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    function clearFieldError(field) {
        field.style.borderColor = '';
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--accent)'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 0.9rem;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
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
