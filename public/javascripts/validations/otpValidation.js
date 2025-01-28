document.addEventListener("DOMContentLoaded", () => {
  const timerElement = document.getElementById("timer");
  const duration = 60;
  const storageKey = "otpStartTime";

  function startTimer() {
    const now = Date.now();
    const startTime = localStorage.getItem(storageKey);

    let remainingTime;
    if (startTime) {
      const elapsed = Math.floor((now - parseInt(startTime, 10)) / 1000);
      remainingTime = duration - elapsed;
      if (remainingTime <= 0) {
        // Timer expired
        timerElement.innerText = "Time expired. Please request a new OTP.";
        return;
      }
    } else {
      remainingTime = duration;
      localStorage.setItem(storageKey, now.toString());
    }

    const interval = setInterval(() => {
      if (remainingTime <= 0) {
        clearInterval(interval);
        timerElement.innerText = "Time expired. Please request a new OTP.";
      } else {
        timerElement.innerText = `Time remaining: ${remainingTime}s`;
        remainingTime--;
      }
    }, 1000);
  }
  startTimer();
});

//   only numbers can be entered
function validateOTPInput(input) {
  input.value = input.value.replace(/[^0-9]/g, "");
}

const resendOtpBtn = document.getElementById("resendOtpBtn");
resendOtpBtn.addEventListener("click", async () => {
  try {

    const response = await fetch(`/resend-otp`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if(response.ok) {
        const data = await response.json()
        console.log('otp send: ', data)
        alert("Otp resend successfully")
        localStorage.removeItem("otpStartTime");
        window.location.replace(data.redirectUrl);
    }else{
        console.error('Failed to resend otp');
        alert("Faild to resend otp")
        
    }

  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
});

// OTP Box input navigation
const otpBoxes = document.querySelectorAll(".otp-box");

otpBoxes.forEach((box, index) => {
  box.addEventListener("input", (e) => {
    if (e.target.value.length === 1 && index < otpBoxes.length - 1) {
      otpBoxes[index + 1].focus();
    } else if (e.target.value.length === 1 && index === otpBoxes.length - 1) {
      box.blur();
    } else if (e.inputType === "deleteContentBackward" && index > 0) {
      otpBoxes[index - 1].focus();
    }
  });
});

//   on submiting the otp form
document.getElementById("otp-form").addEventListener("submit", function (e) {
  const otp1 = document.getElementById("otp1").value;
  const otp2 = document.getElementById("otp2").value;
  const otp3 = document.getElementById("otp3").value;
  const otp4 = document.getElementById("otp4").value;

  const otp = otp1 + otp2 + otp3 + otp4;

  const otpInput = document.createElement("input");
  otpInput.type = "hidden";
  otpInput.name = "otp";
  otpInput.value = otp;

  this.appendChild(otpInput);
});
