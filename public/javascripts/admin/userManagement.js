const prevBtn = document.querySelector('.prev-btn')
const nextBtn = document.querySelector('.next-btn')
const searchForm = document.querySelector('.search-form')
const userTable = document.getElementById("userTable");

let page = 0;
let search = ""; 


// to block a user
const blockUser = (userId, userEmail) => {
  const dialog = document.querySelector(".dialog");
  const blockUserForm = document.getElementById("blockUserForm");
  const cancelButton = document.getElementById("cancelButton");
  const blockUserName = document.getElementById("blockUserName");
  const blockReason = document.getElementById("blockReason");
  const resonError = document.getElementById("resonError");
  const resonSuccess = document.getElementById("resonSuccess");

  blockUserName.innerText = "";
  resonError.innerText = "";
  resonSuccess.innerText = "";
  dialog.style.display = "flex";
  blockUserName.innerText = userEmail;
  console.log("started to block ", userEmail);

  // when submiting the form
  blockUserForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let isValid = true;
    const reason = blockReason.value.trim();

    if (!reason) {
      isValid = false;
      resonError.innerText = "Enter a valid reson";
    }

    if (isValid) {

      resonError.innerText = "";

      try {
        const response = await fetch(`/admin/users/toggle-block/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });

        const data = await response.json();
        if (response.ok) {
          resonSuccess.innerText = data.message;
          setTimeout(() => {
            blockUserForm.reset();
            dialog.style.display = "none";
            location.reload();
          }, 1000);
        } else {
          alert("Error blocking user", data.message);
        }

      } catch (error) {
        console.error("Error toggling user:", error);
        alert("Something went wrong. Please try again.");
      }
    }
  });

  // cancel the form 
  cancelButton.addEventListener("click", () => {
    blockUserForm.reset();
    dialog.style.display = "none";
  })
};

const unblockUser = async(userId) => {
  try {
    const response = await fetch(`/admin/users/toggle-block/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (response.ok) {
      resonSuccess.innerText = data.message;
      location.reload();
    } else {
      alert("Error blocking user", data.message);
    }

  } catch (error) {
    console.error("Error toggling user:", error);
    alert("Something went wrong. Please try again.");
  }
}

// to add toggle events
const addEvents = () => {
  const toggleBtns = document.querySelectorAll(".toggle-block");

  toggleBtns.forEach((toggleBtn) => {
    toggleBtn.addEventListener("click", (e) => {
      const userId = e.target.getAttribute("data-user-id");
      const userEmail = e.target.getAttribute("data-user-email");
      const toggleState = toggleBtn.innerText;
      if (toggleState === "Block") {
        console.log("STart blocking");
        blockUser(userId, userEmail);
      } else if (toggleState === "Unblock") {
        console.log("start unblock");
        unblockUser(userId)
      } else {
        console.error("Error blocking user");
      }
    });
  });
};

// show users
const showUsers = (users, totalUsers) => {
  userTable.innerHTML = "";
  if (users.length > 0 || totalUsers > 0) {
    console.log(users);
    users.forEach((user, index) => {
      const row = document.createElement("tr");

      row.innerHTML = `
          <td>${index + 1}</td>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.phoneNumber}</td>
          <td>${user.isVerified ? "Yes" : "No"}</td>
          <td>${new Date(user.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}</td>
          <td>${user.isBlocked ? "Yes" : "No"}</td>
          <td>
            <button class="btn ${
              user.isBlocked ? "btn-success" : "btn-danger"
            } btn-sm toggle-block" data-user-id= "${
        user._id
      }" data-user-email= ${user.email}>
              ${user.isBlocked ? "Unblock" : "Block"}
            </button>
          </td>
      `;
      userTable.appendChild(row);
    });
    // add click events to all buttons
    addEvents();
  } else {
    const row = document.createElement("tr");
    row.innerHTML = `No users found`;
    userTable.appendChild(row);
    console.log("no usrs found");
  }
};

// update paginators
const updatePaginators = (hasMore) => {
  prevBtn.disabled = page === 0;
  nextBtn.disabled = !hasMore
};



// method to call getUsers api
const getUsers = async (page = 0, search = "") => {
  console.log(page)
  try {
    let url = `/admin/users/all?page=${page}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error("Failed to parse JSON:", jsonError);
      alert("Invalid response from the server");
      return;
    }

    const { hasMore, success, totalUsers, users, message } = data;

    if (success) {
      showUsers(users, hasMore, totalUsers);
      updatePaginators(hasMore)
    } else {
      alert(message);
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
};

// method to set search query
const searchInput = document.getElementById('searchQuery');
searchForm.addEventListener('submit', (e) => {
  e.preventDefault()
  const errorMessage = document.getElementById('errorMessage')
  const search = searchInput.value.trim();
  errorMessage.innerText = ''
  let isValid = true

  if(!search){
    isValid = false
    errorMessage.innerText = 'Enter name or email of user'
  }

  if (isValid) {
    console.log(search)
    getUsers(0, search)
  }
})

searchInput.addEventListener('input', () =>{
  if (searchInput.value.trim() === '') {
    getUsers()
  }
})

// method to next page
nextBtn.addEventListener('click', () => {
  page++
  getUsers(page)
})

// method to prev page
prevBtn.addEventListener('click', () => {
  page--;
  getUsers(page)
})


// domLoad method call
document.addEventListener("DOMContentLoaded", getUsers);
// document.addEventListener("DOMContentLoaded", () => {
//   getUsers(0, 'Aaanandans')
// });
