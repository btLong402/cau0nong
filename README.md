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

### Phase 0 - Foundation-First (bat buoc truoc feature)

- Tao Base Contracts:
  - ApiResponse, error shape, pagination, auth context.
- Tao Base API Layer tai `src/shared/api/`:
  - `base-handler.ts` (wrapper try/catch + error mapping)
  - `base-response.ts` (success/error/paginated response)
  - `base-errors.ts` (domain errors + codes)
  - `base-validators.ts` (request validation helpers)
  - `index.ts` (barrel export)
- Tao Base Data Access Layer:
  - Supabase client chung + repository primitives.
- Tao Base Validation Layer:
  - Reusable schema/validator helpers cho toan du an.

### Phase 0 Delivery Gate (chi duoc qua phase tiep theo khi dat)

- Co it nhat 1 route su dung Base API layer.
- Khong lap boilerplate parse/auth/response/error mapping o 2+ route.
- Error va response format thong nhat toan bo route.
- Duong tai su dung (`src/shared/api`) duoc document ro rang.

### Phase 1 - Core Features (auth + sessions)

- Dang nhap/phan quyen (dua tren base auth guard/handler).
- CRUD thanh vien, thang, buoi danh.
- Diem danh + nhap chi phi san.

### Phase 1 Delivery Gate

- Tat ca route auth/sessions di qua base-handler.
- Validation dung base-validators (khong viet lai validator ad-hoc).
- Khong co file API route vuot 100 dong.

### Phase 2 - Settlement Engine

- Nhap tien cau thang.
- Tinh toan tu dong tien san/tien cau/tong can dong.
- Quan ly no cu/so du.
- Chuẩn hoa service tinh toan de tai su dung giua API va dashboard.

### Phase 2 Delivery Gate

- Formula engine co unit tests cho happy path + edge cases.
- Ket qua settlement truy vet duoc theo tung buoi/tung khoan.

### Phase 3 - Payment

- Tao va hien thi VietQR dong cho tung thanh vien.
- Xac nhan thanh toan, chot ky.
- Ho tro doi tru no cu/so du trong quy trinh thanh toan.

### Phase 3 Delivery Gate

- Payment state nhat quan (`is_paid`, `paid_amount`, `paid_at`).
- QR amount khop 100% voi total_due sau doi tru.

### Phase 4 - Event & Analytics

- Quan ly su kien + chia tien su kien.
- Dashboard thong ke va thu vien video.

### Phase 4 Delivery Gate

- Event settlement tach biet voi monthly settlement.
- Dashboard co loading/empty/error states day du.

## 9. Huong dan chay du an

```bash
npm install
npm run dev
```

Mo trinh duyet tai `http://localhost:3000`.

## 10. Kien truc He Thong (Full-Stack SSR)

### 10.1 Mo hinh kien truc

Dự án dùng kiến trúc **full-stack monorepo** với Next.js 13+ App Router:

```
src/
├── app/                          # Next.js App Router (page/layout + API entry)
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
│       ├── auth/
│       ├── sessions/
│       ├── settlements/
│       ├── payments/
│       └── events/
├── modules/                      # Feature modules (domain ownership)
│   ├── auth/
│   ├── sessions/
│   ├── settlements/
│   ├── payments/
│   ├── users/
│   ├── events/
│   └── admin/
├── shared/                       # Reuse layer (foundation-first)
│   ├── api/                      # base-handler, base-response, base-errors, base-validators
│   ├── lib/
│   ├── types/
│   ├── components/
│   └── hooks/
├── styles/
└── middleware.ts
```

### 10.2 Luong xu ly SSR

1. **Client yeu cau** → Next.js server nhận request.
2. **App Router entry** (`src/app/*`) chuyển đến feature module tương ứng.
3. **API entry route** (`src/app/api/*`) gọi service trong `src/modules/*` và dùng base API utilities tại `src/shared/api/*`.
4. **Data fetch** từ Supabase qua shared data access layer/repository.
5. **HTML render** + **JSON hydration** gửi về trình duyệt.
6. Nếu cần interactive, Client Components xử lý sự kiện sau hydrate.

### 10.3 Loi ich cua SSR

- SEO tot hon (noi dung co san trong HTML, khong phai JS render).
- Tat ca tinh toan tien/cong no dieu hanh tren server (an toan hon).
- Giam load cho client (trai trinh duyet);
- Nhanh hon (khong doi JS bundle chay truoc).

## 11. Toi Uu Hoa Du Lieu tren Supabase

### 11.1 Chon kieu du lieu hop ly (Data Types)

