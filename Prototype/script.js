let coverageActive = false;
let payout = 0;
let weeklyPremium = 0;
let riskScore = 0;
let payoutHistory = [];

// Chart.js setup
const ctx = document.getElementById('payoutChart').getContext('2d');
const payoutChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Payout (₹)',
            data: [],
            backgroundColor: 'rgba(75, 192, 192, 0.7)'
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: { beginAtZero: true }
        }
    }
});

function register() {
    const name = document.getElementById('name').value;
    const platform = document.getElementById('platform').value;
    const zone = document.getElementById('zone').value;

    if (!name) return alert("Please enter your name.");

    // Dynamic premium & risk score
    switch(zone) {
        case 'low': weeklyPremium = 100; riskScore = 20; break;
        case 'medium': weeklyPremium = 150; riskScore = 50; break;
        case 'high': weeklyPremium = 200; riskScore = 80; break;
    }

    coverageActive = true;
    document.getElementById('welcome').innerText = `Welcome, ${name} (${platform})!`;
    document.getElementById('premium').innerText = `Weekly Premium: ₹${weeklyPremium}`;
    document.getElementById('riskScore').innerText = `Risk Score: ${riskScore}`;

    document.getElementById('registration').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

function triggerEvent(event) {
    if (!coverageActive) return alert("Activate coverage first!");

    // Simulate fraud detection: cannot trigger same event twice in a row
    if (payoutHistory[payoutHistory.length -1] === event) {
        alert("Suspicious activity detected! Event triggered twice consecutively.");
        return;
    }

    let amount = 0;
    switch(event) {
        case 'rain': amount = 500; break;
        case 'heat': amount = 300; break;
        case 'outage': amount = 700; break;
        case 'curfew': amount = 1000; break;
    }

    payout += amount;
    payoutHistory.push(event);

    document.getElementById('payout').innerText = `Payout: ₹${payout}`;

    // Update chart
    payoutChart.data.labels.push(event);
    payoutChart.data.datasets[0].data.push(amount);
    payoutChart.update();

    alert(`${event.charAt(0).toUpperCase() + event.slice(1)} triggered! Payout updated by ₹${amount}.`);
}
