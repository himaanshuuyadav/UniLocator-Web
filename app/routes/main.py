from flask import Blueprint, render_template, redirect, url_for, session

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    # Always redirect to dashboard for the root URL
    return redirect(url_for('main.dashboard'))

@bp.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@bp.route('/home')
def home():
    # This will show index.html only when logged in
    if 'user_id' not in session:
        return redirect(url_for('main.dashboard'))
    return render_template('index.html')