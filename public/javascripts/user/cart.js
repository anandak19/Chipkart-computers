const cartSubtotal = document.getElementById("cartSubtotal");
const shippingCost = document.getElementById("shippingCost");
const cartTotal = document.getElementById("cartTotal");
const proceedBtn = document.getElementById("proceedBtn");

let page = 0;

function formatPrice(price) {
  return `₹${price.toLocaleString("en-IN")}`;
}

const showCartItems = (cartItems) => {
  const cartContainer = document.getElementById("cartContainer");
  cartContainer.innerHTML = "";
  console.log(cartItems.length);

  if (cartItems.length !== 0) {
    cartItems.forEach((item) => {
      const cartItem = document.createElement("div");
      cartItem.classList.add(
        "cartItem-card",
        "d-flex",
        "align-items-center",
        "p-4"
      );

      cartItem.innerHTML = `
        <div class="product-data d-flex align-items-center gap-4">
          <div class="cartItem-image">
            <img src="${item.products.image[0].filepath}" alt="${
        item.products.name
      }" />
          </div>
          <div class="cartItem-details flex-grow-1">
            <h5 class="cartItem-name">${item.products.name}</h5>
            <p class="cartItem-price">${formatPrice(item.products.price)}</p>
          </div>
        </div>

        <div class="cartItem-quantity">
          <button class="qty-btn" onclick="decreaseQuantity('${
            item.products.productId
          }')">-</button>
          <span class="qty-value">${item.products.quantity}</span>
          <button class="qty-btn" onclick="increaseQuantity('${
            item.products.productId
          }')">+</button>
        </div>

        <div class="cartItem-total">
          <p>${formatPrice(item.products.subTotalPrice)}</p>
        </div>

        <button class="cartItem-delete" onclick="removeItem('${
          item.products.productId
        }')">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;

      cartContainer.appendChild(cartItem);
    });
  } else {
    cartContainer.innerHTML = "<h3 class='text-muted'>Cart is empty</h3>";
  }
};

// get cart item method
const getUserCart = async () => {
  const url = `/cart/all?p=${page}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (response.ok) {
      console.log(data);
      showCartItems(data.products);
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error(error);
  }
};

const showCartTotal = (data) => {
  cartSubtotal.innerText = formatPrice(data.cartSubTotal) || 0;
  shippingCost.innerText = formatPrice(data.shippingFee) || 0;
  cartTotal.innerText = formatPrice(data.cartTotal) || 0;
};

const getCartTotal = async () => {
  try {
    const response = await fetch("cart/total");
    const data = await response.json();
    if (response.ok) {
      showCartTotal(data);
    } else {
      console.error(data.error);
      toastr.warning(data.error, "Warning");
    }
  } catch (error) {
    console.error(error);
    alert("Internal server error");
  }
};

async function decreaseQuantity(id) {
  console.log("decrement: ", id);
  try {
    const response = await fetch("/cart/decrease", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    });

    const data = await response.json();
    if (response.ok) {
      getUserCart();
      getCartTotal();
    } else {
      toastr.warning(data.error, "Warning");
    }
  } catch (error) {
    console.error(error);
    alert("Internal server error");
  }
}

async function increaseQuantity(id) {
  console.log("increment: ", id);
  try {
    const response = await fetch("/cart/increase", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    });

    const data = await response.json();
    if (response.ok) {
      getUserCart();
      getCartTotal();
    } else {
      toastr.info(data.error);
    }
  } catch (error) {
    console.error(error);
    alert("Internal server error");
  }
}

async function removeItem(id) {
  console.log("remove: ", id);
  try {
    const response = await fetch("/cart/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    });

    const data = await response.json();
    if (response.ok) {
      getUserCart();
      getCartTotal();
    } else {
      toastr.warning(data.error, "Warning");
    }
  } catch (error) {
    console.error(error);
    alert("Internal server error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  getUserCart();
  getCartTotal();
});


proceedBtn.addEventListener('click', () => {
  window.location.replace('/checkout')
})
