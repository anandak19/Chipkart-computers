const featuredProducts = document.getElementById("featuredProducts");
const latestProducts = document.getElementById("latestProducts");

// show featured products on dom
const showFeaturedProducts = (products) => {
  featuredProducts.innerHTML = "";
  if (products.length > 0) {
    // show products
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
                      alt="${product.productName || "Default Product"}"
                    />
                  </div>
                  <div class="card-product-details">
                    <div class="product-brand">
                      <p class="card-product-brand">${
                        product.brand || "Unnamed brand"
                      }</p>
                      <p class="card-product-name">${
                        product.productName || "Unnamed Product"
                      }</p>
                    </div>
                    <div class="card-product-prices">
                      <p class="card-product-price">${
                        product.finalPrice || "N/A"
                      }</p>
                      <p class="card-product-discount">${
                        product.discount || "0"
                      }% Off</p> 
                    </div>
                  </div>
                </div>
              </a>
        `;
      featuredProducts.insertAdjacentHTML("beforeend", productCard);
    });
  } else {
    // show no message
    featuredProducts.innerHTML = "No Featured products to show";
  }
};

// function to get featured prducts
const getFeaturedProducts = async () => {
  fetch("/products/featured")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP Error! Status ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      showFeaturedProducts(data.data);
    })
    .catch((error) => {
      alert("Somthing went wrong");
      console.error("Error occured:", error);
    });
};

// show latest products on dom
const showLatestProducts = (products) => {
  //code here
  latestProducts.innerHTML = "";
  if (products.length > 0) {
    // show products
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
                        alt="${product.productName || "Default Product"}"
                      />
                    </div>
                    <div class="card-product-details">
                      <div class="product-brand">
                        <p class="card-product-brand">${
                          product.brand || "Unnamed brand"
                        }</p>
                        <p class="card-product-name">${
                          product.productName || "Unnamed Product"
                        }</p>
                      </div>
                      <div class="card-product-prices">
                        <p class="card-product-price">${
                          product.finalPrice || "N/A"
                        }</p>
                        <p class="card-product-discount">${
                          product.discount || "0"
                        }% Off</p> 
                      </div>
                    </div>
                  </div>
                </a>
          `;
      latestProducts.insertAdjacentHTML("beforeend", productCard);
    });
  } else {
    // show no message
    latestProducts.innerHTML = "No Latest products to show";
  }
};

// function to get latest products
const getLatestProducts = async () => {
  //code here
  fetch("/products/latest")
    .then((res) => {
      if (!res.ok) {
        throw new Error("HTTP Error: Status:", res.status);
      }
      return res.json();
    })
    .then((data) => {
      showLatestProducts(data.data);
    })
    .catch((error) => {
      console.error(error);
    });
};

document.addEventListener("DOMContentLoaded", (event) => {
  // get featured prducts
  getFeaturedProducts();
  // get latest products
  getLatestProducts();
});
