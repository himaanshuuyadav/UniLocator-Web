import authService from './auth-service.js';

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.getElementById('registerBtn');
    const errorMessage = document.getElementById('errorMessage');

    // Check if user is already logged in
    if (authService.isAuthenticated()) {
        window.location.href = '/dashboard';
        return;
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Basic validation
        if (password.length < 6) {
            errorMessage.textContent = 'Password must be at least 6 characters long';
            return;
        }

        // Show loading state
        registerBtn.textContent = 'Creating account...';
        registerBtn.disabled = true;
        errorMessage.textContent = '';

        try {
            console.log('[DEBUG] Starting Firebase registration...');
            const result = await authService.register(email, password, username);
            console.log('[DEBUG] Firebase registration result:', result);
            
            if (result.success && result.user && result.user.uid) {
                console.log('[DEBUG] Firebase registration successful, sending UID to Flask backend...');
                // Send UID to Flask backend to set session
                fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ firebase_uid: result.user.uid })
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
                console.error('[DEBUG] Firebase registration failed:', result.error);
                // Show error message
                errorMessage.textContent = result.error;
            }
        } catch (error) {
            errorMessage.textContent = 'An unexpected error occurred. Please try again.';
        } finally {
            // Reset button state
            registerBtn.textContent = 'Register';
            registerBtn.disabled = false;
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
});
