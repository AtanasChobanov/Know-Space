function showChannelDeletePopup(channelId, channelName) {
    const overlay = document.getElementById('channelDeleteOverlay');
    const popup = document.getElementById('channelDeletePopup');
    const message = document.getElementById('channelDeleteMessage');
    const form = document.getElementById('channelDeleteForm');

    message.textContent = `Сигурни ли сте, че искате да изтриете канала: "${channelName}"?`;
    form.action = `/${channelId}/delete?_method=DELETE`;

    overlay.style.display = 'block';
    popup.style.display = 'block';
    document.body.classList.add('popup-open');
}

function closeChannelDeletePopup() {
    document.getElementById('channelDeleteOverlay').style.display = 'none';
    document.getElementById('channelDeletePopup').style.display = 'none';
    document.body.classList.remove('popup-open');
}

document.getElementById('channelDeleteOverlay').addEventListener('click', closeChannelDeletePopup);