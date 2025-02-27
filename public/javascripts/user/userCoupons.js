const couponsDiv = document.querySelector('.coupons-container')

// method to show the coupons 
const showCoupons = (coupons) => {
    couponsDiv.innerHTML = ''
    if (coupons.length > 0) {
        coupons.forEach(coupon => {
            const couponCard = document.createElement('div')
            couponCard.classList.add('coupon-card')
            couponCard.innerHTML = `
             <div class="offer-text">
                <p>${coupon.description}</p>
             </div>

             <div class="coupon-code">
                <p>Code: <span>${coupon.couponCode}</span></p>
             </div>

             <div class="coupon-details">
                <p>Valid till: <span>${new Date(coupon.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}</span></p>
             </div>
            `

            couponsDiv.appendChild(couponCard)
        });
    }
}

// method to get the coupons 
const getAvailableCoupons = async() => {
    const url = `/account/coupons/all`
    try {
        const res = await fetch(url)

        const result = await res.json()

        if(res.ok) {
            showCoupons(result.userCoupons)
        }
    } catch (error) {
        console.error(error);
    }
}

// method to run on dom load 
document.addEventListener('DOMContentLoaded', () => {
    getAvailableCoupons()
})

// page next 

// page prev 