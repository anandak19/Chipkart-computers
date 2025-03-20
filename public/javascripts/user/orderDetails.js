const showAddressInfo = (address) => {
  const recipient = document.getElementById("recipient");
  const phone = document.getElementById("phone");
  const addressField = document.getElementById("address");
  const landmark = document.getElementById("landmark");

  recipient.innerText = address.fullName;
  phone.innerText = address.phoneNumber;
  const formattedAddress = `${address.addressLine}, ${address.city}, ${address.state}, ${address.country}, ${address.pincode}`;
  addressField.innerText = formattedAddress;
  landmark.innerText = address.landmark || "Nil";
};

const orderItemsContainer = document.getElementById("orderItemsContainer");
const showOrderItems = (items) => {
  orderItemsContainer.innerHTML = "";

  items.forEach((item) => {
    const orderItem = document.createElement("div");
    orderItem.className =
      "order-item card shadow-sm p-3 d-flex flex-row align-items-center";

    orderItem.innerHTML = `
        <div class="product-img-container">
          <img src="${
            item.image.filepath
          }" alt="Product Image" class="product-img">
        </div>
  
        <div class="product-details flex-grow-1 px-3">
          <p class="product-name mb-1">${item.productName}</p>
          <p class="product-price mb-1">Unit Price: ₹${item.finalPrice.toLocaleString()}</p>
          <p class="product-quantity mb-0">Quantity: ${item.quantity}</p>
            ${
              item.returnStatus === "requested"
                ? `
                <p class= "text-warning">Return requested</p>
                `
                : item.returnStatus === "approved"
                ? `<p class= "text-success">Return aprooved and amount is added to your wallet</p>`
                : item.returnStatus === "rejected"
                ? `<p class= "text-danger">Return refund rejected with reason: ${item.returnRejectReason}</p>`
                : ``
            }
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
      showOrderItems(data.items);
    } else {
      console.log(data);
    }
  } catch (error) {
    alert("Somthing went wrong");
    console.error(error);
  }
};

// get coupons got from order
const getOrderCoupons = async () => {
  try {
    const res = await fetch("/account/orders/all/ord/info/rewards");
    const result = await res.json();
    if (res.ok) {
      console.log(result);
      const couponDiv = document.getElementById("couponDiv");
      couponDiv.innerHTML = "";
      const couponCard = document.createElement("div");
      couponCard.className = "coupon-strip";
      couponCard.innerHTML = `
      <p>You got <span>${result.discount}%</span> Off Coupon in this order</p>
      <small>${result.message}</small>
      `;

      couponDiv.appendChild(couponCard);
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  getAddressInfo();
  getOrderItems();
  getOrderCoupons();
});

// CANCEL ORDER

const cancelOrderBtnOpen = document.getElementById("cancelOrderBtnOpen");
const closeBtn = document.getElementById("closeBtn");
const dialogModal = document.getElementById("dialogModal");
const cancelOrderForm = document.getElementById("cancelOrderForm");

const cancelReason = document.getElementById("cancelReason");

cancelOrderBtnOpen.addEventListener("click", () => {
  dialogModal.style.display = "flex";
});

closeBtn.addEventListener("click", () => {
  dialogModal.style.display = "none";
});

cancelOrderForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const reason = cancelReason.value.trim();
  if (!reason || reason.length < 4) {
    toastr.warning("Enter a valid reason", "Warning");
    return;
  }

  try {
    const response = await fetch("/account/orders/all/ord/cancel/order", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancelReason: reason }),
    });
    const data = await response.json();

    if (response.ok) {
      toastr.success(data.message, "Success");
      setTimeout(() => {
        location.reload();
      }, 2000);
    } else {
      toastr.error(data.error || "Somthing went wrong", "Error");
    }
  } catch (error) {
    console.error(error);
    alert("Server not responding");
  }
});

// return an item page
function returnProduct() {
  window.location.href = "/account/orders/all/ord/items/return";
}

async function generateInvoice() {
  const invoiceBtn = document.querySelector(".invoiceBtn");
  try {
    invoiceBtn.disabled = true;
    invoiceBtn.textContent = "Downloading Invoice...";

    window.location.href = "/account/orders/all/ord/invoice/download";
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  } finally {
    setTimeout(() => {
      invoiceBtn.disabled = false;
      invoiceBtn.textContent = "Download Invoice";
    }, 3000);
  }
}

const retryPayBtn = document.getElementById("retryPayBtn");

retryPayBtn.addEventListener("click", async () => {
  let isPaidSuccessfully = false;
  try {
    const res = await fetch("/account/orders/all/ord/payment/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await res.json();

    if (res.ok) {
      console.log("ok res from raxor")
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
            const varificationRes = await fetch(
              "/account/orders/all/ord/payment/varify",
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...response, success: true }),
              }
            );

            const varificationResult = await varificationRes.json();

            if (varificationRes.ok) {
              isPaidSuccessfully = true;
              alert(varificationResult.message)
              location.reload();
            } else {
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
            if (isPaidSuccessfully) {
              console.log("reload the page")
              location.reload();
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
        const varificationRes = await fetch(
          "/account/orders/all/ord/payment/varify",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.error.metadata.payment_id,
              razorpay_order_id: response.error.metadata.order_id,
              success: false,
            }),
          }
        );

        const varificationResult = await varificationRes.json();
        alert(varificationResult.message);
      });
    }
  } catch (error) {
    console.error(error);
    alert("Error placing order on razorpay");
  }
});
