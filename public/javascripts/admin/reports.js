const ordersTableBody = document.getElementById("ordersTableBody");
const totalRevenue = document.getElementById("totalRevenue");
const totalOrders = document.getElementById("totalOrders");
const totalProducts = document.getElementById("totalProducts");
const totalDiscount = document.getElementById("totalDiscount");

// method to show the orders
const showAllOrders = (allOrders) => {
  ordersTableBody.innerHTML = "";
  if (allOrders.length > 0) {
    allOrders.forEach((order) => {
      const orderRow = document.createElement("tr");
      orderRow.innerHTML = `
                <td>${order.orderId}</td>
                <td>${order.customerName}</td>
                <td>${order.totalPayable}</td>
                <td>${order.totalProducts}</td>
                <td>${order.paymentMethod}</td>
            `;
      ordersTableBody.appendChild(orderRow);
    });
  } else {
    ordersTableBody.innerHTML = `<tr>Nothing to show</tr>`;
  }
};

const showOverview = (reportOverview) => {
  totalRevenue.innerText = reportOverview.totalRevenue;
  totalOrders.innerText = reportOverview.totalOrders;
  totalProducts.innerText = reportOverview.totalSalesCount;
  totalDiscount.innerText = reportOverview.totalCouponDiscount;
};

// method to get the orders and other details
const getSalesReportData = async (
  period = null,
  startDate = null,
  endDate = null
) => {
  try {
    let url = `/admin/reports/data`;
    let queryParams = [];

    if (period) {
      queryParams.push(`period=${period}`);
    }

    if (startDate && endDate) {
      console.log(startDate);
      queryParams.push(`startDateQuery=${startDate}&endDateQuery=${endDate}`);
    }

    if (queryParams.length > 0) {
      url += `?${queryParams.join("&")}`;
    }

    console.log(url);

    const res = await fetch(url);
    const result = await res.json();

    if (res.ok) {
      console.log(result);
      showOverview(result.reportOverview);
      showAllOrders(result.allOrders);
    } else {
      alert(res.error);
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
};

// method to call on dom loaded
document.addEventListener("DOMContentLoaded", () => {
  getSalesReportData();
});

// method to call on period change
period.addEventListener("change", () => {
  const periodVal = period.value;
  if (periodVal === "all" || periodVal === "custom") {
    getSalesReportData();
  } else {
    getSalesReportData(periodVal, undefined, undefined);
  }
});

// method to call after end date entering
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");

const getCustomeFilterData = () => {
  const startDateQuery = startDate.value;
  const endDateQuery = endDate.value;

  if (startDateQuery && endDateQuery) {
    console.log("geting the val of", startDateQuery, endDateQuery);
    getSalesReportData(null, startDateQuery, endDateQuery);
  }
};

startDate.addEventListener("change", () => {
  getCustomeFilterData();
});

endDate.addEventListener("change", () => {
  getCustomeFilterData();
});

//pdf generate 
const pdfBtn = document.querySelector('.btn-generate')
async function generatePdf() {
  try {
    pdfBtn.disabled = true;
    pdfBtn.textContent = "Generating PDF...";

    window.location.href = "/admin/reports/data/dowload/pdf";

  } catch (error) {
    console.log(error);
    alert("Something went wrong");
  } finally {
    setTimeout(() => {
      pdfBtn.disabled = false;
      pdfBtn.textContent = "Generate PDF";
    }, 3000);
  }
}

