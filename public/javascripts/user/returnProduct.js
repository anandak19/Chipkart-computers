document.addEventListener("DOMContentLoaded", () => {
  const returnItemsOpenBtn = document.getElementById("returnItemsOpenBtn");

  returnItemsOpenBtn.addEventListener("click", async() => {
    let checkboxes = document.querySelectorAll(".returnProducts");
    let selectedProducts = [];

    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        selectedProducts.push(checkbox.value);
      }
    });

    console.log("Selected Products:", selectedProducts);

    const response = await fet
  });
});
