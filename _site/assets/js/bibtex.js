document.addEventListener("DOMContentLoaded", function () {
    // Toggle BibTeX display
    document.querySelectorAll(".cite-btn").forEach(button => {
        button.addEventListener("click", function () {
            const targetId = this.getAttribute("data-target");
            const bibtexText = document.getElementById(targetId);
            const copyButton = document.querySelector(`#copy-btn-${targetId.replace("bibtex-", "")}`);

            if (bibtexText.style.display === "none") {
                bibtexText.style.display = "block";
                copyButton.style.display = "inline-block";
                this.textContent = "🔽 Hide BibTeX";
            } else {
                bibtexText.style.display = "none";
                copyButton.style.display = "none";
                this.textContent = "📋 Cite";
            }
        });
    });

    // Copy BibTeX to Clipboard
    document.querySelectorAll(".copy-btn").forEach(button => {
        button.addEventListener("click", function () {
            const targetId = this.getAttribute("data-target");
            const bibtexText = document.getElementById(targetId);

            navigator.clipboard.writeText(bibtexText.value).then(() => {
                alert("📋 BibTeX copied to clipboard!");
            }).catch(err => {
                console.error("Failed to copy: ", err);
            });
        });
    });
});
