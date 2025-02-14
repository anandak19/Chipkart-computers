toastr.options = {
    positionClass: "toast-top-center",
    timeOut: 3000,
    showMethod: "slideDown",
    hideMethod: "fadeOut"
};

document.getElementById('backButton').addEventListener('click', () => history.back())

