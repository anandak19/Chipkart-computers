const categoryForm = document.querySelector(".category-form");
const categoryName = document.getElementById("categoryName");
const isListed = document.getElementById("isListed");
const error = document.getElementById("error");
const nameRegex = /^[a-zA-Z\s]+$/;

categoryName.addEventListener("input", () => {
  const category = categoryName.value.trim();
  if (!nameRegex.test(category)) {
    error.innerHTML = "The name should only contain letters.";
  } else {
    error.innerHTML = "";
  }
});

const image = document.getElementById("image");
const imageInput = document.getElementById("imageInput");
const imageModal = document.getElementById("imageModal");

let croppedImage;
let cropper;
imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (cropper) {
        cropper.destroy();
      }
      image.src = e.target.result;
      imageModal.style.display = "flex";

      cropper = new Cropper(image, {
        aspectRatio: 1,
        viewMode: 1,
        responsive: true,
        autoCropArea: 0.5,
      });
    };
    reader.readAsDataURL(file);
  }
});

const cropButton = document.getElementById("cropButton");
const previewImage = document.getElementById("previewImage");
const uploadText = document.querySelector(".upload-text");
cropButton.addEventListener("click", () => {
  const canvas = cropper.getCroppedCanvas();

  canvas.toBlob((blob) => {
    croppedImage = blob;
    imageModal.style.display = "none";
    uploadText.style.display = "none";
    previewImage.style.display = "flex";
    console.log(croppedImage);
    document.getElementById(`previewImage`).src = URL.createObjectURL(blob);
  }, "image/jpeg");
});

categoryForm.addEventListener("submit", async(e) => {
  e.preventDefault();
  let isValid = true;

  const category = categoryName.value.trim();
  const isListedVal =  isListed.value
  error.innerHTML = "";

  if (!category || !nameRegex.test(category) || !isListedVal) {
    isValid = false;
    error.innerHTML = "Please enter valid credentials.";
  }

  if (!croppedImage) {
    isValid = false;
    alert("Please crop the uploaded image");
    return;
  }

  if (isValid) {
    const formData = new FormData();
    formData.append("categoryName", category);
    formData.append("isListed", isListedVal);
    formData.append(`image`, croppedImage, `categoryImage.jpeg`);

    try {
      const res = await fetch('/admin/categories/new', {
        method: 'POST',
        body: formData,
    });

    const data = await res.json()
    if (!res.ok) {
      console.error(data.error);
      error.innerHTML = data.error || "Faild to add"
    };

    if (res.ok) {
      const result = data
      alert("Category added")
  
      categoryForm.reset()
      croppedImage = ''
      uploadText.style.display = "flex";
      previewImage.style.display = "none";
      console.log("Success:", result);
    }
      
    } catch (error) {
      console.error("Error:", error);
      error.innerHTML = "Failed to submit the form. Please try again.";
    }

  }
});
