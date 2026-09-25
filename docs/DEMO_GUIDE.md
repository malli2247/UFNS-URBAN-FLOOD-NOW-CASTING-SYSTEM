# AQUILA Evaluator & SIH Demonstration Guide

**Project**: AQUILA – Real-Time Urban Flood Nowcasting Engine  
**SIH 2026 Problem Statement ID**: 26085  
**Team**: NEXORA  

---

## 🎬 Step-by-Step Judge Demonstration Script (5 to 7 Minutes)

### Phase 1: Landing Page & Problem Context (1 min)
1. Open `http://localhost:5173` in a web browser.
2. Note the clear positioning: *"Predict urban flooding before it reaches the street."*
3. Highlight the 0–3 hour prediction window, 350m spatial resolution, bidirectional drainage coupling, and flood-safe routing.
4. Click **"Launch Command Center"** to enter the primary dashboard.

---

### Phase 2: Command Center & Dynamic KPIs (1 min)
1. Point to the **Top Header**:
   - Operational Status badge (pulsing green dot).
   - Data Mode Switcher (`● DEMO SIMULATION`, `● HISTORICAL REPLAY`, `● LIVE DATA`).
   - Forecast Horizon badge (`+0m`, `+15m`, `+30m`, `+1h`, `+2h`, `+3h`).
2. Point to the **Hero Metrics Row**:
   - Current Flood Risk (`HIGH RISK` or `CRITICAL`).
   - Predicted Maximum Water Depth (e.g., `42.0 cm`).
   - Peak Expected Time (`1h 15m`).
   - Affected Road Corridors (`14`).
   - Critical Drainage Nodes (`6` surcharged).
   - Safe Emergency Routes (`8` open corridors).
   - Multi-source Confidence (`86%`).

---

### Phase 3: Automated 60-Second "Run Flood Scenario" (1.5 min)
1. Click the **"RUN FLOOD SCENARIO"** button in the header.
2. Observe the automated time-lapse progression through the horizons:
   - **T+0 min**: Convective rainfall develops; radar reflectivity rises to 45 dBZ.
   - **T+30 min**: Low-lying basins accumulate surface runoff; roads show caution state.
   - **T+60 min**: Conduits approach 85–95% capacity.
   - **T+90 min**: Critical manholes surcharge; backflow spills onto EcoSpace ORR and Rainbow Drive (water depth exceeds 45 cm).
   - **T+120 min**: Road segments turn Red/Impassable; critical flood alerts trigger.
   - **T+180 min**: Water recedes into outfall sluices.

---

### Phase 4: Interactive GIS Map & Layer Toggles (1 min)
1. Navigate to **"Flood Map (GIS)"** from the sidebar.
2. Demonstrate the toggles in the floating control panel:
   - `[✓] Flood Water Depth Grid`: Color-coded in centimeters.
   - `[✓] Doppler Radar Reflectivity`: Moving storm cell boundaries.
   - `[✓] Drainage Network & Surcharge`: Pink pulsating markers on surcharging manholes.
   - `[✓] Road Status`: Green open vs. Red blocked corridors.
   - `[✓] IoT Sensors`: Ultrasonic water level gauges with battery status.
   - `[✓] Emergency Facilities`: Hospitals, fire stations, and shelters.
3. Click any grid cell or manhole to inspect localized elevation, slope, imperviousness, and backflow volume.

---

### Phase 5: Flood-Safe Emergency Routing (1 min)
1. Click **"Safe Routes"** in the sidebar.
2. Select **Ambulance (25 cm clearance)**.
3. Observe the calculated routes:
   - **Emergency Priority Route**: Automatically rerouted through elevated expressways.
   - **Avoidance Reasoning Box**: Explains: *"EcoSpace ORR Underpass avoided: predicted water depth of 46.5 cm exceeds Ambulance clearance (25.0 cm)."*
4. Switch to **Standard Car (20 cm clearance)** and **Fire Truck (50 cm clearance)** to demonstrate multi-modal dynamic adaptation.

---

### Phase 6: Scientific Validation & Self-Calibration (1 min)
1. Click **"Model Validation"** in the sidebar.
2. Highlight the authentic evaluation metrics:
   - **ML MAE**: 7.4 cm vs. Baseline MAE: 14.8 cm.
   - **R² Goodness of Fit**: 0.84.
   - **Precision**: 0.91 &bull; **Recall**: 0.87.
3. Show the **Forecast Horizon Degradation Table** (+15m to +3h error growth).
4. Click **"Trigger Self-Calibration"**:
   - Demonstrates the real-time sensor feedback loop reducing MAE from 12.4 cm down to 7.4 cm (a 40% error reduction).

---

### Phase 7: SIH Presentation Mode (Projector Display)
1. Click **"JUDGE MODE"** in the top navigation bar.
2. Present the streamlined 8-slide pitch deck designed specifically for display on SIH judging screens.
