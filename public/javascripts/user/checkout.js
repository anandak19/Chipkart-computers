const addressContainer = document.getElementById("addressContainer");
const backBtn = document.getElementById("backBtn");
const payableAmount = document.getElementById("payableAmount");
const placeOrderBtn = document.getElementById("placeOrderBtn");

backBtn.addEventListener("click", () => {
  window.location.href = "/cart";
});

// show address method
const renderAddressses = (addressArray) => {
  addressContainer.innerHTML = "";

  if (addressArray.length === 0) {
    addressContainer.innerHTML = "<p>Nothing to show</p>";
  } else {
    addressArray.sort((a, b) => b.isDefault - a.isDefault);
    addressArray.forEach((address) => {
      const addressCard = document.createElement("div");
      addressCard.classList.add("card", "shadow", "p-4", "w-100");

      addressCard.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h5 class="fw-bold">${address.fullName}</h5>
                <p class="mb-1">
                    <i class="fas fa-phone"></i> ${address.phoneNumber}
                </p>
                <p class="mb-0">
                    <i class="fa-solid fa-location-dot"></i> ${
                      address.addressLine
                    }, ${address.city}, ${address.state}, ${address.country}, ${
        address.pincode
      },
                </p>
            </div>

            <div class="d-flex align-items-center gap-3">
                <input type="radio" name="address" class="form-check-input address-radio" data-id="${
                  address._id
                }" ${address.isDefault ? "checked" : ""}/>
                <button id="editAddressBtn" class="btn btn-light editAddressBtn" data-id="${
                  address._id
                }">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </div>
        `;

      addressContainer.appendChild(addressCard);
    });

    document.querySelectorAll(".address-radio").forEach((radio) => {
      radio.addEventListener("change", function () {
        checkedAddres(this.dataset.id);
      });
    });

    document.querySelectorAll(".editAddressBtn").forEach((button) => {
      button.addEventListener("click", async function () {
        const addressId = this.getAttribute("data-id");
        if (addressId) {
          window.location.href = `/account/address/edit/${addressId}`;
        } else {
          alert("faild to get edit page");
        }
      });
    });
  }
};

// get the users address
const getUsersAddress = async () => {
  try {
    const response = await fetch("/account/address/all");
    data = await response.json();
    if (response.ok) {
      renderAddressses(data.data);
    }
  } catch (error) {
    console.log(error);
  }
};

// get the cart total amount
const getTotalPayable = async () => {
  try {
    const response = await fetch("/checkout/amount");
    const data = await response.json();
    if (response.ok) {
      console.log(data);
      payableAmount.innerText = `₹${data.total.toLocaleString("en-IN")}`;
    } else {
      console.error(data.error);
      toastr.warning(data.error, "Warning");
    }
  } catch (error) {
    console.error(error);
    alert("Internal server error");
  }
};

let paymentMethod;
document.addEventListener("DOMContentLoaded", () => {
  getUsersAddress();
  getTotalPayable();

  const paymentButtons = document.querySelectorAll(
    'input[name="paymentMethod"]'
  );

  paymentButtons.forEach((button) => {
    button.addEventListener("change", function () {
      paymentMethod = this.value;
    });
  });
});

// method to saved choosen address to session
async function checkedAddres(addressId) {
  try {
    const response = await fetch("/checkout/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId: addressId }),
    });
    const data = await response.json();
    if (!response.ok) {
      toastr.error(data.error);
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
}

// place order with cod
const placeOrderWithCod = async (paymentMethod) => {
  try {
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = "Processing...";

    const response = await fetch("/checkout/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({paymentMethod: paymentMethod})
    });

    const data = await response.json();
    if (response.ok) {
      toastr.success(data.message);
      placeOrderBtn.textContent = "Order Placed";
      setTimeout(() => {
        window.location.href = "/account/orders";
      }, 2000);
    } else {
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = "Place The Order";
      toastr.error(data.error);
    }
  } catch (error) {
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = "Place The Order";
    console.error(error);
    alert("Somthing went wrong");
  }
};

const placeOrderWithOnline = async (paymentMethod) => {
  alert("Razorpay is working on...")
}

// method to place the order
placeOrderBtn.addEventListener("click", async () => {
  console.log(paymentMethod);

  if (!paymentMethod) {
    toastr.info("Please Choose a payment method");
    return;
  }

  if (paymentMethod === "COD") {
    placeOrderWithCod(paymentMethod);
  } else if (paymentMethod === "Online") {
    placeOrderWithOnline(paymentMethod)
  }else{
    toastr.info("Please Choose a valid payment method");
  }
});

// to redirect to new address entering page
function newAddressClicked() {
  window.location.href = "/checkout/address/new";
}
