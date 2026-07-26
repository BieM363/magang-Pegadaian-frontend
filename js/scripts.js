$(document).ready(function () {
    $('#reminderForm').on('submit', function (event) {
        event.preventDefault(); // Mencegah reload halaman

        // Ambil nilai dari input form
        var name = $('#name').val();
        var phone = $('#phone').val();
        var item = $('#item').val(); // Ambil nilai dari input "Barang Gadai"
        var amount = $('#amount').val();
        var dueDate = $('#dueDate').val();

        // Validasi sederhana untuk memastikan semua bidang diisi
        if (name === "" || phone === "" || item === "" || dueDate === "" || amount === "") {
            $('#message').html('<div class="alert alert-danger">Harap isi semua bidang!</div>');
            return;
        }

        // Kirim data ke backend melalui AJAX
        $.ajax({
            url: 'http://localhost:3000/api/reminders', // URL API backend
            method: 'POST',
            contentType: 'application/json', // Mengatur tipe konten ke JSON
            data: JSON.stringify({  // Kirim data dalam format JSON
                name: name,
                phone: phone,
                item: item,
                amount: amount,
                dueDate: dueDate
            }),
            success: function (response) {
                $('#message').html('<div class="alert alert-success">Pengingat berhasil dibuat!</div>');
                $('#reminderForm')[0].reset(); // Reset form setelah submit berhasil
            },
            error: function (error) {
                $('#message').html('<div class="alert alert-danger">Terjadi kesalahan. Silakan coba lagi.</div>');
                console.error('Error:', error); // Tampilkan pesan kesalahan di konsol
            }
        });
    });
});
