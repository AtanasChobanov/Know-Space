document.addEventListener('DOMContentLoaded', function () {
    function openImageModal(postId) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postElement) {
            console.error(`No element found with data-post-id="${postId}"`);
            return;
        }

        const images = postElement.querySelectorAll('.post-images img');
        if (images.length === 0) {
            console.error(`No images found for post with data-post-id="${postId}"`);
            return;
        }

        const modal = document.createElement('div');
        modal.classList.add('image-modal');

        const modalContent = document.createElement('div');
        modalContent.classList.add('modal-content');

        images.forEach(img => {
            const imgElement = document.createElement('img');
            imgElement.src = img.src;
            imgElement.alt = img.alt;
            imgElement.classList.add('modal-image');
            modalContent.appendChild(imgElement);
        });

        const closeButton = document.createElement('button');
        closeButton.classList.add('close-modal');
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => modal.remove());

        modal.appendChild(modalContent);
        modal.appendChild(closeButton);

        document.body.appendChild(modal);
    }

    document.querySelectorAll('.view-all-images').forEach(button => {
        button.addEventListener('click', () => {
            const postId = button.getAttribute('data-post-id');
            openImageModal(postId);
        });
    });

    document.querySelectorAll('.more-images-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            const postId = overlay.getAttribute('data-post-id');
            openImageModal(postId);
        });
    });
});