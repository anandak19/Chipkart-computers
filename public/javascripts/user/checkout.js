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

      if (data.discountApplied !== 0) {
        const couponOffer = document.getElementById("couponOffer");
        couponOffer.innerText = `Coupon applied! Saved ₹${data.discountApplied}`;
        
      }
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
      body: JSON.stringify({ paymentMethod: paymentMethod }),
    });

    const data = await response.json();
    if (response.ok) {
      toastr.success(data.message);
      placeOrderBtn.textContent = "Order Placed";
      window.location.href = data.redirectUrl;
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
  try {
    const res = await fetch("/checkout/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    console.log("response of razrpy", res);
    const result = await res.json();
    console.log("resutl", result);
    if (res.ok) {
      const { order } = result;

      const options = {
        key: "rzp_test_ZiDJEpnShu93LF",
        amount: order.amount,
        currency: "INR",
        name: "Chipkart",
        description: "Razorpay payment for chipkart computers",
        order_id: order.id,
        handler: async function (response) {
          console.log(response);

          try {
            const varificationRes = await fetch("/checkout/varify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });

            const varificationResult = await varificationRes.json();

            if (varificationRes.ok) {
              placeOrderBtn.disabled = true;
              toastr.success(varificationResult.message);
              placeOrderBtn.textContent = "Order Placed";
              window.location.href = varificationResult.redirectUrl;
            } else {
              placeOrderBtn.disabled = false;
              placeOrderBtn.textContent = "Place The Order";
              toastr.error(varificationResult.error);
            }
          } catch (error) {
            console.error("Error verifying payment:", error);
            toastr.error("Something went wrong. Please try again.");
          }
        },
      };

      var rzp = new Razorpay(options);
      rzp.open();
    }
  } catch (error) {
    console.error(error);
    alert("Error placing order on razorpay");
  }
};

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
    placeOrderWithOnline(paymentMethod);
  } else {
    toastr.info("Please Choose a valid payment method");
  }
});

// to redirect to new address entering page
function newAddressClicked() {
  window.location.href = "/checkout/address/new";
}

// method to applay cupon
const couponForm = document.getElementById("couponForm");
couponForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const couponInput = document.getElementById("couponInput").value;

  if (couponInput.trim().length <= 3) {
    toastr.info("Please enter a valid coupon code and try again");
    return;
  }

  try {
    const res = await fetch("/checkout/applay-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ couponCode: couponInput.trim() }),
    });

    const result = await res.json();

    if (res.ok) {
      getTotalPayable();
    } else {
      toastr.info(result.error || "Error applaying coupon");
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
});
