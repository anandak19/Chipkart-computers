const ordersContainer = document.querySelector(".ordersContainer");

function renderOrders(orders) {
  ordersContainer.innerHTML = "";

  orders.forEach((order) => {
    const orderCard = document.createElement("div");
    orderCard.classList.add("order-card", "row");

    // Left Section: Products
    const productsHTML = order.items
      .map(
        (item) => `
        <div class="item-section d-flex align-items-center">
          <div class="item-image">
            <img src="${item.image[0].filepath}" alt="${item.name}">
          </div>
          <div class="item-details">
            <p class="product-name">${item.name}</p>
            <p class="product-quantity">${item.quantity} Pcs</p>
            <p class="product-price">₹${item.subTotalPrice}</p>
          </div>
        </div>
      `
      )
      .join("");

    // Right Section: Address & Status
    const addressHTML = `
        <div class="col-md-6 address-section">
          <p class="order-status">Status: <span class="text-primary">${order.orderStatus}</span></p>
        </div>
      `;

    const moreHTML = `
      <div class="details mt-3">
        <div class="total-price">
          <p>Total: ₹ ${order.totalPayable} <span>(${order.paymentStatus})</span></p>
        </div>
        <div class="show-more">
          <a href="/account/orders/all/ord/${order._id}">Show Details</a>
        </div>
      </div>
      `;

    // Append to Order Card
    orderCard.innerHTML = `
        <div class="col-md-6">
          <div class="products-list">${productsHTML}</div>
        </div>
        ${addressHTML}
        ${moreHTML}
      `;

    ordersContainer.appendChild(orderCard);
  });
}

// paginations
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
let page = 0;
let hasMore = false;
const updatePaginators = (page, hasMore) => {
  prevBtn.disabled = page === 0;
  nextBtn.disabled = !hasMore;
};

// get the order items of user
const getOrders = async (page) => {
  try {
    let url = `/account/orders/all?page=${page}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    const data = await response.json();

    if (data.success) {
      console.log(data.orders);
      renderOrders(data.orders);
      updatePaginators(page, data.hasMore);
    } else {
      alert("Response not ok");
    }
  } catch (error) {
    console.log(error);
    alert("Internal server error");
  }
};

const ordersDiv = document.querySelector('.profile-data')
prevBtn.addEventListener("click", () => {
  page--;
  window.scrollTo(0, 0);
  ordersDiv.scrollTo(0, 0);
  getOrders(page);
});

nextBtn.addEventListener("click", () => {
  page++;
  window.scrollTo(0, 0);
  ordersDiv.scrollTo(0, 0);
  getOrders(page);
});

document.addEventListener("DOMContentLoaded", () => {
  getOrders(0);
});
