const addressContainer = document.getElementById("addressContainer");
const backBtn = document.getElementById("backBtn");

const totalAmount = document.getElementById("totalAmount");
const shippingFee = document.getElementById("shippingFee");
const discountAmount = document.getElementById("discountAmount");
const payableAmount = document.getElementById("payableAmount");

const couponForm = document.getElementById("couponForm");

const removeCouponBtn = document.querySelector(".remove-coupon");
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

      totalAmount.innerText = `₹${data.total.toLocaleString("en-IN")}`;
      shippingFee.innerText = `₹${data.shippingFee.toLocaleString("en-IN")}`;
      discountAmount.innerText = `₹${data.discountApplied.toLocaleString(
        "en-IN"
      )}`;
      payableAmount.innerText = `₹${data.totalPayable.toLocaleString("en-IN")}`;

      if (data.discountApplied !== 0) {
        const couponOffer = document.getElementById("couponOffer");
        couponOffer.innerText = `Coupon applied! Saved ₹${data.discountApplied}`;
        removeCouponBtn.style.display = "flex";
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

// to remove the applied coupon
removeCouponBtn.addEventListener("click", async () => {
  try {
    const res = await fetch("/checkout/remove-coupon", {
      method: "PATCH",
    });

    const result = await res.json();
    if (res.ok) {
      toastr.success(result.message);
      getTotalPayable();

      couponOffer.innerText = ``;
      removeCouponBtn.style.display = "none";
      couponForm.reset();
    } else {
      toastr.warning(result.error || "Somthing went wrong");
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
});

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

// const placeOrderWithOnline = async (paymentMethod) => {
//   console.log("✅ placeOrderWithOnline() function called");
//   try {
//     const res = await fetch("/checkout/create-order", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//     });
//     console.log("✅ API Call Made to /checkout/create-order");
//     const result = await res.json();
//     console.log("resutl", result);
//     if (res.ok) {
//       const { order } = result;

//       const options = {
//         key: "rzp_test_ZiDJEpnShu93LF",
//         amount: order.amount,
//         currency: "INR",
//         name: "Chipkart",
//         description: "Razorpay payment for chipkart computers",
//         order_id: order.id,
//         handler: async function (response) {
//           console.log(response);

//           if (!response.razorpay_payment_id) return;

//           try {

//             const varificationRes = await fetch("/checkout/varify-payment", {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify(response),
//             });

//             const varificationResult = await varificationRes.json();

//             if (varificationRes.ok) {
//               placeOrderBtn.disabled = true;
//               toastr.success(varificationResult.message);
//               placeOrderBtn.textContent = "Order Placed";
//               window.location.href = varificationResult.redirectUrl;
//             } else {
//               placeOrderBtn.disabled = false;
//               placeOrderBtn.textContent = "Place The Order";
//               toastr.error(varificationResult.error);
//             }
//           } catch (error) {
//             console.error("Error verifying payment:", error);
//             toastr.error("Something went wrong. Please try again.");
//           }
//         },

//         modal: {
//           ondismiss: function () {
//             alert("payment faild of cancelled");
//           },
//         },

//       };

//       var rzp = new Razorpay(options);

//       rzp.open();

//       rzp.on("payment.failed", function (response) {
//         alert(`Payment Failed! Reason: ${response.error.description}`);
//       });

//     }
//   } catch (error) {
//     console.error(error);
//     alert("Error placing order on razorpay");
//   }
// };

// copy

const placeOrderWithOnline = async (paymentMethod) => {

  let redirectUrl = "";

  try {
    const res = await fetch("/checkout/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    console.log("✅ API Call Made to /checkout/create-order");

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
          if (!response.razorpay_payment_id) return;

          try {
            const varificationRes = await fetch("/checkout/varify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, success: true }),
            });

            const varificationResult = await varificationRes.json();

            if (varificationRes.ok) {
              redirectUrl = varificationResult.redirectUrl; 
              placeOrderBtn.disabled = true;
              toastr.success(varificationResult.message);
              placeOrderBtn.textContent = "Order Placed";
              window.location.href = redirectUrl;
            } else {
              placeOrderBtn.disabled = false;
              placeOrderBtn.textContent = "Place The Order";
              toastr.error(varificationResult.message);
            }
          } catch (error) {
            console.error("Error verifying payment:", error);
            toastr.error("Something went wrong. Please try again.");
          }
        },

        modal: {
          ondismiss: function () {
            console.warn("Payment popup closed by user");
            if (redirectUrl) {
              window.location.href = redirectUrl;
            } else {
              alert("Payment process cancelled. Please try again.");
            }
          },
        },
      };

      var rzp = new Razorpay(options);
      rzp.open();

      let isFailedPaymentCalled = false;

      rzp.on("payment.failed", async function (response) {
        if (isFailedPaymentCalled) return;
        isFailedPaymentCalled = true;
        console.log("payment faild");
        console.log("faidl respp", response);

        console.log(response.error);
        const varificationRes = await fetch("/checkout/varify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: response.error.metadata.payment_id,
            razorpay_order_id: response.error.metadata.order_id,
            success: false,
          }),
        });

        const varificationResult = await varificationRes.json();
        alert(varificationResult.message);
        redirectUrl = varificationResult.redirectUrl;
      });

    }
  } catch (error) {
    console.error(error);
    alert("Error placing order on razorpay");
  }
};


// e commerce transaction - on
// after hosting make it off

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
