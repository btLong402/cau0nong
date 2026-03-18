Dưới đây là bản tổng hợp toàn diện về Phân tích yêu cầu chức năng và Chú giải các công thức tính toán để bạn làm tài liệu gốc (Master Document) cho việc lập trình website quản lý câu lạc bộ cầu lông.

### PHẦN 1: PHÂN TÍCH YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

Website được chia thành các phân hệ chức năng chính nhằm tự động hóa tối đa việc quản lý tài chính và hoạt động của câu lạc bộ.  
**1\. Quản lý Tài khoản & Phân quyền (Authentication & Authorization)**

* **Đăng nhập/Đăng xuất:** Người dùng phải đăng nhập bằng số điện thoại/username và mật khẩu để bảo mật thông tin tài chính.  
* **Phân quyền Admin (Thủ quỹ/Quản lý):** Có toàn quyền tạo tháng mới, thêm/sửa buổi đánh, nhập chi phí (tiền sân, tiền cầu), điểm danh, quản lý quỹ và xác nhận thanh toán.  
* **Phân quyền Member (Thành viên):** Chỉ xem được Dashboard cá nhân (số buổi đi, số tiền cần đóng, nợ cũ, mã QR thanh toán) và lịch sử tham gia của mình.

**2\. Quản lý Lịch chơi & Điểm danh (Session & Attendance)**

* **Tạo buổi đánh:** Admin tạo các buổi đánh theo ngày (VD: 2/12/2025, 9/12/2025) 1\.  
* **Ghi nhận chi phí sân:** Nhập số tiền thuê sân của từng buổi (thường dao động từ 240.000đ, 360.000đ đến 480.000đ) và người ứng tiền sân (VD: Trung) 1, 2\.  
* **Điểm danh (Check-in):** Admin tick chọn những người có tham gia trong buổi đó. Hệ thống tự động đếm tổng số người chơi/buổi để làm cơ sở chia tiền 1\.

**3\. Quản lý Chi phí & Quỹ chung (Expense & Fund)**

* **Quản lý tiền cầu hàng tháng:** Admin nhập tổng số tiền mua cầu của cả tháng (VD: Tháng 10/2025 là 600.000đ) và người đứng ra ứng tiền 3\.  
* **Lịch sử mua cầu:** Tính năng riêng cho phép Admin lưu lịch sử nhập cầu (VD: Ngày 30/12/2025 Lê mua hộ 10 ống cầu, giá 300k/ống \= 3.000.000đ) 4\.  
* **Quản lý đối trừ cho người ứng tiền:** Hệ thống cần tự động tính toán số tiền Câu lạc bộ nợ ngược lại những thành viên hay ứng tiền (Trung, Lê, Dũng) để cấn trừ vào tiền đóng hàng tháng của họ.

**4\. Quản lý Công nợ & Thanh toán (Debt & Payment)**

* **Xác nhận thanh toán:** Admin có công cụ để đánh dấu (tick "TRUE" hoặc "x") những thành viên đã đóng tiền trong tháng 1, 5\.  
* **Quản lý Nợ tồn đọng:** Tự động chuyển số tiền chưa thanh toán của tháng trước sang tháng sau. Ví dụ: Phạm Tuấn nợ 165.497,84đ từ tháng 10, sang tháng 11 số tiền này tự động hiển thị ở cột "tồn đọng" 3, 5\.  
* **Quản lý Tiền thừa (Số dư):** Nếu thành viên chuyển khoản dư tiền, hệ thống lưu lại dưới dạng số dư (balance) và tự động trừ đi vào kỳ thanh toán tiếp theo.  
* **Thanh toán Dynamic VietQR:** Tự động sinh mã QR động cho từng thành viên, chứa sẵn thông tin tài khoản Thủ quỹ, số tiền chính xác (đã tính nợ/thừa) và nội dung chuyển khoản chuẩn hóa (VD: "Pham Tuan dong tien thang 11").

**5\. Quản lý Sự kiện & Liên hoan (Event Management)**

* Tạo các sự kiện đặc biệt (VD: Giải CL-20251) độc lập với tháng tính tiền 3\.  
* Ghi nhận các khoản thu (Công đoàn hỗ trợ) và các khoản chi (Tiền sân, tiền cầu, tiền liên hoan) 3\.  
* Điểm danh người tham gia tiệc và tự động chia đều khoản tiền thiếu hụt cho những người này 3\.

