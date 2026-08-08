/**
 * Data Management, Single Send, Edit & Template Editor Script
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

let activeTemplateId = null;

// Load data from API with active filters
function loadData() {
    const search = $('#searchFilter').val() || '';
    const dueDate = $('#dueDateFilter').val() || '';
    const status = $('#statusFilter').val() || '';

    let queryParams = [];
    if (search) queryParams.push('search=' + encodeURIComponent(search));
    if (dueDate) queryParams.push('dueDate=' + encodeURIComponent(dueDate));
    if (status) queryParams.push('status=' + encodeURIComponent(status));

    const url = 'http://localhost:3000/api/reminders' + (queryParams.length > 0 ? '?' + queryParams.join('&') : '');

    $.ajax({
        url: url,
        method: 'GET',
        success: function(response) {
            let reminderData = '';
            const data = response.data || [];

            if (data.length === 0) {
                $('#reminderData').html(`
                    <tr>
                        <td colspan="8" class="text-center text-muted py-4">
                            <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
                            Tidak ada data pengingat pembayaran yang ditemukan.
                        </td>
                    </tr>
                `);
                updateBadgeCounters(0, 0, 0, 0);
                return;
            }

            let pendingCount = 0, queuedCount = 0, sentCount = 0, failedCount = 0;

            data.forEach(function(reminder) {
                // Status Badge styling
                let statusBadge = '';
                if (reminder.status === 'pending') {
                    statusBadge = '<span class="badge badge-warning text-dark"><i class="fas fa-clock mr-1"></i> Pending</span>';
                    pendingCount++;
                } else if (reminder.status === 'queued') {
                    statusBadge = '<span class="badge badge-info"><i class="fas fa-spinner fa-spin mr-1"></i> Queued</span>';
                    queuedCount++;
                } else if (reminder.status === 'sent') {
                    statusBadge = '<span class="badge badge-success"><i class="fas fa-check-circle mr-1"></i> Sent</span>';
                    sentCount++;
                } else if (reminder.status === 'failed') {
                    statusBadge = '<span class="badge badge-danger"><i class="fas fa-exclamation-triangle mr-1"></i> Failed</span>';
                    failedCount++;
                }

                const formattedAmount = Number(reminder.amount).toLocaleString('id-ID');

                reminderData += `
                    <tr>
                        <td><strong>${reminder.no_surat || 'PGD-' + reminder.id}</strong></td>
                        <td>${reminder.name}</td>
                        <td><a href="https://wa.me/${reminder.phone}" target="_blank" class="text-success font-weight-bold"><i class="fab fa-whatsapp mr-1"></i>${reminder.phone}</a></td>
                        <td>${reminder.item}</td>
                        <td>Rp ${formattedAmount}</td>
                        <td>${reminder.due_date}</td>
                        <td>${statusBadge}</td>
                        <td class="text-center" style="white-space: nowrap;">
                            <button class="btn btn-sm btn-success mr-1 font-weight-bold" onclick="sendSingleWhatsApp(${reminder.id})" title="Kirim WA ke nomor ini saja">
                                <i class="fab fa-whatsapp"></i> Kirim WA
                            </button>
                            <button class="btn btn-sm btn-primary mr-1 font-weight-bold" onclick="openEditModal(${reminder.id})" title="Edit Data">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger font-weight-bold" onclick="deleteReminder(${reminder.id})" title="Hapus Data">
                                <i class="fas fa-trash-alt"></i> Hapus
                            </button>
                        </td>
                    </tr>
                `;
            });

            $('#reminderData').html(reminderData);
            updateBadgeCounters(data.length, pendingCount, queuedCount, sentCount, failedCount);
        },
        error: function(err) {
            console.error('Gagal mengambil data:', err);
            $('#reminderData').html(`
                <tr>
                    <td colspan="8" class="text-center text-danger py-4">
                        Gagal terhubung ke backend server API (http://localhost:3000). Pastikan server backend sedang berjalan.
                    </td>
                </tr>
            `);
        }
    });
}

function updateBadgeCounters(total, pending, queued, sent, failed) {
    $('#countTotal').text(total);
    $('#countPending').text(pending);
    $('#countQueued').text(queued);
    $('#countSent').text(sent);
}

// Revision 3: Send single WhatsApp message to 1 specific number (even if already sent/failed)
function sendSingleWhatsApp(id) {
    if (!confirm('Kirim pesan pengingat WhatsApp ke nomor ini saja?')) {
        return;
    }

    $.ajax({
        url: `http://localhost:3000/api/reminders/${id}/resend`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({}),
        success: function(res) {
            alert(res.message || 'Pesan pengingat berhasil dikirim!');
            loadData();
        },
        error: function(xhr) {
            var msg = 'Gagal mengirim pesan WhatsApp.';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                msg = xhr.responseJSON.message;
            }
            alert(msg);
        }
    });
}

// Revision 4: Open Edit Modal for ANY reminder (pending, queued, sent, failed)
function openEditModal(id) {
    $.ajax({
        url: `http://localhost:3000/api/reminders/${id}`,
        method: 'GET',
        success: function(res) {
            const data = res.data;
            if (!data) return;

            $('#editId').val(data.id);
            $('#editNoSurat').val(data.no_surat || '');
            $('#editName').val(data.name || '');
            $('#editPhone').val(data.phone || '');
            $('#editItem').val(data.item || '');
            $('#editAmount').val(data.amount || '');
            $('#editDueDate').val(data.due_date ? String(data.due_date).split('T')[0] : '');
            $('#editStatus').val(data.status || 'pending');

            $('#editModal').modal('show');
        },
        error: function(err) {
            alert('Gagal memuat detail data pengingat.');
        }
    });
}

// Save Edit Reminder
function saveEditReminder() {
    const id = $('#editId').val();
    const noSurat = $('#editNoSurat').val().trim();
    const name = $('#editName').val().trim();
    const phone = $('#editPhone').val().trim();
    const item = $('#editItem').val().trim();
    const amount = $('#editAmount').val();
    const dueDate = $('#editDueDate').val();
    const status = $('#editStatus').val();

    if (!name || !phone || !item || !amount || !dueDate) {
        alert('Mohon isi bidang yang wajib!');
        return;
    }

    $.ajax({
        url: `http://localhost:3000/api/reminders/${id}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
            noSurat,
            name,
            phone,
            item,
            amount,
            dueDate,
            status
        }),
        success: function(res) {
            alert('Data pengingat berhasil diperbarui!');
            $('#editModal').modal('hide');
            loadData();
        },
        error: function(xhr) {
            alert('Gagal memperbarui data pengingat.');
        }
    });
}

// Revision 2: Template Editor Modal Logic
function openTemplateModal() {
    $.ajax({
        url: 'http://localhost:3000/api/templates/active',
        method: 'GET',
        success: function(res) {
            if (res.data) {
                activeTemplateId = res.data.id;
                $('#templateTitle').val(res.data.title || 'Template Pengingat');
                $('#templateBody').val(res.data.template_body || '');
                updateTemplatePreview();
            }
            $('#templateModal').modal('show');
        },
        error: function(err) {
            alert('Gagal memuat template pesan.');
        }
    });
}

function insertPlaceholder(tag) {
    const textarea = document.getElementById('templateBody');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    textarea.value = text.substring(0, start) + tag + text.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + tag.length;
    updateTemplatePreview();
}

function updateTemplatePreview() {
    let text = $('#templateBody').val() || '';
    text = text.replace(/\*nama\*/gi, 'Ahmad Hidayat');
    text = text.replace(/\*nosurat\*/gi, 'PGD-2026-088');
    text = text.replace(/\*barang\*/gi, 'Emas Batangan 5 Gram');
    text = text.replace(/\*harga\*/gi, '2.500.000');
    text = text.replace(/\*tanggal\*/gi, '2026-08-15');
    $('#templatePreview').text(text);
}

