from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from flask_login import login_user, logout_user, login_required
from functools import wraps
from proyecto.models.models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Validar que los campos no estén vacíos
        if not email or not password:
            flash('Por favor completa todos los campos', 'danger')
            return render_template('login.html')
        
        # Verificar credenciales
        user = User.get_by_email(email)
        if user and user.check_password(password):
            # Iniciar sesión con Flask-Login
            login_user(user)
            
            next_page = request.args.get('next')
            if next_page:
                return redirect(next_page)
            
            # Redirigir al dashboard principal
            return redirect(url_for('dashboard_simple.index'))
        else:
            flash('Credenciales inválidas', 'danger')
    
    return render_template('login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        nombre = request.form.get('nombre')
        email = request.form.get('email')
        password = request.form.get('password')
        password_confirm = request.form.get('password_confirm')
        
        # Validar que los campos no estén vacíos
        if not nombre or not email or not password or not password_confirm:
            flash('Por favor completa todos los campos', 'danger')
            return render_template('register.html')
        
        # Validar que las contraseñas coincidan
        if password != password_confirm:
            flash('Las contraseñas no coinciden', 'danger')
            return render_template('register.html')
        
        # Verificar si el email ya está registrado
        existing_user = User.get_by_email(email)
        if existing_user:
            flash('Este correo electrónico ya está registrado', 'danger')
            return render_template('register.html')
        
        # Crear el usuario
        user_id = User.create(nombre, email, password)
        if user_id:
            flash('Usuario registrado exitosamente. Ahora puedes iniciar sesión', 'success')
            return redirect(url_for('auth.login'))
        else:
            flash('Error al registrar el usuario', 'danger')
    
    return render_template('register.html')

@auth_bp.route('/logout')
def logout():
    logout_user()
    flash('Has cerrado sesión correctamente', 'success')
    return redirect(url_for('auth.login')) 