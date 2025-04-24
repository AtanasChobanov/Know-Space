function openPopup() {
    document.getElementById('passwordPopup').style.display = 'flex';
    document.body.classList.add('popup-open');
}

function closePopup() {
    document.getElementById('passwordPopup').style.display = 'none';
    document.body.classList.remove('popup-open');
}

function openPicturePopup() {
    console.log("Opening picture popup");
    document.getElementById('picturePopup').style.display = 'flex';
    document.body.classList.add('popup-open');
}

function closePicturePopup() {
    document.getElementById('picturePopup').style.display = 'none';
    document.body.classList.remove('popup-open');
}

document.getElementById('profile-pictures').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const fileContainer = document.getElementById('fileContainer');
            fileContainer.style.backgroundImage = `url(${event.target.result})`;
            fileContainer.style.backgroundSize = 'cover';
            fileContainer.style.backgroundPosition = 'center';

            document.getElementById('fileLabel').style.display = 'none';
        }
        reader.readAsDataURL(file);
    }
});

document.getElementById('uploadForm').addEventListener('submit', function (e) {
    const fileInput = document.getElementById('profile-pictures');
    if (fileInput.files.length === 0) {
        e.preventDefault();
        alert('Моля, изберете снимка');
        return false;
    }

    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Качване...';

    return true;
});

document.getElementById('deleteForm')?.addEventListener('submit', function (e) {
    if (!confirm('Сигурни ли сте, че искате да изтриете профилната си снимка?')) {
        e.preventDefault();
        return false;
    }

    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Изтриване...';

    return true;
});

document.getElementById('passwordPopup').addEventListener('click', function (e) {
    if (e.target === this) {
        closePopup();
    }
});

document.getElementById('picturePopup').addEventListener('click', function (e) {
    if (e.target === this) {
        closePicturePopup();
    }
});

document.getElementById('picturePopup').addEventListener('hidden', function () {
    const fileInput = document.getElementById('profile-pictures');
    fileInput.value = '';

    const fileContainer = document.getElementById('fileContainer');
    fileContainer.style.backgroundImage = '';
    fileContainer.style.backgroundSize = '';
    fileContainer.style.backgroundPosition = '';

    document.getElementById('fileLabel').style.display = 'block';
});