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
    let imagePath = smallImage.getAttribute("src");
    mainImage.setAttribute("src", imagePath);
    mainImageDiv.style.setProperty("--url", `url(${imagePath})`);
  });
});

// -rating and reviews-
const rateBtn = document.getElementById("rateBtn");
const prevBtn = document.getElementById("prevBtn");
const nxtBtn = document.getElementById("nxtBtn");
const paginators = document.querySelector(".paginators");
const averageRatingDiv = document.getElementById("averageRating");
const relatedProductsDiv = document.getElementById("relatedProductsDiv");

rateBtn.addEventListener("click", () => {
  window.location.href = `/products/${window.productId}/review/new`;
});

// reviews related apis
const showReviews = (reviews) => {
  console.log(reviews);
  // geting review container
  const reviewsContainer = document.getElementById("reviewsContainer");
  reviewsContainer.innerHTML = "";
  reviews.forEach((OneReview) => {
    const userReview = `
          <div class="review-card">
            <div class="card-head">
              <div class="rating">
                <div class="rating-box-small">
                  <p>★<span>${OneReview.rating}</span></p>
                </div>
                <p class="auther">By<span>${OneReview.user.name}</span></p>
              </div>
            </div>
            <div class="review-content">
              <p>
                ${OneReview.review}
              </p>
            </div>
          </div>
    `;
    reviewsContainer.insertAdjacentHTML("beforeend", userReview);
  });
};

const showRelatedProducts = (products) => {
  relatedProductsDiv.innerHTML = "";
  if (products.length > 0) {
    products.forEach((product) => {
      const imageUrl =
        product.images && product.images.length > 0
          ? product.images[0].filepath
          : "/images/default/default.jpg";

      const productCard = `
            <a href="/products/${product._id}" class="product-link">
              <div class="product-card">
                <div class="product-image">
                  <img
                    src="${imageUrl}"
                    alt="${product.productName || 'Default Product'}"
                  />
                </div>
                <div class="card-product-details">
                  <div class="product-brand">
                    <p class="card-product-brand">${product.brand || 'Unnamed brand'}</p>
                    <p class="card-product-name">${product.productName || 'Unnamed Product'}</p>
                  </div>
                  <div class="card-product-prices">
                    <p class="card-product-price">${product.finalPrice || 'N/A'}</p>
                    <p class="card-product-discount">${product.discount || '0'}% Off</p> 
                  </div>
                </div>
              </div>
            </a>
      `;
      relatedProductsDiv.insertAdjacentHTML("beforeend", productCard)
    });
  }else{
    relatedProductsDiv.innerHTML = "No related products to show";
  }
};

const updateAvarageReview = (averageRating, totalReviews) => {
  averageRatingDiv.innerHTML = ``;
  if (totalReviews > 0) {
    averageRatingDiv.innerHTML = `
    <div class="total-review-overal">
      <p class="overal"><span>${averageRating}</span>★</p>
      <p>${totalReviews} Reviews & Ratings</p>
    </div>
    `;
  } else {
    averageRatingDiv.innerHTML = `
    <div class="total-review-overal">
      <p class="overal">No reviews</p>
      <p>Be the first to add a review</p>
    </div>
    `;
  }
};

let page = 0;

const updatePagination = (hasMore, totalReviews) => {
  paginators.style.display = totalReviews > 3 ? "flex" : "none";
  nxtBtn.disabled = !hasMore;
  prevBtn.disabled = page === 0;
};
// to fetch all the Reviews
const fetchReviews = async () => {
  try {
    const response = await fetch(
      `/products/${window.productId}/review?page=${page}`
    );

    if (response.ok) {
      const data = await response.json();
      console.log(data);

      if (data.status === "success") {
        const { reviews, totalReviews, hasMore, averageRating } = data.data;

        updatePagination(hasMore, totalReviews);

        updateAvarageReview(averageRating, totalReviews);
        showReviews(reviews);
      } else {
        alert("Somthing went wrong");
      }
    } else {
      console.error("Error fetching reviews.");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error fetching reviews");
  }
};

nxtBtn.addEventListener("click", () => {
  page++;
  fetchReviews();
});

prevBtn.addEventListener("click", () => {
  page--;
  fetchReviews();
});

const getRelatedProducts = async () => {
  try {
    const res = await fetch(`/products/${window.productId}/related`);

    if (res.ok) {
      const data = await res.json();
      const relatedProducts = data.data;
      showRelatedProducts(relatedProducts);
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
};

window.addEventListener("load", () => {
  fetchReviews();
  getRelatedProducts();
});

// method to buy now
function buyNow(productId) {
  window.location.replace(`/checkout?productId=${productId}`);
} 

// add to wishlist 
async function addWishlist(id) {
  const url = `/products/wishlist/add/${id}`
  try {
    const res = await fetch(url, {
      method: 'POST'
    })

    const result = await res.json()
    if (res.ok) {
      // getWishlistCount()
      window.location.reload()
    }else{
      alert(result.error)
    }
  } catch (error) {
    console.error(error);
    alert('Error adding to wishlist')
  }
}