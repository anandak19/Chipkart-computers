

const showAddressInfo = (address) => {
    const recipient = document.getElementById('recipient')
    const phone = document.getElementById('phone')
    const addressField = document.getElementById('address')
    const landmark = document.getElementById('landmark')

    recipient.innerText = address.fullName;
    phone.innerText = address.phoneNumber;
    const formattedAddress = `${address.addressLine}, ${address.city}, ${address.state}, ${address.country}, ${address.pincode}`;
    addressField.innerText = formattedAddress;
    landmark.innerText = address.landmark || "Nil";
};

const orderItemsContainer = document.getElementById("orderItemsContainer");
const showOrderItems = (items) => {
    orderItemsContainer.innerHTML = "";

    items.forEach(item => {
        const orderItem = document.createElement("div");
        orderItem.className = "order-item card shadow-sm p-3 d-flex flex-row align-items-center";

        orderItem.innerHTML = `
        <div class="product-img-container">
          <img src="${item.image[0].filepath}" alt="Product Image" class="product-img">
        </div>
  
        <div class="product-details flex-grow-1 px-3">
          <p class="product-name mb-1">${item.name}</p>
          <p class="product-price mb-1">Unit Price: ₹${item.price.toLocaleString()}</p>
          <p class="product-quantity mb-0">Quantity: ${item.quantity}</p>
        </div>
  
        <div class="product-total text-end">
          <p>Sub Total: ₹${item.subTotalPrice.toLocaleString()}</p>

        </div>
      `;

      orderItemsContainer.appendChild(orderItem);
    });
};

// method to get the delivery address
const getAddressInfo = async () => {
  try {
    const response = await fetch("/account/orders/all/ord/info/address");
    const data = await response.json();
    console.log(data);
    if (response.ok) {
      const { address } = data;
      showAddressInfo(address);
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
};

// method to get the items in cart
const getOrderItems = async () => {
  try {
    const response = await fetch("/account/orders/all/ord/info/itemes");
    const data = await response.json();
    if (response.ok) {
      console.log(data);
      showOrderItems(data.items)
    } else {
      console.log(data);
    }
  } catch (error) {
    alert("Somthing went wrong");
    console.error(error);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  getAddressInfo();
  getOrderItems();
});


// CANCEL ORDER

const cancelOrderBtnOpen = document.getElementById('cancelOrderBtnOpen')
const closeBtn = document.getElementById('closeBtn')
const dialogModal = document.getElementById('dialogModal')
const cancelOrderForm = document.getElementById('cancelOrderForm')

const cancelReason = document.getElementById('cancelReason')

cancelOrderBtnOpen.addEventListener('click', () => {
  dialogModal.style.display = 'flex'
})

closeBtn.addEventListener('click', () => {
  dialogModal.style.display = 'none'
})

cancelOrderForm.addEventListener('submit', async(e) => {
  e.preventDefault()
  const reason = cancelReason.value.trim()
  if (!reason || reason.length < 4) {
    toastr.warning("Enter a valid reason", "Warning");
    return
  }

  try {
    const response = await fetch('/account/orders/all/ord/cancel/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({cancelReason: reason})
    })
    const data = await response.json()

    if (response.ok) {
      toastr.success(data.message, "Success");
      setTimeout(() => {
        location.reload();
      }, 2000)

    }else{
      toastr.error(data.error || "Somthing went wrong", "Error");
    }
  } catch (error) {
    console.error(error);
    alert("Server not responding")
  }
})


// return an item 
function returnProduct() {
  window.location.href = "/account/orders/all/ord/items/return";
}