function saveTemplate() {
    const title = $('#templateTitle').val().trim();
    const templateBody = $('#templateBody').val();

    if (!title || !templateBody) {
        alert('Judul dan isi template wajib diisi!');
        return;
    }

    if (activeTemplateId) {
        $.ajax({
            url: `http://localhost:3000/api/templates/${activeTemplateId}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                title,
                templateBody,
                isActive: true
            }),
            success: function(res) {
                alert('Template pesan dinamis berhasil disimpan!');
                $('#templateModal').modal('hide');
            },
            error: function(err) {
                alert('Gagal menyimpan template pesan.');
            }
        });
    } else {
        $.ajax({
            url: 'http://localhost:3000/api/templates',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                title,
                templateBody,
                isActive: true
            }),
            success: function(res) {
                alert('Template pesan berhasil dibuat!');
                $('#templateModal').modal('hide');
            }
        });
    }
}

// Delete reminder by ID
function deleteReminder(id) {
    if (confirm('Apakah Anda yakin ingin menghapus pengingat ini?')) {
        $.ajax({
            url: `http://localhost:3000/api/reminders/${id}`,
            method: 'DELETE',
            success: function() {
                alert('Pengingat berhasil dihapus.');
                loadData();
            },
            error: function(err) {
                alert('Gagal menghapus data.');
            }
        });
    }
}

