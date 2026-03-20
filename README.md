# AI Powered Insurance for India's Gig Economy

Food delivery workers form a major part of the gig economy and rely on daily, activity-based earnings rather than fixed salaries. Their income is directly tied to the number of deliveries they complete within a given time.
 
## Requirement

The system aims to provide income protection for food delivery workers by detecting external disruptions and compensating for the loss of earning opportunities. Instead of relying on manual claims, the platform uses a parametric approach, where payouts are triggered automatically when predefined conditions are met.

The core requirement is to build a system that can:

- Identify external, area-wide disruptions
- Estimate expected income loss based on working patterns
- Trigger and process payouts automatically

## Persona-Based Scenarios

Consider a typical food delivery partner working in an urban area. Their income depends on the number of deliveries completed per hour, which in turn depends on external conditions.

In one scenario, the worker logs in during the evening to maximize earnings. Suddenly, heavy rainfall begins, leading to unsafe road conditions and a drop in order demand. Although the worker is available, they are unable to continue working effectively, resulting in lost income.

In another case, the worker is active during peak hours when the delivery platform experiences a server outage. Despite being ready to work, no orders are assigned, leading to a complete halt in earnings.

A third situation involves extreme heat conditions, where prolonged exposure makes it unsafe to continue working. The worker reduces their working hours, resulting in partial income loss.

These scenarios highlight a common issue: workers are willing to work but are prevented from earning due to factors beyond their control.

## Workflow of the Application

The application follows a structured flow to ensure automated and fair compensation.

Initially, the user registers on the platform and selects their working zone. Based on this information, the system evaluates the risk level and calculates a suitable weekly premium. Once the user activates a plan, they are covered for a fixed duration.

During the active period, the system continuously monitors external conditions such as weather and platform status. When a disruption is detected, the system verifies whether the user is active at that time. If both conditions are satisfied, it estimates the potential income loss using predefined earning models.

The payout is then calculated and automatically credited to the user, without requiring any manual claim submission.

## Weekly Premium Model

The platform follows a rolling weekly subscription model designed to provide flexible and continuous coverage. Once a user selects a plan and completes the payment, the insurance coverage becomes active immediately and remains valid for a period of seven days.

Instead of offering a fixed premium for all users, the system uses a dynamic pricing approach based on risk assessment. Each user is assigned a risk score derived from factors such as their working zone, expected weather conditions, and traffic levels. This ensures that users operating in higher-risk environments contribute slightly more, while lower-risk users benefit from reduced premiums.

For simplicity, the system offers tiered plans such as a basic and premium option, with the final weekly price adjusted according to the calculated risk score. This approach keeps the pricing model both fair and scalable, while remaining easy to understand for users

## Parametric Triggers

The system operates on a parametric insurance model, where payouts are triggered automatically when predefined conditions are met. These triggers are objective, measurable, and do not rely on manual claims or user input.

The primary disruptions considered in the system include:

- Heavy Rain: Triggered when rainfall exceeds a defined threshold, indicating unsafe working conditions and reduced demand.
- Extreme Heat: Activated when temperature crosses a safe working limit, leading to reduced working hours.
- Platform/Server Outage: Triggered when the delivery platform is unavailable, resulting in zero order allocation.
- Curfew or Area Restrictions: Represented as a system flag (simulated), indicating complete restriction of movement in a zone.

In addition to these, traffic conditions are incorporated as a secondary factor. While traffic does not directly trigger payouts, it influences the overall risk score and reduces estimated earning capacity, making the system more realistic.

All triggers are designed to be area-based and externally verifiable, ensuring transparency and preventing misuse.

## Platform Choice: Web Application

The solution is implemented as a web application.

A web-based approach was chosen primarily for its accessibility and ease of development. Users can access the platform directly through a browser without the need for installation, making it convenient for delivery workers who may use different devices. From a development perspective, a web application allows faster implementation of core features such as risk modeling, trigger simulation, and payout logic without the overhead of mobile app deployment.

Additionally, the web platform supports all required functionalities, including onboarding, plan selection, real-time monitoring, and analytics, while being easier to test and demonstrate.

Overall, the web application provides the most practical balance between usability, scalability, and development efficiency for the current prototype.

## AI/ML Integration in the Workflow

The platform leverages AI and ML techniques to enhance premium calculation, fraud detection, and risk prediction for delivery workers. Key components include:

