$(document).ready(function () {
    $('#loginForm').on('submit', function (e) {
        e.preventDefault();

        var username = $('#username').val();
        var password = $('#password').val();

        // Validasi username dan password
        if (username === 'admin123' && password === '08') {
            // Jika benar, arahkan ke data.html
            window.location.href = 'data.html';
        } else {
            // Jika salah, tampilkan pesan error
            $('#error-message').fadeIn();
        }
    });
});
