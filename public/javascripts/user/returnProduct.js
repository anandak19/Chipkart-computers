document.addEventListener("DOMContentLoaded", () => {
  const returnItemsOpenBtn = document.getElementById("returnItemsOpenBtn");
  const closeBtn = document.getElementById("closeBtn");
  const returnDialogModal = document.getElementById("returnDialogModal");
  const returnItemForm = document.getElementById("returnItemForm");

  returnItemsOpenBtn.addEventListener("click", () => {
    returnDialogModal.style.display = "flex";
  });

  closeBtn.addEventListener("click", () => {
    returnDialogModal.style.display = "none";
    returnItemForm.reset()
  });

  returnItemForm.addEventListener("submit", async (e) => {
    e.preventDefault()
    let checkboxes = document.querySelectorAll(".returnProducts");
    let selectedProducts = [];

    const returnReason = document.getElementById('returnReason').value.trim()

    if (!returnReason) {
      toastr.error("Please enter a reason for return");
      return
    }

    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        selectedProducts.push(checkbox.value);
      }
    });

    if (selectedProducts.length === 0) {
      toastr.error("Choose the items you want to return");
      return
    }

    try {
      const response = await fetch("/account/orders/all/ord/items/return", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds: selectedProducts,
          returnReson: returnReason,
        }),
      });

      const data = await response.json();
      console.log(data);
      if (response.ok) {
        toastr.success("Your return request has been submitted successfully!");
        returnDialogModal.style.display = "none";
        returnItemForm.reset()
        setTimeout(() => {
          window.location.href = data.redirectUrl;
      }, 2000);
      } else {
        toastr.error(data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Error");
    }
  });
});

document.getElementById("returnReasonSelect").addEventListener("change", function () {
  const reasonInput = document.getElementById("returnReason");
  if (this.value === "Other") {
    reasonInput.style.display = "block";
    reasonInput.focus();
  } else {
    reasonInput.style.display = "none";
    reasonInput.value = this.value; 
  }
});
