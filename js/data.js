// Fungsi untuk memuat data dari API
function loadData() {
    $.ajax({
        url: 'http://localhost:3000/api/reminders', // URL API untuk mendapatkan data
        method: 'GET',
        success: function(data) {
            let reminderData = '';

            // Looping data dan menambahkannya ke tabel
            data.forEach(function(reminder) {
                reminderData += `
                    <tr>
                        <td>${reminder.name}</td>
                        <td>${reminder.phone}</td>
                        <td>${reminder.item}</td>
                        <td>${reminder.amount}</td>
                        <td>${reminder.dueDate}</td>
                        <td>
                            <button class="delete-button" onclick="deleteReminder(${reminder.id})">Hapus</button>
                        </td>
                    </tr>
                `;
            });

            // Menampilkan data di dalam tabel
            $('#reminderData').html(reminderData);
        },
        error: function(err) {
            console.error('Gagal mengambil data:', err);
        }
    });
}

// Fungsi untuk menghapus pengingat berdasarkan ID
function deleteReminder(id) {
    if (confirm('Apakah Anda yakin ingin menghapus pengingat ini?')) {
        $.ajax({
            url: `http://localhost:3000/api/reminders/${id}`, // URL API untuk menghapus data
            method: 'DELETE',
            success: function() {
                alert('Pengingat berhasil dihapus');
                loadData(); // Refresh data setelah penghapusan
            },
            error: function(err) {
                console.error('Gagal menghapus data:', err);
            }
        });
    }
}

// Fungsi untuk mengunduh data dalam format PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Menambahkan judul PDF
    doc.text('Data Pengingat Pembayaran', 10, 10);

    // Mengambil data dari tabel
    const data = [];
    $('#reminderData tr').each(function() {
        const row = [];
        $(this).find('td').each(function() {
            row.push($(this).text());
        });
        data.push(row);
    });

    // Memasukkan data ke dalam PDF
    doc.autoTable({
        head: [['Nama Pelanggan', 'Nomor Telepon', 'Barang Gadai', 'Jumlah Pembayaran', 'Tanggal Jatuh Tempo']],
        body: data,
    });

    // Mengunduh PDF
    doc.save('data-pengingat-pembayaran.pdf');
}

// Fungsi untuk mengimpor data dari file Excel
function importExcel() {
    const fileInput = document.getElementById('importExcel');
    const file = fileInput.files[0];
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        // Mendapatkan data dari file Excel
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Mengimpor data ke tabel (dapat disesuaikan sesuai struktur JSON)
        jsonData.forEach(function(row) {
            if (row.length > 0) {
                const reminderData = `
                    <tr>
                        <td>${row[0]}</td>
                        <td>${row[1]}</td>
                        <td>${row[2]}</td>
                        <td>${row[3]}</td>
                        <td>${row[4]}</td>
                    </tr>
                `;
                $('#reminderData').append(reminderData);
            }
        });
    };

    reader.readAsArrayBuffer(file);
}

// Memuat data saat halaman pertama kali dibuka
$(document).ready(function() {
    loadData();
});
