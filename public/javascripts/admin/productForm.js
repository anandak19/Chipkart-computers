// all inputs
const productName = document.getElementById("productName");
const category = document.getElementById("category");
const brandName = document.getElementById("brandName");
const mrp = document.getElementById("mrp");
const stockCount = document.getElementById("stockCount");
const feature = document.getElementById("feature");
const highlights = document.querySelectorAll(".highlights");
const description = document.getElementById("description");
// image inputs
const imageInputs = document.querySelectorAll(".image-input");

// croper js image croping
const modal = document.getElementById("modal");
const image = document.getElementById("image");
const cropBtn = document.getElementById("cropButton");
let cropper;
const croppedImages = [];
let currentFileIndex = null;

// Handle file input change
imageInputs.forEach((imageInput, index) => {
  imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        image.src = e.target.result;
        modal.style.display = "flex";

        // If a cropper instance already exists, destroy it
        if (cropper) {
          cropper.destroy();
        }

        // Create a new cropper instance
        cropper = new Cropper(image, {
          aspectRatio: 1,
          viewMode: 1,
          responsive: true,
          autoCropArea: 0.5,
          cropBoxResizable: true,
          cropBoxMovable: true,
        });

        currentFileIndex = index; // Track which file input is being cropped
      };
      reader.readAsDataURL(file);
    }
  });
});

// croping the image
cropBtn.addEventListener("click", () => {
  const canvas = cropper.getCroppedCanvas();

  canvas.toBlob((blob) => {
    croppedImages[currentFileIndex] = blob; // Save the cropped image blob in the array
    modal.style.display = "none";
    console.log(croppedImages);
    document.getElementById(`image${currentFileIndex}`).src =
      URL.createObjectURL(blob);
  }, "image/jpeg");
});

const productForm = document.getElementById("productForm");
productForm.addEventListener("submit", (event) => {
  event.preventDefault();
});

const productNameError = document.getElementById("productNameError");
const categoryError = document.getElementById("categoryError");
const brandNameError = document.getElementById("brandNameError");
const mrpError = document.getElementById("mrpError");
const stockCountError = document.getElementById("stockCountError");
const highlightsError = document.getElementById("highlightsError");
const descriptionError = document.getElementById("descriptionError");
const imageError = document.getElementById("imageError");

// form input validation method
const validateProductForm = (highlightValues) => {
  // Product Name Validation
  if (!productName.value.trim() || productName.value.trim().length < 3) {
    productNameError.textContent = "Please enter a valid product name";
    return false;
  } else {
    productNameError.textContent = "";
  }

  // Category Validation
  if (!category.value || category.value === "") {
    categoryError.textContent = "Please choose a category name";
    return false;
  } else {
    categoryError.textContent = "";
  }

  // Brand Name Validation
  if (!brandName.value.trim()) {
    brandNameError.textContent = "Please provide a brand name";
    return false;
  } else {
    brandNameError.textContent = "";
  }

  // MRP Validation
  if (!mrp.value || parseFloat(mrp.value.trim()) < 1) {
    mrpError.textContent = "Please provide a valid MRP";
    return false;
  } else {
    mrpError.textContent = "";
  }

  // Stock Count Validation
  if (!stockCount.value || parseInt(stockCount.value) < 0) {
    stockCountError.textContent = "Please provide a valid stock count";
    return false;
  } else {
    stockCountError.textContent = "";
  }

  // Highlights Validation
  if (highlightValues.length < 3) {
    highlightsError.textContent = "Minimum 3 highlights required";
    return false;
  } else {
    highlightsError.textContent = "";
  }

  // Description Validation
  if (!description.value || description.value.trim().length < 15) {
    descriptionError.textContent =
      "Enter a description with more than 15 characters.";
    return false;
  } else {
    descriptionError.textContent = "";
  }

  return true;
};

/*
send the data without validating image is added or not.
in server, validate image is added or not or the length of the image array in db is greater than or equal to 3
*/

if (croppedImages.length > 0) {
  croppedImages.forEach((imageBlob, index) => {
    formData.append(`images`, imageBlob, `cropped-image-${index + 1}.jpeg`);
  });
}

const saveProductBtn = document.getElementById("saveProductBtn");
const loader = document.getElementById("loader");

// API call to save the new product details with images to server
if (saveProductBtn) {
  saveProductBtn.addEventListener("click", async () => {
    const highlightValues = Array.from(highlights)
      .map((input) => input.value.trim())
      .filter((value) => value !== "");

    const result = validateProductForm(highlightValues);
    if (!result) {
      return;
    }

    // Images Validation
    if (croppedImages.length < 4) {
      imageError.textContent = "Please upload at least 4 images";
      return;
    } else if (croppedImages.length !== imageInputs.length) {
      imageError.textContent = "Please crop all the uploaded images";
      imageError.textContent = "Please upload at least 4 images";
      return;
    } else {
      imageError.textContent = "";
    }

    // Create FormData
    const formData = new FormData();
    formData.append("productName", productName.value.trim());
    formData.append("categoryId", category.value);
    formData.append("brand", brandName.value.trim());
    formData.append("mrp", mrp.value.trim());
    formData.append("quantity", stockCount.value.trim());
    formData.append("isFeatured", feature.value.trim());
    formData.append("highlights", JSON.stringify(highlightValues));
    formData.append("description", description.value);
    croppedImages.forEach((imageBlob, index) => {
      formData.append("images", imageBlob, `product-image-${index + 1}.jpeg`);
      formData.append(`positions[${index}]`, index + 1);
    });

    try {
      saveProductBtn.classList.add("disabled");
      loader.style.display = "inline-block";

      const res = await fetch("/admin/products/new", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        productForm.reset();
        for (let i = 0; i < croppedImages.length; i++) {
          document.getElementById(`image${i}`).removeAttribute("src");
        }
        croppedImages.length = 0;
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }finally{
      saveProductBtn.classList.remove("disabled");
      loader.style.display = "none";
    }
  });
}


/*

PRODUCT IMAGE UPLOAD AND UPDATE - EXECUTION PLAN

when adding new product----
send other details
send image in array

-backend
get the images and add upload image to cloudinary
get the url of the uploaded image and file name
create new image array with the each imageName and imagePath 
save the product to db with other product details and image array


when updating a product----

send other product details 
if an image in a position is cropped and saved
append the following then
path of the existing image  and new image to update
send the data

-backend
do the multer thing
upload that image to cloud/disk and get path/url
get the images array of the product, and loop through it
find the image with the requested path/url 
if we find a image with that path/url update it with the new path/url

run the external code to delete that image from disk or cloud/


*/
