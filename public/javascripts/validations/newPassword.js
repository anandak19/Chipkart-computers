const newPasswordForm = document.getElementById("newPasswordForm");
const passwordError = document.getElementById("passwordError");
const confirmPasswordError = document.getElementById("confirmPasswordError");
const successMsg = document.getElementById("successMsg");
const errorMsg = document.getElementById("errorMsg");

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,}$/;

document.addEventListener("DOMContentLoaded", () => {
  newPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document
      .getElementById("confirmPassword")
      .value.trim();
    const token = window.location.pathname.split("/").pop();

    passwordError.innerText = "";
    confirmPasswordError.innerText = "";
    successMsg.innerText = "";
    errorMsg.innerText = "";
    let isValid = true;

    if (!newPassword || !confirmPassword) {
      isValid = false;
      passwordError.innerText = "Please enter a new password and confirm it.";
    }

    if (!passwordRegex.test(newPassword)) {
      isValid = false;
      passwordError.innerText =
        "Password must be at least 4 characters long and include at least one letter and one number.";
    }

    if (newPassword !== confirmPassword) {
      isValid = false;
      confirmPasswordError.innerText = "Password does not match";
    }

    if (isValid) {
      try {
        const response = await fetch(`/reset-password/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: newPassword,
            confirmPassword: confirmPassword,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          successMsg.innerText =
            "Password reset successful! Redirecting to login...";
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else {
          errorMsg.innerText = data.error || "Faild to reset password";
        }
      } catch (error) {
        console.error("Error resetting password:", error);
        alert("An error occurred. Please try again.");
      }
    }
  });
});
