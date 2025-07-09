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
            const result = await authService.register(email, password, username);
            
            if (result.success) {
                // Redirect to dashboard
                window.location.href = '/dashboard';
            } else {
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
