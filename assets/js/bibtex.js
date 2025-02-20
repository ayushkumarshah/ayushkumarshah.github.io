document.addEventListener("DOMContentLoaded", () => {
    // Attach event listeners for Cite buttons
    document.querySelectorAll(".cite-btn").forEach(button => {
        button.addEventListener("click", () => {
            const targetId = button.dataset.target;
            const bibtexText = document.getElementById(targetId);
            const copyButton = button.parentElement.querySelector(".copy-btn");

            if (bibtexText.style.display === "none") {
                bibtexText.style.display = "block";
                copyButton.style.display = "inline-block";
                button.textContent = "🔽 Hide BibTeX";
            } else {
                bibtexText.style.display = "none";
                copyButton.style.display = "none";
                button.textContent = "📋 Cite";
            }
        });
    });

    // Attach event listeners for Copy buttons
    document.querySelectorAll(".copy-btn").forEach(button => {
        button.addEventListener("click", () => {
            const targetId = button.dataset.target;
            const bibtexText = document.getElementById(targetId);

            navigator.clipboard.writeText(bibtexText.value).then(() => {
                alert("📋 BibTeX copied to clipboard!");
            }).catch(err => {
                console.error("Failed to copy: ", err);
            });
        });
    });
});
