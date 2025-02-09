
const ordersContainer = document.querySelector(".orders-container");

function renderOrders(orders) {
    ordersContainer.innerHTML = ""; 
  
    orders.forEach(order => {
      const orderCard = document.createElement("div");
      orderCard.classList.add("order-card", "row");
  
      // Left Section: Products
      const productsHTML = order.items.map(item => `
        <div class="item-section d-flex align-items-center">
          <div class="item-image">
            <img src="${item.image[0].filepath}" alt="${item.name}">
          </div>
          <div class="item-details">
            <p class="product-name">${item.name}</p>
            <p class="product-quantity">Quantity: ${item.quantity} Pcs</p>
            <p class="product-price">₹${item.subTotalPrice}</p>
          </div>
        </div>
      `).join("");
  
      // Right Section: Address & Status
      const addressHTML = `
        <div class="col-md-6 address-section">
          <p class="order-status">Status: <span class="text-primary">${order.orderStatus}</span></p>
          <p class="delivery-label">Delivery To:</p>
          <p class="delivery-address">${order.addressDetails.fullName}, ${order.addressDetails.addressLine}, ${order.addressDetails.city}, ${order.addressDetails.state}, ${order.addressDetails.country}, Pincode: ${order.addressDetails.pincode}</p>
          <p class="payment-method">Payment: ${order.paymentMethod}</p>
        </div>
      `;
  
      // Append to Order Card
      orderCard.innerHTML = `
        <div class="col-md-6">
          <div class="products-list">${productsHTML}</div>
        </div>
        ${addressHTML}
      `;
  
      ordersContainer.appendChild(orderCard);
    });
  }


// get the order items of user 

const getOrders = async() =>{
    try {
        const response = await fetch('/account/orders/all')
        const data = await response.json()
        if (response.ok) {
            if (data.success) {
                console.log(data)
                renderOrders(data.orders)
            }else{
                alert("You have no orders")
            }
        }
    } catch (error) {
        console.error(error);
        alert("Internal server error")
    }
}

document.addEventListener('DOMContentLoaded', getOrders)