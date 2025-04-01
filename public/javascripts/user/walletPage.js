const transactionsContainer = document.querySelector(".transactions-container");
let page = 0;

// method to show the transactions
const showTransactions = (transactions) => {
  transactionsContainer.innerHTML = "";

  if (transactions.length > 0) {
    transactions.forEach((trasaction) => {
      const trasactionsCard = document.createElement("div");
      trasactionsCard.classList.add("transaction-card");

      trasactionsCard.innerHTML = `
                <div class="amount">
                    <p class="text-success">
                        ${
                          trasaction.transactionType === "credit"
                            ? `<p class="text-success">+ ₹${trasaction.amount}</p>`
                            : `<p class="text-danger">- ₹${trasaction.amount}</p>`
                        }
                    </p>
                </div>
    
                <div class="payment-type">
                    <p>${trasaction.reason}</p>
                </div>
    
                <div class="meta-data">
                    <p>${new Date(trasaction.createdAt).toLocaleDateString(
                      "en-GB",
                      { day: "2-digit", month: "2-digit", year: "numeric" }
                    )}</p>
                    <p>${trasaction.transactionId}</p>
                </div>
            `;
      transactionsContainer.appendChild(trasactionsCard);
    });
  } else {
    transactionsContainer.innerHTML = `
        <p class="text-center text-muted">No transactions made till now</p>
        `;
  }
};

const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const updatePaginators = (hasMore) => {
  prevBtn.disabled = page === 0;
  nextBtn.disabled = !hasMore;
};

// method to get the transactions
const getWalletTransactions = async (page = 0) => {
  try {
    const url = `/account/wallet/all?page=${page}`;
    const res = await fetch(url);
    const result = await res.json();
    if (res.ok) {
      showTransactions(result.transactions);
      updatePaginators(result.hasMore);
    } else {
      alert(result.error || "Error fetching transactions");
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
};

// method thatn run on dom load
document.addEventListener("DOMContentLoaded", getWalletTransactions);

prevBtn.addEventListener("click", () => {
  page--;
  getWalletTransactions(page);
});

nextBtn.addEventListener("click", () => {
  page++;
  getWalletTransactions(page);
});
