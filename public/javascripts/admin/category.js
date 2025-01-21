const categoryForm = document.querySelector(".category-form");
const categoryName = document.getElementById("categoryName");
const isListed = document.getElementById("isListed");
const error = document.getElementById("error");
const nameRegex = /^[a-zA-Z\s]+$/;

categoryName.addEventListener("input", () => {
  const category = categoryName.value.trim();
  if (!nameRegex.test(category)) {
    error.innerHTML = "The name should only contain letters.";
  } else {
    error.innerHTML = "";
  }
});

categoryForm.addEventListener("submit", (e) => {
  e.preventDefault();
  let isValid = true;
  const category = categoryName.value.trim();
  if (!category || !nameRegex.test(category) || !isListed.value) {
    isValid = false;
    error.innerHTML = "Please enter valid credentials.";
  }

  if (isValid) {
    error.innerHTML = "";
    e.target.submit();
  }
});
