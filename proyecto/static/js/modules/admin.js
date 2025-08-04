/**
 * ADMIN - JavaScript específico
 * Sistema de Gestión de Pastoreo
 */

document.addEventListener('DOMContentLoaded', function() {
    // Animaciones para las tarjetas
    const cards = document.querySelectorAll('.admin-card, .stats-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Hover effects para filas de usuarios
    const usuarioRows = document.querySelectorAll('.usuario-row');
    usuarioRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });

    // Generar avatares con colores aleatorios
    const avatars = document.querySelectorAll('.avatar');
    const colors = [
        'linear-gradient(45deg, #667eea, #764ba2)',
        'linear-gradient(45deg, #f093fb, #f5576c)',
        'linear-gradient(45deg, #4facfe, #00f2fe)',
        'linear-gradient(45deg, #43e97b, #38f9d7)',
        'linear-gradient(45deg, #fa709a, #fee140)',
        'linear-gradient(45deg, #a8edea, #fed6e3)',
        'linear-gradient(45deg, #ffecd2, #fcb69f)',
        'linear-gradient(45deg, #ff9a9e, #fecfef)'
    ];
    
    avatars.forEach((avatar, index) => {
        avatar.style.background = colors[index % colors.length];
    });
});