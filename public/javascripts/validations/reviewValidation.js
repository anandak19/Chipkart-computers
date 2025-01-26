const ratingError = document.getElementById("ratingError");
const reviewError = document.getElementById("reviewError");

document.addEventListener("DOMContentLoaded", () => {
  let rating = 0;
  const stars = document.querySelectorAll(".star");
  const reviewTextArea = document.getElementById("reviewText");

  stars.forEach((star) => {
    star.addEventListener("click", () => {
      ratingError.innerText = "";
      rating = parseInt(star.getAttribute("data-value"));
      updateStarRatings();
    });
  });

  function updateStarRatings() {
    stars.forEach((star) => {
      if (parseInt(star.getAttribute("data-value")) <= rating) {
        star.classList.add("selected");
      } else {
        star.classList.remove("selected");
      }
    });
  }

  document
    .getElementById("submitReview")
    .addEventListener("click", async () => {
      const reviewText = reviewTextArea.value.trim();

      if (rating === 0) {
        ratingError.innerText = "Please select a rating.";
        return;
      }

      if (reviewText === "") {
        reviewError.innerText = "Description cannot be empty";
        return;
      }

      const formData = {
        rating: rating,
        review: reviewText,
      };

      try {
        const res = await fetch(`/products/${window.productId}/review/new`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        alert("Review added successfully");
      } catch (error) {
        console.log(error);
      }

      reviewTextArea.value = "";
      rating = 0;
      updateStarRatings();
    });

  reviewText.addEventListener("input", () => (reviewError.innerText = ""));
});
