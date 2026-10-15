document.querySelectorAll(".fun-fact-close").forEach((button) => {
    button.addEventListener("click", () => {
        button.closest(".fun-fact").classList.add("is-dismissed");
    });
});
