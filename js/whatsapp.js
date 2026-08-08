/**
 * WhatsApp Engine Frontend Helper & QR Code Poller
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

let waPollInterval = null;

function checkWhatsAppStatus() {
    $.ajax({
        url: 'http://localhost:3000/api/whatsapp/status',
        method: 'GET',
        success: function(res) {
            updateWhatsAppUI(res);
        },
        error: function(err) {
            $('#waStatusBadge').html('<span class="badge badge-secondary"><i class="fas fa-server"></i> API Offline</span>');
        }
    });
}

function updateWhatsAppUI(data) {
    const status = data.status || 'DISCONNECTED';
    let badgeHtml = '';

    if (status === 'CONNECTED') {
        badgeHtml = `<span class="badge badge-success px-3 py-2"><i class="fas fa-check-circle mr-1"></i> Terhubung: ${data.userName || 'Pegadaian'} (${data.userPhone || ''})</span>`;
        $('#qrContainer').html(`
            <div class="text-center text-success my-3 py-4 border rounded bg-light">
                <i class="fab fa-whatsapp fa-4x mb-2 text-success"></i>
                <h5 class="font-weight-bold">WhatsApp Engine Terhubung!</h5>
                <p class="text-muted mb-0">Akun: ${data.userName} (${data.userPhone})</p>
                <small class="text-secondary">Sistem siap melakukan blasting pesan pengingat.</small>
            </div>
        `);
    } else if (status === 'QR_READY' && data.qrDataUrl) {
        badgeHtml = `<span class="badge badge-warning px-3 py-2 text-dark"><i class="fas fa-qrcode mr-1"></i> Silakan Scan QR Code</span>`;
        $('#qrContainer').html(`
            <div class="text-center my-2">
                <p class="text-muted font-weight-bold mb-2">Scan QR Code dengan Aplikasi WhatsApp Pegadaian:</p>
                <img src="${data.qrDataUrl}" alt="WhatsApp QR Code" class="img-fluid border p-2 shadow-sm rounded" style="max-width: 250px;">
                <div class="mt-2 text-muted small"><i class="fas fa-sync fa-spin mr-1"></i> Menunggu pemindaian...</div>
            </div>
        `);
    } else if (status === 'INITIALIZING') {
        badgeHtml = `<span class="badge badge-info px-3 py-2"><i class="fas fa-spinner fa-spin mr-1"></i> Menginisialisasi Puppeteer...</span>`;
        $('#qrContainer').html(`
            <div class="text-center py-4 text-info">
                <i class="fas fa-spinner fa-spin fa-3x mb-2"></i>
                <p>Mempersiapkan Local WhatsApp Engine...</p>
            </div>
        `);
    } else {
        badgeHtml = `<span class="badge badge-danger px-3 py-2"><i class="fas fa-times-circle mr-1"></i> Terputus (Disconnected)</span>`;
        $('#qrContainer').html(`
            <div class="text-center py-4">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-2"></i>
                <p class="text-muted">Session WhatsApp belum aktif.</p>
                <button class="btn btn-sm btn-success" onclick="initWhatsAppEngine()">
                    <i class="fas fa-power-off mr-1"></i> Hubungkan WhatsApp Engine
                </button>
            </div>
        `);
    }

    $('#waStatusBadge').html(badgeHtml);
}

function initWhatsAppEngine() {
    $.ajax({
        url: 'http://localhost:3000/api/whatsapp/init',
        method: 'POST',
        success: function(res) {
            checkWhatsAppStatus();
        },
        error: function(err) {
            alert('Gagal menginisialisasi WhatsApp Engine.');
        }
    });
}

function logoutWhatsAppEngine() {
    if (confirm('Apakah Anda yakin ingin mengakhiri sesi WhatsApp?')) {
        $.ajax({
            url: 'http://localhost:3000/api/whatsapp/logout',
            method: 'POST',
            success: function(res) {
                alert('Sesi WhatsApp berhasil dikeluar (logged out).');
                checkWhatsAppStatus();
            }
        });
    }
}

$(document).ready(function() {
    checkWhatsAppStatus();
    waPollInterval = setInterval(checkWhatsAppStatus, 4000);
});