// Trigger WhatsApp Blasting Queue
function startWhatsAppBlast() {
    if (!confirm('Apakah Anda yakin ingin memulai blasting pesan pengingat WhatsApp ke semua nasabah berstatus PENDING?')) {
        return;
    }

    $('#blastBtn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-1"></i> Memproses Blasting...');

    $.ajax({
        url: 'http://localhost:3000/api/reminders/blast',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({}),
        success: function(res) {
            alert(res.message);
            $('#blastBtn').prop('disabled', false).html('<i class="fab fa-whatsapp mr-1"></i> Mulai WhatsApp Blast');
            loadData();
        },
        error: function(xhr) {
            $('#blastBtn').prop('disabled', false).html('<i class="fab fa-whatsapp mr-1"></i> Mulai WhatsApp Blast');
            var msg = 'Gagal memulai blasting WhatsApp.';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                msg = xhr.responseJSON.message;
            }
            alert(msg);
        }
    });
}

// Import Excel File via Server API
function importExcelBackend() {
    const fileInput = document.getElementById('importExcel');
    const file = fileInput.files[0];

    if (!file) {
        alert('Harap pilih file Excel (.xlsx / .xls) terlebih dahulu!');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    $('#importBtn').prop('disabled', true).text('Mengunggah...');

    $.ajax({
        url: 'http://localhost:3000/api/reminders/import-excel',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(res) {
            alert(res.message);
            fileInput.value = '';
            $('#importBtn').prop('disabled', false).text('Import Excel');
            loadData();
        },
        error: function(xhr) {
            $('#importBtn').prop('disabled', false).text('Import Excel');
            var msg = 'Gagal mengimpor file Excel.';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                msg = xhr.responseJSON.message;
            }
            alert(msg);
        }
    });
}

// Export Excel Report via Server API
function exportExcelBackend() {
    window.location.href = 'http://localhost:3000/api/reminders/export-excel';
}

// Download PDF Client side
function downloadPDF() {
    if (typeof window.jspdf === 'undefined') {
        alert('Library jsPDF belum dimuat.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    doc.text('Laporan Data Pengingat Pembayaran - Pegadaian Gorontalo Sentral', 14, 15);

    const data = [];
    $('#reminderData tr').each(function() {
        const row = [];
        $(this).find('td').each(function(index) {
            if (index < 7) {
                row.push($(this).text().trim());
            }
        });
        if (row.length > 0) {
            data.push(row);
        }
    });

    doc.autoTable({
        head: [['No Surat', 'Nama Pelanggan', 'Nomor Telepon', 'Barang Gadai', 'Jumlah Pembayaran', 'Tanggal Jatuh Tempo', 'Status']],
        body: data,
        startY: 25,
    });

    doc.save('Laporan-Pengingat-Pegadaian-BieM363.pdf');
}

// Clear all search filters
function resetFilters() {
    $('#searchFilter').val('');
    $('#dueDateFilter').val('');
    $('#statusFilter').val('');
    loadData();
}

$(document).ready(function() {
    loadData();

    // Attach Search Filter event listeners
    $('#searchFilter').on('keyup', function() {
        loadData();
    });

    $('#statusFilter, #dueDateFilter').on('change', function() {
        loadData();
    });

    $('#templateBody').on('input', function() {
        updateTemplatePreview();
    });
});
