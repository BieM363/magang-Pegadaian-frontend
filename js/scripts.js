/**
 * Reminder Scheduling Form Handler
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

$(document).ready(function () {
    $('#reminderForm').on('submit', function (event) {
        event.preventDefault(); // Prevent page reload

        // Ambil nilai dari input form
        var name = $('#name').val().trim();
        var phone = $('#phone').val().trim();
        var item = $('#item').val().trim();
        var amount = $('#amount').val().trim();
        var dueDate = $('#dueDate').val();
        var noSurat = $('#noSurat') ? $('#noSurat').val() : '';

        // Validasi sederhana
        if (name === "" || phone === "" || item === "" || dueDate === "" || amount === "") {
            $('#message').html('<div class="alert alert-danger font-weight-bold">Harap isi semua bidang form!</div>');
            return;
        }

        // Send data to backend REST API
        $.ajax({
            url: 'http://localhost:3000/api/reminders',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                name: name,
                phone: phone,
                item: item,
                amount: amount,
                dueDate: dueDate,
                noSurat: noSurat
            }),
            success: function (response) {
                $('#message').html(`
                    <div class="alert alert-success shadow-sm">
                        <i class="fas fa-check-circle mr-2"></i>
                        Pengingat pembayaran untuk <strong>${response.data.name}</strong> berhasil dibuat!
                    </div>
                `);
                $('#reminderForm')[0].reset(); // Reset form
            },
            error: function (xhr) {
                var errText = 'Terjadi kesalahan saat membuat pengingat.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errText = xhr.responseJSON.message;
                }
                $('#message').html(`<div class="alert alert-danger font-weight-bold">${errText}</div>`);
                console.error('Error:', xhr);
            }
        });
    });
});
