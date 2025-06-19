function toggleForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Check which form is currently visible
    const isShowingRegister = !registerForm.classList.contains('hidden');
    
    // Toggle visibility
    loginForm.classList.toggle('hidden');
    registerForm.classList.toggle('hidden');
    
    // Update URL
    const newFormType = isShowingRegister ? 'login' : 'register';
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('form_type', newFormType);
    window.history.pushState({}, '', newUrl.toString());
}
