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
        const connectedContent = `
            <div class="text-center text-success my-3 py-3 border rounded bg-light">
                <i class="fab fa-whatsapp fa-4x mb-2 text-success"></i>
                <h5 class="font-weight-bold mb-1">WhatsApp Engine Terhubung!</h5>
                <p class="text-muted mb-1">Akun Sesi: <strong>${data.userName}</strong> (${data.userPhone})</p>
                <small class="text-secondary">Sistem siap melakukan pengiriman pesan pengingat.</small>
                <div class="mt-3">
                    <button class="btn btn-sm btn-outline-danger font-weight-bold" onclick="logoutWhatsAppEngine()">
                        <i class="fas fa-sign-out-alt mr-1"></i> Logout WhatsApp
                    </button>
                </div>
            </div>
        `;
        $('#qrContainer').html(connectedContent);
        $('#modalQrContainer').html(connectedContent);
    } else if (status === 'QR_READY' && data.qrDataUrl) {
        badgeHtml = `<span class="badge badge-warning px-3 py-2 text-dark"><i class="fas fa-qrcode mr-1"></i> Silakan Scan QR Code</span>`;
        const qrContent = `
            <div class="text-center my-2">
                <p class="text-muted font-weight-bold mb-2">Scan QR Code dengan WhatsApp Pegadaian:</p>
                <img src="${data.qrDataUrl}" alt="WhatsApp QR Code" class="img-fluid border p-2 shadow-sm rounded bg-white" style="max-width: 240px;">
                <div class="mt-2 text-muted small"><i class="fas fa-sync fa-spin mr-1"></i> Menunggu pemindaian dari HP...</div>
            </div>
        `;
        $('#qrContainer').html(qrContent);
        $('#modalQrContainer').html(qrContent);
    } else if (status === 'INITIALIZING') {
        badgeHtml = `<span class="badge badge-info px-3 py-2"><i class="fas fa-spinner fa-spin mr-1"></i> Mempersiapkan Engine...</span>`;
        const initContent = `
            <div class="text-center py-4 text-info">
                <i class="fas fa-circle-notch fa-spin fa-3x mb-3 text-success"></i>
                <h6 class="font-weight-bold text-dark">Menginisialisasi WhatsApp Engine...</h6>
                <p class="text-muted small mb-0">Memuat browser Puppeteer lokal. Mohon tunggu beberapa detik...</p>
            </div>
        `;
        $('#qrContainer').html(initContent);
        $('#modalQrContainer').html(initContent);
    } else {
        badgeHtml = `<span class="badge badge-danger px-3 py-2"><i class="fas fa-times-circle mr-1"></i> Terputus (Disconnected)</span>`;
        const disconnectedContent = `
            <div class="text-center py-3">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-2"></i>
                <p class="text-muted mb-2">Session WhatsApp belum aktif.</p>
                <button class="btn btn-success font-weight-bold" onclick="initWhatsAppEngine()">
                    <i class="fas fa-power-off mr-1"></i> Hubungkan WhatsApp Engine
                </button>
            </div>
        `;
        $('#qrContainer').html(disconnectedContent);
        $('#modalQrContainer').html(disconnectedContent);
    }

    $('#waStatusBadge').html(badgeHtml);
}

function openWhatsAppModal() {
    $('#waQRModal').modal('show');
    checkWhatsAppStatus();
    initWhatsAppEngine();
}

function initWhatsAppEngine() {
    $.ajax({
        url: 'http://localhost:3000/api/whatsapp/init',
        method: 'POST',
        success: function(res) {
            checkWhatsAppStatus();
        },
        error: function(err) {
            console.error('Gagal menginisialisasi WhatsApp Engine:', err);
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
    waPollInterval = setInterval(checkWhatsAppStatus, 3000);
});