### 1. AI-Powered Risk Assessment

- A lightweight AI model estimates the likelihood of income-disrupting events in each user’s zone.
- Inputs: Rain intensity, temperature, traffic levels, and zone type.
- Output: Risk Score, used to adjust weekly premiums dynamically.

This ensures high-risk users contribute slightly more while low-risk users benefit from reduced premiums.

### 2. Fraud Detection
ML models analyze patterns in user activity, payout history, and disruption frequency to flag anomalies:
- Ensure the user was active during a disruption.
- Limit payouts to one per disruption window.
- Detect unusual patterns inconsistent with expected earning models.

This minimizes misuse without manual verification.

### 3. Adaptive Payout Estimation
ML refines income loss predictions using historical and simulated data:
- Hourly earnings in specific zones.
- Impact of traffic or weather conditions.

This helps calculate accurate payouts while respecting daily and weekly limits.

## Technology Stack and Development Plan

### 1. Frontend
- **HTML, CSS, JavaScript** for building responsive and interactive user interfaces.
- Features implemented:
  - User onboarding and registration
  - Weekly plan selection
  - Dashboard for coverage, payouts, and analytics

### 2. Backend / Storage
- **LocalStorage** (for prototype/demo purposes)
- Simulated APIs for:
  - Weather and temperature
  - Traffic conditions
  - Platform/server status
- Future enhancement: migrate to cloud storage or Firebase for real-time data and scalability.

### 3. AI/ML Components
- Lightweight ML models for:
  - Risk scoring for premium calculation
  - Fraud detection based on user activity and payout patterns
  - Adaptive payout estimation using historical/simulated data

### 4. Workflow & Development Plan
1. **Phase 1:** Prototype development
   - Build core web application
   - Implement parametric triggers and automated payout logic
   - Simulate data for weather, traffic, and system status
2. **Phase 2:** AI/ML integration
   - Risk scoring and premium calculation
   - Fraud detection and adaptive payout estimation
3. **Phase 3:** Testing & Analytics
   - Test triggers and payout calculations
   - Dashboard for user and admin metrics
4. **Phase 4:** Future Enhancements
   - Real-time APIs for weather, AQI, and platform status
   - Payment gateway integration (UPI, wallets)
   - Advanced ML for predictive analytics and real delivery data

### 5. Additional Considerations
- **Scalability:** Web-based architecture allows easy scaling for multiple zones and users.
- **Accessibility:** Users can access the platform from any browser without installation.
- **Transparency:** Parametric triggers are objective and externally verifiable.
- **Fraud Prevention:** Fixed earning models, active user verification, and ML-based anomaly detection ensure fair payouts.

### 4. Future AI/ML Enhancements
- Integrate real-time delivery platform data for better prediction accuracy.
- Use advanced ML for dynamic risk scoring beyond fixed formulas.
- Apply predictive analytics to anticipate disruptions and optimize coverage.

**Overall Impact:**  
AI/ML enables fair, automated, and data-driven insurance decisions, supporting dynamic premium calculation, precise income loss estimation, and robust fraud prevention.

## Adversarial Defense & Anti-Spoofing Strategy

Simple GPS verification fails against Telegram-organized GPS-spoofing syndicates. We use **behavioral signals** for multi-layered detection of coordinated fraud rings faking weather strandings from home.

### 1. Differentiation
**Real riders** show normal trip patterns and GPS matches IP location. **Spoofers** trigger alerts when:  
- Historical trip patterns suddenly deviate from 6-month baselines  
- IP address shows safe home zone while GPS claims red-alert area  
- Multiple claims share identical device fingerprints or network patterns  

### 2. The Data  
**Behavioral signals:**  
- Historical trip patterns (sudden deviation from rider baselines)  
- IP-GPS mismatch (home IP vs. claimed red-alert GPS)  
- Device fingerprints (shared Android IDs across claims)  
- Network metadata (Telegram-like data bursts from clustered devices)  

Cross-checked with order history (no active deliveries) + peer density (50+ claims from one pincode).  

### 3. UX Balance
Flagged claims get **instant chat**: "Send current order screenshot."  
- Honest workers: verified in <5 mins, full payout  
- Suspicious patterns: held for manual review  
- **No penalties** for genuine riders, with one-tap appeal button
