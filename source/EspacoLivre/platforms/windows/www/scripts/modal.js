function openModal(modalID, done) {

    // make sure that all other modals are closed 
    $("div.modal").css("display", "none");

    // Gets the modal
    var modal = document.getElementById(modalID);

    // Gets the <span> element that closes the modal
    var span = modal.getElementsByClassName("close")[0];

    // The close button may not be defined.
    if (span) {
        // When the user clicks on <span> (x), close the modal
        span.onclick = function () {
            modal.style.display = "none";

            if (done) {
                done();
            }
        };
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target === modal && span) {
            span.onclick();
        }
    };

    // Shows the modal
    modal.style.display = "block";
}

function closeModal(modalID) {
    // Gets the modal
    var modal = document.getElementById(modalID);
    modal.style.display = "none";
}
