let user = {
    name: "",
    platform: "",
    zone: "",
    riskScore: 0,
    premium: 0,
    payout: 0,
    plan: ""
};

let payoutsHistory = [];
let chart;

/* ---------------- REGISTER ---------------- */
function register() {
    user.name = document.getElementById('name').value;
    user.platform = document.getElementById('platform').value;
    user.zone = document.getElementById('zone').value;

    if (!user.name) {
        alert("Enter your name");
        return;
    }

    calculateRisk();

    document.getElementById('registration').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('welcome').innerText = `Welcome, ${user.name}!`;

    updateDashboard();
    drawChart();
}

/* ---------------- RISK CALCULATION ---------------- */
function calculateRisk() {
    // Assign risk score based on zone
    switch(user.zone) {
        case "zone1":
        case "zone2":
        case "zone8":
            user.riskScore = 80; break;

        case "zone3":
        case "zone4":
        case "zone7":
            user.riskScore = 50; break;

        case "zone5":
        case "zone6":
            user.riskScore = 20; break;

        default:
            user.riskScore = 30;
    }
}

/* ---------------- PLAN SELECTION ---------------- */
function selectPlan(planName) {
    user.plan = planName;

    if (planName === "Basic") {
        user.premium = 50;
    } else if (planName === "Premium") {
        user.premium = 100;
    }

    document.getElementById('premium').innerText = `Weekly Premium: ₹${user.premium}`;
    alert(`${planName} Plan Selected`);
}

/* ---------------- TRIGGER EVENTS ---------------- */
function triggerEvent(eventType) {
    let loss = 0;

    switch(eventType) {
        case "rain": loss = 40; break;
        case "heat": loss = 30; break;
        case "outage": loss = 60; break;
        case "curfew": loss = 80; break;
    }

    // Plan multiplier
    let multiplier = (user.plan === "Premium") ? 1 : 0.5;

    let payoutAmount = loss * multiplier;
    user.payout += payoutAmount;

    payoutsHistory.push({
        event: eventType,
        amount: payoutAmount
    });

    updateDashboard();
    drawChart();
}

/* ---------------- DASHBOARD UPDATE ---------------- */
function updateDashboard() {
    document.getElementById('riskScore').innerText = `Risk Score: ${user.riskScore}`;
    document.getElementById('premium').innerText = `Weekly Premium: ₹${user.premium}`;
    document.getElementById('payout').innerText = `Payout: ₹${user.payout}`;
}

/* ---------------- CHART ---------------- */
function drawChart() {
    const ctx = document.getElementById('payoutChart').getContext('2d');

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: payoutsHistory.map(p => p.event),
            datasets: [{
                label: 'Payout (₹)',
                data: payoutsHistory.map(p => p.amount),
                backgroundColor: 'rgba(0, 123, 255, 0.6)'
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/* ---------------- DRAGGABLE TRIGGER PANEL ---------------- */
const panel = document.getElementById("triggerPanel");

let isDragging = false;
let offsetX, offsetY;

panel.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - panel.offsetLeft;
    offsetY = e.clientY - panel.offsetTop;
});

document.addEventListener("mousemove", (e) => {
    if (isDragging) {
        panel.style.left = (e.clientX - offsetX) + "px";
        panel.style.top = (e.clientY - offsetY) + "px";
    }
});

document.addEventListener("mouseup", () => {
    isDragging = false;
});
