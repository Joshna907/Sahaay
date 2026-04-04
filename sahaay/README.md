# :globe_with_meridians: Sahaay – Disaster Support & Missing Person Coordination  


> **Sahaay** is an **offline-first disaster relief and missing person coordination platform**.  
> Built to function in **areas with little or no internet connectivity**, Sahaay leverages **multicast DNS (mDNS)** to enable **local device discovery and communication**.  

---

## :rocket: Features  

- :satellite: **Offline-first communication** via mDNS (works without internet).  
- :sos: **Request aid** – food, medical help, or supplies.  
- :busts_in_silhouette: **Report & search for missing persons** during disasters.  
- :signal_strength: **Local network-based device discovery** for real-time rescue coordination.  
- :art: **Responsive UI** for easy use in high-stress situations.  

---

## :hammer_and_wrench: Tech Stack  

- **Backend:** Go :zap:  
- **Frontend:** Next.js + TypeScript :desktop_computer:  
- **Database:** PostgreSQL :elephant:  
- **UI:** Tailwind CSS :art:  

---

## :earth_africa: Why Sahaay?  

During natural disasters, **internet connectivity often breaks down**.  
Sahaay ensures:  
:heavy_check_mark: People in **relief centers** or **rescue camps** can still connect.  
:heavy_check_mark: Missing persons can be reported and searched locally.  
:heavy_check_mark: Aid requests reach nearby volunteers **without internet**.  

---

## :package: Installation & Setup  

```bash
# Clone the repository
git clone https://github.com/your-username/sahaay.git
cd sahaay

# Backend (Go)
cd backend
go run main.go

# Frontend (Next.js + TS)
cd frontend
npm install
npm run dev