**6\. Các tính năng bổ trợ (Add-ons)**

* **Dashboard & Analytics:** Bảng xếp hạng thành viên đi đều nhất, biểu đồ chi phí các tháng.  
* **Góc Kỹ năng (Video Library):** Nơi lưu trữ và nhúng các video YouTube hướng dẫn đánh cầu (kỹ thuật backhand, di chuyển đôi) để thành viên tự học 4\.

### PHẦN 2: CHÚ GIẢI CHI TIẾT CÁC CÔNG THỨC TÍNH TOÁN

Toàn bộ logic tính tiền trên web sẽ được lập trình dựa trên các công thức cốt lõi sau:  
**1\. Công thức tính "Tiền sân cá nhân" (Tính theo từng ngày)**

* **Mục đích:** Đảm bảo tính công bằng, ai đi ngày nào chỉ trả tiền ngày đó.  
* **Công thức:** Tiền sân cá nhân (Ngày A) \= Tổng tiền thuê sân (Ngày A) / Tổng số người chơi điểm danh có mặt (Ngày A)  
* *Ví dụ:* Ngày 25/11/2025 tiền sân là 240.000đ, có 8 người đánh. Người có đi sẽ đóng: 240.000 / 8 \= 30.000đ 5\. Người không đi \= 0đ.

**2\. Công thức tính "Tiền cầu cá nhân" (Tính theo tháng)**

* **Mục đích:** Chia đều tiền mua cầu lông trong cả tháng cho những người có sinh hoạt.  
* **Công thức:** Tiền cầu cá nhân (Tháng) \= Tổng tiền mua cầu (Tháng) / Tổng số người có tham gia chơi ít nhất 1 buổi trong tháng (Play? \= 1\)  
* *Ví dụ:* Tháng 11/2025 tổng tiền cầu là 625.000đ. Tổng nhóm có 17 người, nhưng chỉ có 10 người đi đánh ít nhất 1 buổi. Tiền cầu mỗi người là: 625.000 / 10 \= 62.500đ 5\.

**3\. Công thức tính "Nợ tồn đọng" & "Tiền thừa"**

* **Nợ cũ:** Tổng các khoản "Tổng tiền cần đóng" của các tháng trước mà trạng thái is\_paid \= FALSE (Chưa thanh toán).  
* **Tiền thừa (nếu có):** Số tiền thực tế thành viên đã chuyển \- Số tiền hệ thống báo cần đóng. (Lưu vào số dư dư tài khoản cá nhân).

**4\. Công thức tính "Tổng tiền cần thanh toán" (Hàng tháng)**

* **Mục đích:** Con số cuối cùng để tạo Mã QR cho thành viên chuyển khoản.  
* **Công thức tổng quát:**Tổng cần đóng \= Tổng (Tiền sân cá nhân các ngày có đi trong tháng) \+ Tiền cầu cá nhân (Tháng) \+ Nợ tồn đọng (Tháng trước) \- Tiền thừa (Tháng trước)  
* *Ví dụ trường hợp Phạm Tuấn (Tháng 11/2025):* Tiền sân (26.666,67đ) \+ Tiền cầu (62.500đ) \= Tiền tháng 11 là 89.166,67đ. Nợ tồn đọng tháng 10 là 165.497,84đ. Tổng cần thanh toán hiển thị trên QR là: 254.664,51đ 3, 5\.

**5\. Công thức chia tiền "Sự kiện / Giải đấu"**

* **Mục đích:** Chỉ những ai tham gia ăn uống mới phải bù tiền sau khi trừ quỹ tài trợ.  
* **Công thức:** Tiền đóng thêm \= (Tổng Chi phí Sự kiện \- Tổng Tài trợ Hỗ trợ) / Số người tham gia  
* *Ví dụ Giải CL-20251:* (3.551.000đ tổng chi \- 3.000.000đ hỗ trợ) / 9 người tham gia \= 61.222,22đ/người 3\. Khoản này có thể được cộng dồn vào tổng nợ tháng của 9 người đó hoặc tạo QR thanh toán riêng.

