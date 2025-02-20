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
    console.log("current image", e.target.files[0])
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
    console.log("index of file: ", currentFileIndex)
    modal.style.display = "none";
    console.log("croped image",croppedImages);
    document.getElementById(`image${currentFileIndex}`).src =
      URL.createObjectURL(blob);
  }, "image/jpeg");
});

// to disable the default behaviour of the form 
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
    productNameError.textContent = 'Please enter a valid product name';
    return false;
  } else {
    productNameError.textContent = '';
  }

  // Category Validation
  if (!category.value || category.value === '') {
    categoryError.textContent = 'Please choose a category name';
    return false;
  } else {
    categoryError.textContent = '';
  }

  // Brand Name Validation
  if (!brandName.value.trim()) {
    brandNameError.textContent = 'Please provide a brand name';
    return false;
  } else {
    brandNameError.textContent = '';
  }

  // MRP Validation
  if (!mrp.value || parseFloat(mrp.value.trim()) < 1) {
    mrpError.textContent = 'Please provide a valid MRP';
    return false;
  } else {
    mrpError.textContent = '';
  }

  // Stock Count Validation
  if (!stockCount.value || parseInt(stockCount.value) < 0) {
    stockCountError.textContent = 'Please provide a valid stock count';
    return false;
  } else {
    stockCountError.textContent = '';
  }

  // Highlights Validation
  if (highlightValues.length < 3) {
    highlightsError.textContent = 'Minimum 3 highlights required';
    return false;
  } else {
    highlightsError.textContent = '';
  }

  // Description Validation
  if (!description.value || description.value.trim().length < 15) {
    descriptionError.textContent = 'Enter a description with more than 15 characters.';
    return false;
  } else {
    descriptionError.textContent = '';
  }

  return true; // Return true if all validations pass
};


const saveProductBtn = document.getElementById("saveProductBtn");
const updateProductBtn = document.getElementById("updateProductBtn");



// API call to update the product data ---------------------------------------------------------
if (updateProductBtn) {
  updateProductBtn.addEventListener("click", async () => {
    console.log(window.productId)
  
    const highlightValues = Array.from(highlights)
      .map((input) => input.value.trim())
      .filter((value) => value !== "");
  
      // validate the input details 
      const result = validateProductForm(highlightValues)
      if (!result) {
        return
      }
  

    // Create FormData
    const formData = new FormData();
    formData.append("productName", productName.value.trim());
    formData.append("categoryId", category.value);
    formData.append("brand", brandName.value.trim());
    formData.append("mrp", mrp.value.trim());
    formData.append("quantity", stockCount.value.trim());
    formData.append("isFeatured", feature.value);
    formData.append("highlights", JSON.stringify(highlightValues));
    formData.append("description", description.value.trim());
    if (croppedImages && croppedImages.length > 0) {
        croppedImages.forEach((imageBlob, index) => {
          formData.append("images", imageBlob, `cropped-image-${index + 1}.jpeg`);
          formData.append(`positions[${index}]`, index + 1);
          console.log(imageBlob, index + 1);
        });
      }
  
    for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
    // Send Request to update
    try { 
      const res = await fetch(`/admin/products/edit/${window.productId}`, {
        method: "POST",
        body: formData,
      });
  
      const data = await res.json();
      if (data.success){
        alert(data.message);
        location.reload();
        for (let i = 0; i < croppedImages.length; i++) {
          document.getElementById(`image${i}`).removeAttribute('src');
        }
        croppedImages.length = 0
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }

  });
}

// delete one image 
const deleteImgBtns = document.querySelectorAll('.deleteImgBtns')

deleteImgBtns.forEach((deleteBtn) => {
  deleteBtn.addEventListener('click', async (e) => {
    
    const imageId = e.target.getAttribute("data-id");

    console.log(imageId)

    try {
      const res = await fetch(`/admin/products/edit/image/${imageId}`, {
        method: 'DELETE'
      })

      const result = await res.json()
      console.log(result)

      if (res.ok) {
        location.reload();
      }
      
    } catch (error) {
      console.error(error);
      alert("Somthing went wrong")
    }

  })
})