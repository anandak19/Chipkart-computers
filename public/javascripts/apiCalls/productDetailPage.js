
// image zooming 
let imageZoom = document.getElementById("imageZoom");
imageZoom.addEventListener("mousemove", (event) => {
  imageZoom.style.setProperty("--display", "block");
  let pointer = {
    x: (event.offsetX * 100) / imageZoom.offsetWidth,
    y: (event.offsetY * 100) / imageZoom.offsetHeight,
  };
  imageZoom.style.setProperty("--zoom-x", pointer.x + "%");
  imageZoom.style.setProperty("--zoom-y", pointer.y + "%");
});

imageZoom.addEventListener("mouseout", () => {
  imageZoom.style.setProperty("--display", "none");
});


// to change imagez on hover 
let smallImages = document.querySelectorAll(".small-image img");
let mainImageDiv = document.querySelector("#imageZoom");
let mainImage = document.querySelector("#imageZoom img");

smallImages.forEach((smallImage) => {
    smallImage.addEventListener("mouseenter", () => {
        let imagePath = smallImage.getAttribute("src")
        mainImage.setAttribute("src", imagePath)
        mainImageDiv.style.setProperty("--url", `url(${imagePath})`)
    })
})

