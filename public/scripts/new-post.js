document.getElementById("post-form").addEventListener("submit", function () {
    document.getElementById("hidden-content").value = document.getElementById("editor").innerHTML;
});

const MAX_IMAGES = 5;
const MAX_DOCUMENTS = 1;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

let uploadedDocuments = [];
let uploadedImages = [];

function execCmd(command, value = null, event) {
    event.preventDefault(); // Предотвратява изпращането на формата
    document.execCommand(command, false, value);
}

function changeFont(font) {
    document.execCommand('fontName', false, font);
}

function handleDocumentUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (uploadedDocuments.length >= MAX_DOCUMENTS) {
        showError(`Можеш да качваш ${MAX_DOCUMENTS} документ!`);
        return;
    }

    uploadedDocuments.push(file);
    updateDocumentList();

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('document-container').classList.add('with-file');
    };
    reader.readAsDataURL(file);
}

function handleImageUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > MAX_IMAGES) {
        showError(`Можеш да качваш ${MAX_IMAGES} снимки!`);
        event.target.value = '';
    }

    for (let i = 0; i < files.length && uploadedImages.length < MAX_IMAGES; i++) {
        const file = files[i];
        if (file.size > MAX_FILE_SIZE) {
            showError(`File ${file.name} Надвишава лимитът на нясто!`);
            continue;
        }

        uploadedImages.push(file);
    }

    updateImageList();
    document.getElementById('image-container').classList.add('with-file');
}

function updateDocumentList() {
    const documentList = document.getElementById('document-list');
    documentList.innerHTML = '';

    uploadedDocuments.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.textContent = file.name;

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-button';
        removeButton.innerHTML = '×';
        removeButton.onclick = () => removeDocument(index);

        fileItem.appendChild(removeButton);
        documentList.appendChild(fileItem);
    });
}

function updateImageList() {
    const imageList = document.getElementById('image-list');
    imageList.innerHTML = ''; // Clear the current list

    // Regenerate the list with the current uploadedImages array
    uploadedImages.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.style.backgroundImage = `url(${URL.createObjectURL(file)})`;

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-button';
        removeButton.innerHTML = '×';
        removeButton.onclick = () => removeImage(index);

        fileItem.appendChild(removeButton);
        imageList.appendChild(fileItem);
    });
}

function removeDocument(index) {
    uploadedDocuments.splice(index, 1);
    updateDocumentList();
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    updateImageList();
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';

    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}