/**
 * Frontend Authentication & API Helper
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const API_BASE_URL = 'http://localhost:3000/api';

function getAuthToken() {
    return localStorage.getItem('pegadaian_token');
}

function setAuthToken(token) {
    localStorage.setItem('pegadaian_token', token);
}

function removeAuthToken() {
    localStorage.removeItem('pegadaian_token');
    localStorage.removeItem('pegadaian_user');
}

function getSavedUser() {
    const user = localStorage.getItem('pegadaian_user');
    return user ? JSON.parse(user) : null;
}

function setSavedUser(user) {
    localStorage.setItem('pegadaian_user', JSON.stringify(user));
}

// Global AJAX Setup with JWT Bearer Header
$.ajaxSetup({
    beforeSend: function (xhr) {
        const token = getAuthToken();
        if (token) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        }
    }
});

function checkAuthProtection() {
    const token = getAuthToken();
    const currentPage = window.location.pathname.split('/').pop();

    if (!token && currentPage !== 'login.html' && currentPage !== 'index.html' && currentPage !== 'dashboard.html' && currentPage !== '') {
        window.location.href = 'login.html';
    }
}

// Execute protection check
$(document).ready(function () {
    checkAuthProtection();
});
