/**
 * Admin Login Handler (JWT Authentication)
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

$(document).ready(function () {
    $('#loginForm').on('submit', function (e) {
        e.preventDefault();

        var username = $('#username').val().trim();
        var password = $('#password').val().trim();

        if (!username || !password) {
            $('#error-message').text('Mohon isi username dan password.').fadeIn();
            return;
        }

        // Call JWT Login API Endpoint
        $.ajax({
            url: 'http://localhost:3000/api/auth/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                username: username,
                password: password
            }),
            success: function (response) {
                if (response.success && response.token) {
                    setAuthToken(response.token);
                    setSavedUser(response.user);
                    
                    $('#error-message').hide();
                    alert('Login Admin Berhasil! Selamat Datang, ' + response.user.name);
                    window.location.href = 'data.html';
                } else {
                    $('#error-message').text(response.message || 'Login gagal.').fadeIn();
                }
            },
            error: function (xhr) {
                var errMessage = 'Username atau password salah!';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errMessage = xhr.responseJSON.message;
                }
                $('#error-message').text(errMessage).fadeIn();
            }
        });
    });
});
