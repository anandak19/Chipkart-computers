let chart;
const showChart = (chartData) => {
  const labels = chartData.map((item) => item.label);
  const values = chartData.map((item) => item.value);

  if (chart) {
    chart.destroy();
  }

  const ctx = document.getElementById("myChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Total Products Sold",
          data: values,
          borderColor: "blue",
          backgroundColor: "rgba(0, 0, 255, 0.2)",
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
};

const bestSellingProducts = document.getElementById("bestSellingProducts");
const bestSellingCategory = document.getElementById("bestSellingCategory");
const bestSellingBrands = document.getElementById("bestSellingBrands");

const showTopSelling = (topSellingData, wrapperId) => {
  const listContainer = document.getElementById(wrapperId);
  listContainer.innerHTML = "";
  if (topSellingData.length > 0) {
    topSellingData.forEach((item, index) => {
      console.log(item)
      const listItem = document.createElement("li");
      listItem.classList.add("list-group-item");
      listItem.innerHTML = `${index + 1}. ${item.name}`;
      listContainer.appendChild(listItem)
    });
  }
};

const getChartData = async (period = "yearly") => {
  try {
    const url = `/admin/chart-data?period=${period}`;
    const response = await fetch(url);
    const data = await response.json();
    if (response.ok) {
      showChart(data);
    } else {
      alert(data.error);
      toastr.error(data.error);
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
};

const getTopSelling = async () => {
  try {
    const res = await fetch("/admin/top-selling");
    const data = await res.json();
    if (res.ok) {
      console.log(data);
      showTopSelling(data.bestSellingProducts, "bestSellingProducts");
      showTopSelling(data.topCategories, "bestSellingCategory");
      showTopSelling(data.bestSellingBrands, "bestSellingBrands");
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error(error);
    alert("Somthing went wrong");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  getChartData();
  getTopSelling();
});

document.getElementById("timeFilter").addEventListener("change", (event) => {
  const selectedPeriod = event.target.value;
  getChartData(selectedPeriod);
});
