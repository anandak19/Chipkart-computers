// demo user cred
const demo_user_cred = {
  email: "lajat21219@imashr.com",
  password: "Abcd123",
};

const loginForm = document.getElementById("loginForm");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const loginError = document.getElementById("loginError");

const demoLoginBtn = document.getElementById("demo-auth-btn");

// login method
const loginUser = async (email, password) => {
  const submitBtn = loginForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  // demo login btn
  demoLoginBtn.disabled = true;

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      window.location.replace("/");
    } else {
      loginError.innerText = data.message;
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong. Please try again.");
  } finally {
    submitBtn.disabled = false;
    // demo login btn
    demoLoginBtn.disabled = false;
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  // noraml login
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let isValid = true;
    emailError.innerText = "";
    passwordError.innerText = "";
    loginError.innerText = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email) {
      isValid = false;
      emailError.innerText = "Enter your email address";
    }

    if (!password) {
      isValid = false;
      passwordError.innerText = "Enter your password";
    }

    if (isValid) {
      await loginUser(email, password);
    }
  });

  // demo login
  demoLoginBtn.addEventListener("click", async () => {
    const { email, password } = demo_user_cred;
    await loginUser(email, password);
  });
});
