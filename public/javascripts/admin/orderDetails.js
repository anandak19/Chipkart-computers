const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const userPhone = document.getElementById("userPhone");
// address
const reciver = document.getElementById("reciver");
const phone = document.getElementById("phone");
const addressField = document.getElementById("address");
const landmark = document.getElementById("landmark");

const orderItemTable = document.getElementById("orderItemTable");

// method to get items details
const showOrderInfo = (user, address) => {
  userName.innerText = user.name;
  userEmail.innerText = user.email;
  userPhone.innerText = user.phoneNumber;
  // address
  reciver.innerText = address.fullName;
  phone.innerText = address.phoneNumber;
  const formattedAddress = `${address.addressLine}, ${address.city}, ${address.state}, ${address.country}, ${address.pincode}`;
  addressField.innerText = formattedAddress;
  landmark.innerText = address.landmark || "Nil";
};

// method to get user info and address
const getAddressUserInfo = async () => {
  try {
    const response = await fetch("/admin/orders/info");
    const data = await response.json();
    console.log(data);
    if (response.ok) {
      const { address, user } = data;
      showOrderInfo(user, address);
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
};

// show orderd items
const showOrderItems = (orderDetails) => {
  orderItemTable.innerHTML = "";
  if (orderDetails.length > 0) {
    orderDetails.forEach((item, index) => {
      const row = document.createElement("tr");

      row.innerHTML = `
            <td>${index + 1}</td>
            <td><img src="${item.image.filepath}" alt="Product-image"></td>
            <td>${item.productName}</td>
            <td>${item.finalPrice}</td>
            <td>${item.quantity}</td>
            <td>${item.subTotalPrice}</td>
            <td>${
              item.returnStatus !== "none" ? `<p class='text-danger'>Yes</p>` : `No`
            }</td>
            <td>${item.returnReason}</td>
            ${
              item.returnStatus === "requested" ?
                `
                <td style="display: flex; flex-direction: column; gap: 4px">
                <button class="approve-btn" data-id="${item._id}">Approve</button>
                <button class="reject-btn" data-id="${item._id}">Reject</button>
                `
              : item.returnStatus === "approved"
              ? `<td style="color: green; font-weight: bold;">Approved and refunded</td>`
              : item.returnStatus === "rejected"
              ? `<td style="color: red; font-weight: bold;">Rejected</td>`
              : `<td>No request</td>`
            }

        `;
      orderItemTable.appendChild(row);
    });
  } else {
    const row = document.createElement("tr");
    row.innerHTML = `No users found`;
    orderItemTable.appendChild(row);
  }

  // to approve and refund the amount to user 
  document.querySelectorAll(".approve-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const itemId = this.getAttribute("data-id");
      const customDialog = document.getElementById("customDialog");
      customDialog.style.display = "flex";

      const confirmBtn = document.getElementById("confirmBtn");
      const cancelButton = document.getElementById("cancelButton");

      confirmBtn.addEventListener("click", async () => {
        try {
          const response = await fetch(
            `/admin/orders/return/approve/${itemId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const data = await response.json();
          if (response.ok) {
            customDialog.style.display = "none";
            getOrderItems()
          } else {
            alert(data.error || "Failed to approve return");
          }
        } catch (error) {
          console.error("Error:", error);
          alert("Error approving refund request");
        }
      });

      cancelButton.addEventListener("click", () => {
        customDialog.style.display = "none";
      });
    });
  });

  // to reject the return and refund amount 
  document.querySelectorAll(".reject-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const itemId = this.getAttribute("data-id");
      const rejectDialog = document.getElementById('rejectDialog')
      rejectDialog.style.display = 'flex'

      const rejectItemForm = document.getElementById('rejectItemForm')
      rejectItemForm.addEventListener('submit', async(e) => {
        e.preventDefault()

        const rejectReason = document.getElementById('rejectReason')
        const rejectReasonInput = rejectReason.value.trim()

        if (!rejectReasonInput) {
          toastr.error("Plese provide a reason")
          return
        }



        try {
          //api goes here
          const res = await fetch(`/admin/orders/return/reject/${itemId}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({reason: rejectReasonInput})
          })

          const data = await res.json();

          if (!res.ok) {
            alert(data.error|| "Failed to reject return request")
          }

          toastr.success(data.message)
          rejectDialog.style.display = 'none'
          rejectItemForm.reset()
          getOrderItems()
        } catch (error) {
          console.error("Error:", error);
          alert("Error rejecting refund");
        }
      })

      // close the dialogue window 
      const cancelButton = document.getElementById('cancelRejectBtn')
      cancelButton.addEventListener('click', () => {
        rejectDialog.style.display = 'none'
        rejectItemForm.reset() 
      })


    });
  });
};

// method to get the orderd items
const getOrderItems = async () => {
  try {
    const response = await fetch("/admin/orders/items");
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

document.addEventListener("DOMContentLoaded", () => {
  getAddressUserInfo();
  getOrderItems();
});

// cancel order
const cancelOrderBtn = document.querySelector(".cancel-order-btn");
const cancelReason = document.getElementById("cancelReason");
cancelOrderBtn.addEventListener("click", async () => {
  const reason = cancelReason.value.trim();
  if (!reason) {
    toastr.error("You must provide a valid reason");
    return;
  }

  try {
    const response = await fetch("/admin/orders/cancel/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancelReason: reason }),
    });

    const data = await response.json();
    if (response.ok) {
      toastr.success(data.message || "Order cancelled");
      setTimeout(() => {
        location.reload();
      }, 2000);
    } else {
      toastr.error(data.error || "Somthing went wrong");
    }
  } catch (error) {
    console.error(error);
    alert("somthing went wrong");
  }
});

const backButton = document.querySelector(".back-btn");
if (backButton) {
  backButton.addEventListener("click", () => {
    window.location.href = "/admin/orders";
  });
}
