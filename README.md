# CLB Cau Long - Quan Ly Thu Chi, Cong No, Diem Danh

Ung dung web quan ly van hanh va tai chinh cho cau lac bo cau long. Du an tap trung vao tu dong hoa tinh tien theo buoi/thang, quan ly cong no, doi tru nguoi ung tien, va ho tro thanh toan qua VietQR.

Tai lieu goc: `Tai lieu Nghiep vu va Giai thuat Quan ly CLB Cau long.md`

## 1. Muc tieu san pham

- Minh bach thu chi theo buoi, theo thang, theo su kien.
- Cong bang trong cach chia tien san va tien cau.
- Giam thao tac thu cong cua thu quy/admin khi tong hop cong no.
- Giup thanh vien de theo doi lich su tham gia va so tien can dong.

## 2. Doi tuong su dung va phan quyen

### 2.1 Admin (thu quy/quan ly)

- Tao thang moi, tao buoi danh.
- Nhap chi phi san tung buoi va nguoi ung tien.
- Diem danh nguoi tham gia tung buoi.
- Nhap tong tien cau trong thang va lich su mua cau.
- Xac nhan thanh toan, theo doi cong no ton dong.
- Quan ly cac su kien dac biet (giai dau/lien hoan).

### 2.2 Member (thanh vien)

- Xem dashboard ca nhan: so buoi da choi, tien can dong, no cu, so du.
- Xem lich su tham gia.
- Nhan ma QR thanh toan voi so tien dong.

## 3. Pham vi chuc nang

### 3.1 Authentication & Authorization

- Dang nhap/Dang xuat bang username/so dien thoai + mat khau.
- Tach quyen truy cap theo vai tro `admin` va `member`.

### 3.2 Session & Attendance

- Tao buoi danh theo ngay.
- Luu chi phi san theo buoi va nguoi ung tien.
- Diem danh thanh vien tham gia.
- Tu dong dem tong so nguoi tham gia tung buoi de chia tien san.

### 3.3 Expense & Fund

- Nhap tong tien cau theo thang.
- Luu lich su mua cau (ngay, so luong, don gia, nguoi mua).
- Theo doi khoan CLB can hoan tra cho nguoi ung tien de doi tru vao ky sau.

### 3.4 Debt & Payment

- Xac nhan da thanh toan theo thang.
- Chuyen no ton dong sang thang tiep theo neu chua dong.
- Quan ly so du neu thanh vien chuyen du.
- Sinh VietQR dong cho tung thanh vien (tai khoan nhan, so tien, noi dung CK chuan hoa).

### 3.5 Event Management

- Tao su kien doc lap voi ky tinh tien thang.
- Nhap cac khoan thu/ho tro va cac khoan chi.
- Diem danh nguoi tham gia su kien.
- Tu dong chia tien bo sung cho nhom tham gia neu tong chi vuot tong ho tro.

### 3.6 Add-ons

- Dashboard thong ke: xep hang di deu, bieu do chi phi theo thang.
- Thu vien video ky nang (nhung YouTube).

## 4. Cong thuc tinh toan cot loi

Toan bo logic tinh tien can bam sat cac cong thuc duoi day.

### 4.1 Tien san ca nhan theo tung ngay

```text
tien_san_ca_nhan(ngay_A) = tong_tien_san(ngay_A) / so_nguoi_diem_danh(ngay_A)
```

Nguoi khong tham gia buoi do thi tien san ngay do = 0.

### 4.2 Tien cau ca nhan theo thang

```text
tien_cau_ca_nhan(thang) = tong_tien_cau(thang) / so_nguoi_co_tham_gia_it_nhat_1_buoi(thang)
```

Chi tinh cho nhung thanh vien co phat sinh tham gia trong thang.

### 4.3 No ton dong va so du

- `no_cu`: tong cac khoan chua thanh toan cua cac thang truoc (`is_paid = false`).
- `so_du`: so tien dong thua duoc chuyen sang ky tiep theo de tru vao tong can dong.

### 4.4 Tong tien can thanh toan thang

```text
tong_can_dong = tong_tien_san_ca_nhan_trong_thang
			 + tien_cau_ca_nhan
			 + no_ton_dong
			 - so_du
```

Gia tri nay la co so sinh VietQR cho thanh vien.

### 4.5 Cong thuc chia tien su kien

```text
tien_dong_them_moi_nguoi = (tong_chi_phi_su_kien - tong_tai_tro_ho_tro) / so_nguoi_tham_gia
```

Khoan nay co the cong vao cong no thang hoac tao ma thanh toan rieng.

## 5. Luong nghiep vu tinh tien hang thang (de xay dung backend job)

1. Chot du lieu diem danh va chi phi san cua tat ca buoi trong thang.
2. Tinh tien san tung nguoi theo tung buoi, sau do cong don theo thang.
3. Tinh tien cau theo thang dua tren nhom co tham gia.
4. Lay no cu va so du tu ky truoc.
5. Tinh `tong_can_dong` cho tung thanh vien.
6. Sinh thong tin thanh toan + VietQR.
7. Admin xac nhan thanh toan; cap nhat trang thai `is_paid`.
8. Chuyen cong no chua thanh toan sang thang tiep theo.

## 6. De xuat mo hinh du lieu toi thieu (MVP)

- `users`: thong tin thanh vien, vai tro, trang thai hoat dong.
- `months`: ky tinh tien (thang/nam, trang thai mo/chot).
- `sessions`: buoi danh theo ngay, chi phi san, nguoi ung tien.
- `session_attendance`: bang diem danh theo `session_id` + `user_id`.
- `shuttlecock_expenses`: tong tien cau theo thang + lich su mua cau chi tiet.
- `monthly_settlements`: ket qua tinh tien tung thanh vien theo thang.
- `payments`: giao dich dong tien, so tien thuc nhan, trang thai, noi dung CK.
- `balances`: theo doi so du/no tong hop theo user.
- `events`, `event_participants`, `event_transactions`: quan ly su kien.

## 7. Tieu chi dung/nghiem thu nghiep vu

- Tinh tien san dung voi tung buoi va so nguoi diem danh.
- Tinh tien cau chi ap dung cho nguoi co tham gia.
- No cu duoc chuyen ky chinh xac, khong mat du lieu.
- So du duoc tru dung vao tong can dong.
- VietQR sinh dung so tien, dung noi dung chuyen khoan.
- Admin co the doi soat ro rang ai da dong/chua dong.

## 8. Ke hoach trien khai MVP

### Phase 1 - Foundation

- Dang nhap/phan quyen.
- CRUD thanh vien, thang, buoi danh.
- Diem danh + nhap chi phi san.

### Phase 2 - Settlement Engine

- Nhap tien cau thang.
- Tinh toan tu dong tien san/tien cau/tong can dong.
- Quan ly no cu/so du.

### Phase 3 - Payment

- Tao va hien thi VietQR dong cho tung thanh vien.
- Xac nhan thanh toan, chot ky.

### Phase 4 - Event & Analytics

- Quan ly su kien + chia tien su kien.
- Dashboard thong ke va thu vien video.

## 9. Huong dan chay du an

```bash
npm install
npm run dev
```

Mo trinh duyet tai `http://localhost:3000`.

## 10. Cong nghe

- Next.js (App Router)
- TypeScript
- ESLint

## 11. Ghi chu

- README nay dong vai tro Product + Functional Spec muc cao.
- Chi tiet nghiep vu va vi du so lieu nam trong tai lieu goc cua du an.
