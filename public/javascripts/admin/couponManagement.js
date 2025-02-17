
// show all Coupons 
const showCoupons = (coupons) => {
    const couponTableBody = document.getElementById('couponTableBody')

    couponTableBody.innerHTML = ''

    if (coupons.length > 0) {
        coupons.forEach((coupon, index) => {
            const row = document.createElement("tr");
            row.innerHTML =`
                <td>${index + 1}</td>
                <td>${coupon.couponCode}</td>
                <td>${coupon.discount}</td>
                <td>${coupon.description}</td>
                <td>${coupon.minOrderAmoun}</td>
                <td>${new Date(coupon.createdAt).toLocaleDateString()}</td>
                <td>${new Date(coupon.expirationDate).toLocaleDateString()}</td>
                <td>
                    <span class="badge ${
                        coupon.couponStatus === "active"
                        ? "bg-success"
                        : coupon.couponStatus === "expired"
                        ? "bg-danger"
                        : "bg-secondary"
                    }">
                        ${coupon.couponStatus}
                    </span>
                </td>
            `

            couponTableBody.appendChild(row);
        });
        
    }else{
        console.log("nop")
    }
}

let page = 0
// get all Coupons 
const getAllCoupons = async() => {
    try {
        const url = `/admin/coupons/all?page=${page}`

        const res = await fetch(url)

        const result = await res.json()

        if (res.ok) {
            showCoupons(result.coupons)
        }else{
            alert(result.error)
        }

    } catch (error) {
        console.error(error);
        alert("Somthing went wrong")
    }
}

document.addEventListener("DOMContentLoaded", () => {
    getAllCoupons()
})