| Truong | Muc Dich | Kieu | Ly Do |
|--------|---------|------|-------|
| is_attended | Danh dau co/khong tham gia buoi | boolean | 1 byte/row, nhe nhat |
| amount | Luu so tien (240000, 62500.50) | numeric(10,2) | Khong bao gio text; tranh loi lam tron |
| session_date | Ngay di danh (2025-04-01) | date | Khong can timestamp gio phut giay |
| created_at | Thoi diem tao record | timestamptz | Dung cho audit log |
| user_id | Tham chieu User | integer | Reference key, nhe hon UUID |
| description | Mo ta ghi chu | text | Cho phep chinh sua, search |

### 11.2 Chuan hoa Co So Du Lieu (Normalization)

**Tinh Tien Luong Yeu Cau:**
- **Table `users`**: id, name, phone, email, role, balance
  - Khong lap tên trong bảng tham chiếu; chỉ user_id.

- **Table `months`**: id, month_year, status (open/closed), total_shuttlecock_expense
  - Tách rời; khong lap ton tai trong attendance hay session_attendance.

- **Table `sessions`**: id, month_id, session_date, court_expense_amount, payer_user_id
  - Luu chi tiet buoi danh 1 lan; tham chieu nhieu neu can.

- **Table `session_attendance`**: id, session_id, user_id, is_attended
  - Khong lap tên, khong lap so tien; chi user_id + is_attended.

- **Table `shuttlecock_details`**: id, month_id, purchase_date, quantity, unit_price, buyer_user_id
  - Lich su mua cau chi tiet; sum quantity * unit_price = tong tien cau/thang.

- **Table `monthly_settlements`**: id, month_id, user_id, court_fee, shuttlecock_fee, past_debt, balance_carried, total_due, is_paid, paid_amount
  - Ket qua tinh toan co san cho member, admin dieu chinh + xac nhan.

- **Table `vietqr_payments`**: id, settlement_id, user_id, qr_content, paid_at
  - Luu VietQR hoac link thanh toan; khong luu anh.

- **Table `events`**: id, event_name, event_date, total_support, total_expense
  - Su kien doc lap voi tinh tien hang thang.

- **Table `event_participants`**: id, event_id, user_id, contribution_per_person
  - Chia tien su kien chi cho nguoi tham gia.

### 11.3 Khong Luu File/Anh Truc Tiep Vao Database

- **VietQR:** Tao QR tang tay tren Frontend hoac Backend (thư viện `qrcode`) → trả về data URL hoặc SVG → khong luu file.
- **Avatar (neu co):** Dung Supabase Storage (bucket rieng) thay vì lưu blob vào bảng. Lưu URL reference thôi.

### 11.4 Dọn Dẹp & Lưu Trữ (Archiving)

500MB dung lượng Supabase là khá lớn cho dữ liệu text. Để duy trì hiệu năng, hàng năm:
1. Admin **Export** dữ liệu cũ (năm 2024, 2025) thành CSV/Excel.
2. Xóa dữ liệu cũ khỏi Supabase (keep 1-2 năm gần nhất để tra cứu nhanh).
3. Lưu file export an toàn ở ngoài (Google Drive, S3, máy tính).

Ví dụ: Lập trình chức năng `/app/api/admin/export-data.ts` để tự động xuất.

## 12. Mô Hình Dữ Liệu Supabase (Chi Tiết Cột)

### 12.1 users
```
id (int, PK)
name (varchar)
phone (varchar, unique)
email (varchar, unique)
role (enum: 'admin', 'member')
balance (numeric(10,2), default: 0)
is_active (boolean, default: true)
created_at (timestamptz)
updated_at (timestamptz)
```

### 12.2 months
```
id (int, PK)
month_year (date, e.g. 2025-11-01)
status (enum: 'open', 'closed')
total_shuttlecock_expense (numeric(10,2))
created_at (timestamptz)
```

### 12.3 sessions
```
id (int, PK)
month_id (int, FK → months.id)
session_date (date)
court_expense_amount (numeric(10,2))
payer_user_id (int, FK → users.id)
notes (text, nullable)
created_at (timestamptz)
```

### 12.4 session_attendance
```
id (int, PK)
session_id (int, FK → sessions.id)
user_id (int, FK → users.id)
is_attended (boolean)
created_at (timestamptz)
```

### 12.5 shuttlecock_details
```
id (int, PK)
month_id (int, FK → months.id)
purchase_date (date)
quantity (int)
unit_price (numeric(10,2))
buyer_user_id (int, FK → users.id)
notes (text, nullable)
created_at (timestamptz)
```

### 12.6 monthly_settlements
```
id (int, PK)
month_id (int, FK → months.id)
user_id (int, FK → users.id)
court_fee (numeric(10,2))
shuttlecock_fee (numeric(10,2))
past_debt (numeric(10,2))
balance_carried (numeric(10,2))
total_due (numeric(10,2))
is_paid (boolean, default: false)
paid_amount (numeric(10,2), nullable)
paid_at (timestamptz, nullable)
created_at (timestamptz)
```

