const addressContainer = document.getElementById("addressContainer");

// method to show fetched address
const renderAddressses = (addresses) => {
  addressContainer.innerHTML = "";

  if (addresses.length === 0) {
    addressContainer.innerHTML = "<p>Nothing to show</p>";
  } else {
    addresses.forEach((address) => {
      const addressCard = document.createElement("div");
      addressCard.classList.add("address-card");

      addressCard.innerHTML = `
              <button class="${
                address.isDefault ? "active-btn" : "inactive-btn"
              }"
                data-id="${address._id}" onClick="setDefaultAddress(event)" >
                ${address.isDefault ? "Default" : "Make Default"}
              </button>
              <div class="address-content">
                <h3>${address.fullName}</h3>
                <p>${address.phoneNumber}</p>
                <p>${address.addressLine}, ${address.city}, ${address.state}, ${
        address.country
      }, ${address.pincode},</p>
              </div>
              <div class="actions">
                <a href="/account/address/${
                  address._id
                }"><i class="fas fa-pen"></i></a>
                <button class="delete-btn" data-id="${
                  address._id
                }" onClick="deleteAddress(event)"><i class="fa-solid fa-trash"></i></button>
              </div>
            `;

      addressContainer.appendChild(addressCard);
    });
  }
};

// method to get all the address of user
const getUserAddress = async () => {
  try {
    const response = await fetch("/account/address/all");
    data = await response.json();
    if (response.ok) {
      renderAddressses(data.data);
    }
  } catch (error) {
    console.log(error);
  }
};

// method to delete an address 
async function deleteAddress(event) {
  const button = event.target.closest(".delete-btn");
  if (!button) return;
  const addressId = button.dataset.id;

  if (!addressId) {
    console.error("Address ID is missing.");
    alert("Address ID is missing.");
    return;
  }

  try {
    const response = await fetch(`/account/address/${addressId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (response.ok) {
      alert("Address deleted successfully!");
      getUserAddress();
    } else {
      alert(data.error || "Failed to delete the address.");
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
}

// method to update an address status 
async function setDefaultAddress(event) {
  const addressId = event.target.dataset.id;

  if (!addressId) {
    console.error("Address ID is missing.");
    alert("Address ID is missing.");
    return;
  }

  try {
    const response = await fetch(`/account/address/toogle/${addressId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (response.ok) {
      getUserAddress();
    } else {
      alert(data.error || "Failed to update the address.");
    }
  } catch (error) {
    console.error("Error setting default address:", error);
    alert("Something went wrong. Please try again.");
  }
}

document.addEventListener("DOMContentLoaded", getUserAddress);
