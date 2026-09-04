# CareDesk - Modern Doctor–Receptionist Appointment Management System

A high-performance, clinical-grade web application tailored for multi-specialty hospitals, outpatient clinics, and private practices. CareDesk empowers receptionists with rapid appointment booking, safe rescheduling, and queue management while giving physicians full control over daily consultation workflows and working schedules.

---

## Key Capabilities

### 1. Receptionist Hub & Patient Flow
- **Today's Live Queue**: Real-time patient check-ins, queue management, and 1-click status transitions (`Scheduled` → `Confirmed` → `Checked In` → `Completed` / `Rescheduled` / `Cancelled` / `No-Show`).
- **Conflict-Free Dynamic Booking**: Step-by-step or rapid booking with guaranteed zero double-booking. Slots are generated dynamically based on physician shifts, lunch/tea breaks, existing appointments, and scheduled leaves.
- **Smart Rescheduling**: One-click slot reassignment with audit reason logging and instant calendar updates.
- **Structured Cancellation**: Cancellation with categorized reason and automatic instantaneous slot liberation.
- **Printable Appointment Slips**: Hospital-standard thermal / A4 token slips with barcode-style token IDs and patient instructions.

### 2. Doctor Consultation Workspace & Scheduling
- **Live Availability Toggle**: Instant status switcher (`Available`, `In Consultation`, `On Break`, `On Leave`, `Unavailable`) with custom status notes.
- **Active Consultation Workspace**: Call next patient, review chief complaints, record clinical diagnoses, write prescriptions (Rx), and note follow-up dates.
- **Working Hours & Breaks Manager**: Customize shift hours per weekday (Monday–Sunday), configure midday breaks, and block out approved leave days.

### 3. Master Clinic Schedule & Calendar
- **3 Visual Modes**: Daily Hourly Timeline (08:00–18:00), Weekly 7-Day Matrix, and Monthly Overview.
- **Doctor & Specialty Filters**: Filter appointments by attending physician or medical department.

### 4. Patient Directory
- Comprehensive patient profiles with Patient IDs (`PAT-2026-001`), contact details, age/gender, blood group, and clinical allergies.
- Full appointment and consultation history log for each patient.

### 5. Audit Trail & Real-Time Alerts
- Chronological, tamper-evident audit ledger capturing every action (`BOOKED`, `RESCHEDULED`, `CANCELLED`, `CHECKED_IN`, `COMPLETED`, `DOCTOR_AVAILABILITY_CHANGED`).
- In-app notification bell with unread badges and immediate alerts for appointments and check-ins.

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React Icons
- **Date Engine**: `date-fns`
- **Data Persistence**: LocalStorage sync with pre-seeded multi-specialty clinic demo data
- **Delight & Feedback**: Canvas Confetti, Print CSS stylesheets

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation & Development Run
In PowerShell / Command Prompt:
```bash
# Navigate to project folder
cd "e:\AI Projects"

# Install dependencies (already installed)
npm install

# Start Vite Development Server
npm run dev
```

The application will be accessible at: `http://localhost:3000` (or `http://localhost:5173`).

### Production Build
```bash
npm run build
npm run preview
```

---

## Seamless Role Switching
Use the **Role Switcher** in the top navigation bar to toggle between:
- **Reception Desk**: Full clinic view, booking, rescheduling, and queue management.
- **Doctor View**: Select any physician (*Dr. Alexander Wright*, *Dr. Priya Sharma*, *Dr. Marcus Chen*, *Dr. Elena Rostova*, *Dr. David Kim*) to experience their personalized consultation queue and shift schedule.
