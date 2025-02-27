document.addEventListener("DOMContentLoaded", async function () {
    document.querySelectorAll(".vote-container").forEach(async (container) => {
        const postId = container.getAttribute("data-post-id");
        const voteCountElement = document.getElementById(`vote-count-${postId}`);
        const upvoteButton = container.querySelector(`.upvote[data-post-id="${postId}"]`);
        const downvoteButton = container.querySelector(`.downvote[data-post-id="${postId}"]`);

        try {
            const voteResponse = await fetch(`/posts/${postId}/votes`);
            const voteData = await voteResponse.json();

            // Обновяване на броя на гласовете
            voteCountElement.textContent = voteData.upvotes - voteData.downvotes;

            // Проверка за гласа на потребителя
            if (voteData.user_vote === 1) {
                upvoteButton.classList.add("active");
            } else if (voteData.user_vote === -1) {
                downvoteButton.classList.add("active");
            }
        } catch (error) {
            console.error("Error fetching votes:", error);
        }
    });
});

document.querySelectorAll(".vote-button").forEach(button => {
    button.addEventListener("click", async function () {
        const postId = this.getAttribute("data-post-id");
        const voteType = this.classList.contains("upvote") ? 1 : -1;
        const voteCountElement = document.getElementById(`vote-count-${postId}`);
        const upvoteButton = document.querySelector(`.upvote[data-post-id="${postId}"]`);
        const downvoteButton = document.querySelector(`.downvote[data-post-id="${postId}"]`);

        try {
            const response = await fetch(`/posts/${postId}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ voteType })
            });

            // Взимаме новите данни
            const voteResponse = await fetch(`/posts/${postId}/votes`);
            const voteData = await voteResponse.json();

            voteCountElement.textContent = voteData.upvotes - voteData.downvotes;

            // Обновяване на активните бутони
            upvoteButton.classList.remove("active");
            downvoteButton.classList.remove("active");

            if (voteData.user_vote === 1) {
                upvoteButton.classList.add("active");
            } else if (voteData.user_vote === -1) {
                downvoteButton.classList.add("active");
            }
        } catch (error) {
            console.error("Error voting:", error);
        }
    });
});
