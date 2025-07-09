import authService from './auth-service.js';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    // Check if user is already logged in
    if (authService.isAuthenticated()) {
        window.location.href = '/';
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
            const result = await authService.login(email, password);
            
            if (result.success) {
                // Redirect to index.html after successful login
                window.location.href = '/';
            } else {
                // Show error message
                errorMessage.textContent = mapFirebaseError(result.error);
            }
        } catch (error) {
            errorMessage.textContent = 'An unexpected error occurred. Please try again.';
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
});