### 12.7 vietqr_payments
```
id (int, PK)
settlement_id (int, FK → monthly_settlements.id)
user_id (int, FK → users.id)
qr_content (text, e.g. "vietqr://0011000032...")
qr_image_url (text, nullable, nếu lưu link)
paid_at (timestamptz, nullable)
created_at (timestamptz)
```

### 12.8 events
```
id (int, PK)
event_name (varchar)
event_date (date)
total_support (numeric(10,2), default: 0)
total_expense (numeric(10,2), default: 0)
created_at (timestamptz)
```

### 12.9 event_participants
```
id (int, PK)
event_id (int, FK → events.id)
user_id (int, FK → users.id)
contribution_per_person (numeric(10,2))
is_paid (boolean, default: false)
created_at (timestamptz)
```

## 13. Cong Nghe Stack

- **Framework:** Next.js 13+ (App Router, SSR)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth hoặc next-auth (tùy lựa chọn)
- **ORM/Query:** Supabase JS client hoặc Prisma
- **Styling:** Tailwind CSS (hoặc CSS Modules)
- **Linting:** ESLint + Prettier
- **Deployment:** Vercel, Railway, hoặc VPS tùy chọn

## 14. Authentication & Session Management

### 14.1 Session Cookie (Supabase Auth)

Dự án dùng **Supabase Auth** với session cookie (httpOnly, secure):

1. **Login:** User gửi phone/email + password → Supabase Auth xác minh → trả session cookie
2. **Session Check:** Middleware kiểm tra cookie → nếu hợp lệ, cho phép truy cập protected routes
3. **Logout:** Xóa session cookie
4. Tất cả request tập hợp được Auth context từ cookie → có thể query user data

```bash
npm install @supabase/ssr @supabase/supabase-js
```

### 14.2 Avatar Upload to Supabase Storage

- **Bucket:** `avatars` (tạo trong Supabase Storage)
- **Table users:** thêm cột `avatar_url (varchar, nullable)`
- **Endpoint:** `/app/api/users/[id]/avatar/route.ts` → upload file → lưu URL
- **Frontend:** `<img src={user.avatar_url} alt={user.name} />`

Không lưu file trực tiếp vào database, chỉ lưu URL reference.

### 14.3 Change Password

- **Endpoint:** `/app/api/auth/change-password/route.ts` (PUT)
- **Request body:** `{ current_password, new_password }`
- **Logic:** Xác minh password cũ bằng `signInWithPassword()` → nếu đúng, gọi `updateUser()` → update password mới
- **Response:** success hoặc error message

---

## 15. Installation & Setup Supabase

### 15.1 Tạo Project Supabase

