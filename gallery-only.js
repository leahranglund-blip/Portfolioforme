const currentPage = window.location.pathname.split("/").pop().toLowerCase();

if (currentPage !== "galleri.html") {
    window.location.replace("Galleri.html");
}
