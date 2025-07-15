import authService from './auth-service.js';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    // Check if user is already logged in
    if (authService.isAuthenticated()) {
        window.location.href = '/dashboard';
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Show loading state
        loginBtn.textContent = 'Logging in...';
        loginBtn.disabled = true;
        errorMessage.textContent = '';

        try {
            console.log('[DEBUG] Starting Firebase login...');
            const result = await authService.login(email, password);
            console.log('[DEBUG] Firebase login result:', result);
            
            if (result.success && result.user && result.user.uid) {
                console.log('[DEBUG] Firebase login successful, sending UID and email to Flask backend...');
                console.log('[DEBUG] User object:', result.user);
                console.log('[DEBUG] User email from result:', result.user.email);
                console.log('[DEBUG] Form email variable:', email);
                
                const emailToSend = result.user.email || email || 'unknown@example.com';
                console.log('[DEBUG] Final email to send:', emailToSend);
                
                // Send UID and email to Flask backend to set session
                fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ 
                        firebase_uid: result.user.uid,
                        email: emailToSend
                    })
                })
                .then(res => {
                    console.log('[DEBUG] Flask /login response status:', res.status);
                    return res.json();
                })
                .then(data => {
                    console.log('[DEBUG] Flask /login response data:', data);
                    if (data.success) {
                        console.log('[DEBUG] Redirecting to:', data.redirect || '/dashboard');
                        window.location.href = data.redirect || '/dashboard';
                    } else {
                        console.error('[DEBUG] Flask login failed:', data.error);
                        errorMessage.textContent = data.error || 'Login failed on server.';
                    }
                })
                .catch(err => {
                    console.error('[DEBUG] Flask /login request failed:', err);
                    errorMessage.textContent = 'Could not establish session with server. Check console for details.';
                });
            } else {
                console.error('[DEBUG] Firebase login failed:', result.error);
                // Show error message
                errorMessage.textContent = mapFirebaseError(result.error);
            }
        } catch (error) {
            errorMessage.textContent = 'An unexpected error occurred. Please try again.';
        } finally {
            // Reset button state
            loginBtn.textContent = 'Login';
            loginBtn.disabled = false;
        }
    });

    // Toggle password visibility
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');

    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    // Map Firebase Auth errors to user-friendly messages
    function mapFirebaseError(error) {
        if (!error) return '';
        if (error.includes('auth/user-not-found')) return 'No account found with this email.';
        if (error.includes('auth/wrong-password')) return 'Incorrect password. Please try again.';
        if (error.includes('auth/invalid-email')) return 'Please enter a valid email address.';
        if (error.includes('auth/too-many-requests')) return 'Too many failed attempts. Please try again later.';
        if (error.includes('auth/network-request-failed')) return 'Network error. Please check your connection.';
        return error;
    }
});