1. Truy cập [supabase.com](https://supabase.com) → Sign up
2. Tạo new project (chọn free tier)
3. Lấy `SUPABASE_URL` và `SUPABASE_ANON_KEY` từ Settings → API

### 15.2 Cấu Hình Environment Variables

Tạo file `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

(Để ý: `NEXT_PUBLIC_*` thì expose cho browser; `SUPABASE_SERVICE_ROLE_KEY` chỉ server side)

### 15.3 Khởi Tạo Database Schema

Chạy SQL script sau trong Supabase SQL Editor (`https://supabase.com/dashboard/project/[project-id]/sql`):

```sql
-- Auth table (users từ Supabase Auth tự động)
create table public.users (
  id uuid primary key references auth.users(id),
  name varchar not null,
  phone varchar unique not null,
  email varchar unique not null,
  role varchar check (role in ('admin', 'member')) default 'member',
  avatar_url varchar,
  balance numeric(10,2) default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- RLS Policy: Users xem được profile của admin + chính học
create policy "Users see own and admin profiles" on public.users
  for select
  using (
    auth.uid() = id 
    or (select role from public.users where id = auth.uid()) = 'admin'
  );

-- Admin có thể cập nhật bất kỳ user
create policy "Admins can update any user" on public.users
  for update
  using ((select role from public.users where id = auth.uid()) = 'admin');

-- Members chỉ cập nhật profile của mình
create policy "Members update own profile" on public.users
  for update
  using (auth.uid() = id);

-- Create remaining tables
create table public.months (
  id serial primary key,
  month_year date not null unique,
  status varchar check (status in ('open', 'closed')) default 'open',
  total_shuttlecock_expense numeric(10,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.sessions (
  id serial primary key,
  month_id integer references public.months(id) on delete cascade,
  session_date date not null,
  court_expense_amount numeric(10,2) not null,
  payer_user_id uuid references public.users(id),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.session_attendance (
  id serial primary key,
  session_id integer references public.sessions(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  is_attended boolean default false,
  created_at timestamptz default now(),
  unique(session_id, user_id)
);

create table public.shuttlecock_details (
  id serial primary key,
  month_id integer references public.months(id) on delete cascade,
  purchase_date date not null,
  quantity integer not null,
  unit_price numeric(10,2) not null,
  buyer_user_id uuid references public.users(id),
  notes text,
  created_at timestamptz default now()
);

create table public.monthly_settlements (
  id serial primary key,
  month_id integer references public.months(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  court_fee numeric(10,2) default 0,
  shuttlecock_fee numeric(10,2) default 0,
  past_debt numeric(10,2) default 0,
  balance_carried numeric(10,2) default 0,
  total_due numeric(10,2) default 0,
  is_paid boolean default false,
  paid_amount numeric(10,2),
  paid_at timestamptz,
  created_at timestamptz default now(),
  unique(month_id, user_id)
);

create table public.vietqr_payments (
  id serial primary key,
  settlement_id integer references public.monthly_settlements(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  qr_content text,
  qr_image_url varchar,
  paid_at timestamptz,
  created_at timestamptz default now()
);

create table public.events (
  id serial primary key,
  event_name varchar not null,
  event_date date not null,
  total_support numeric(10,2) default 0,
  total_expense numeric(10,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.event_participants (
  id serial primary key,
  event_id integer references public.events(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  contribution_per_person numeric(10,2) default 0,
  is_paid boolean default false,
  created_at timestamptz default now(),
  unique(event_id, user_id)
);

-- Enable RLS on other tables
alter table public.months enable row level security;
alter table public.sessions enable row level security;
alter table public.session_attendance enable row level security;
alter table public.shuttlecock_details enable row level security;
alter table public.monthly_settlements enable row level security;
alter table public.vietqr_payments enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;

-- RLS Policies
-- Members see own settlements only
create policy "Users see own settlements" on public.monthly_settlements
  for select
  using (auth.uid() = user_id or (select role from public.users where id = auth.uid()) = 'admin');

-- Similar for payments
create policy "Users see own payments" on public.vietqr_payments
  for select
  using (auth.uid() = user_id or (select role from public.users where id = auth.uid()) = 'admin');
```

### 15.4 Cấu Hình Supabase Storage (Avatar Bucket)

Trong Supabase Dashboard:
1. Đi tới **Storage** → **Create new bucket**
2. Tên: `avatars`
3. Privacy: **Public** (nên public để client có thể GET ảnh)
4. **Create bucket**

### 15.5 Enable Auth Providers

Supabase Dashboard → **Authentication** → **Providers**:
- Email (default, enable)
- Tùy chọn: Google, GitHub, etc.

---

## 16. Running the Project

### 16.1 Install Dependencies

```bash
npm install

# Key packages:
# - @supabase/ssr, @supabase/supabase-js (database + auth)
# - next@latest (full-stack framework)
# - typescript (type safety)
```

### 16.2 Setup Environment

```bash
# Copy example env
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 16.3 Initialize Supabase Database

1. Run SQL schema script từ README section 15.3 trong Supabase SQL Editor
2. Setup Storage bucket `avatars` (section 15.4)
3. Enable Auth providers (section 15.5)

### 16.4 Run Development Server

```bash
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000).

### 16.5 Current Bootstrap Structure (hien tai)

```
src/
├── lib/
│   ├── supabase.ts
│   ├── types.ts
│   └── calculations.ts
├── middleware.ts
└── app/
  └── api/
    ├── auth/
    │   ├── login/route.ts
    │   ├── logout/route.ts
    │   └── change-password/route.ts
    └── users/
      └── [id]/avatar/route.ts
```

### 16.6 Target Structure (sau migration module-based)

```
src/
├── app/                          # page/layout + API entry point
├── modules/                      # auth, sessions, settlements, payments, users, events
├── shared/
│   ├── api/                      # base-handler, base-response, base-errors, base-validators
│   ├── lib/
│   ├── types/
│   └── components/
├── styles/
└── middleware.ts
```

Giai doan hien tai dang o bootstrap. Se migrate dan logic tu `src/lib/*` sang `src/modules/*` + `src/shared/*` theo Phase 0 va Phase 1.

---

## 17. Ghi Chu

- README nay dong vai tro Product + Functional Spec + Technical Architecture + Setup Guide.
- Cac trang thai bien (is_paid, status) nen la enumeration hoac boolean de query nhanh.
- Toan bo tinh toan tien tuong khia chay tren server (API route hoac server action).
- Dung RLS (Row Level Security) Supabase de bao ve du lieu cho phep member chi xem du lieu ca nhan.
- Avatar luu tren Supabase Storage, khong luu database.
- Session cookie tu dong quan ly boi Supabase Auth (@supabase/ssr middleware).
- Change Password: yeu cau xac nhan password cu (security measure).
- Formula engine hien dang o `src/lib/calculations.ts` va se duoc chuyen sang module `src/modules/settlements/lib/` trong luong migration.
