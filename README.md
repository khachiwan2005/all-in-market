# All IN Market

ต้นแบบหน้าเว็บระบบจองล็อกตลาด All IN Market (23 หน้า: หน้าบ้าน + แอดมิน)

## วิธีเปิดดู
ต้องเปิดผ่านเซิร์ฟเวอร์ (ห้ามดับเบิลคลิกแบบ file://) และต้องต่ออินเทอร์เน็ต (โหลด React จาก CDN)

- Windows: ดับเบิลคลิก `start.bat` (เปิด http://localhost:8080)
- หรือใช้ PHP:    `php -S localhost:8080`
- หรือใช้ Python: `python -m http.server 8080`
- หรือวางทั้งโฟลเดอร์ไว้ใน htdocs ของ XAMPP

## โครงสร้าง
- `*.dc.html`  แต่ละหน้า (ชื่อต้องลงท้าย .dc.html เพราะลิงก์ภายในอ้างชื่อนี้)
- `assets/css/fonts.css`    ฟอนต์ที่ใช้ร่วมกัน
- `assets/css/pages/`       CSS ของแต่ละหน้า
- `assets/js/dc-runtime.js` runtime
- `assets/js/pages/`        โค้ด JS ของแต่ละหน้า
- `assets/fonts`, `assets/images`