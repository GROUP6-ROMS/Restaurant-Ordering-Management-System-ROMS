# Sß╗ö TAY H╞»ß╗ÜNG Dß║¬N Vß║¼N H├ÇNH SERVER VPS & TRUY Vß║ñN C╞á Sß╗₧ Dß╗« LIß╗åU
## Hß╗ç Thß╗æng Quß║ún L├╜ & Gß╗ìi M├│n Nh├á H├áng ROMS (Restaurant Ordering Management System)

> **Mß╗Ñc ─æ├¡ch t├ái liß╗çu:** Cung cß║Ñp h╞░ß╗¢ng dß║½n to├án diß╗çn, tß╗½ng b╞░ß╗¢c v├á dß╗à tra cß╗⌐u d├ánh cho nh├│m ph├ít triß╗ân v├á vß║¡n h├ánh hß╗ç thß╗æng ROMS: tß╗½ viß╗çc SSH v├áo Server VPS, k├⌐o m├ú nguß╗ôn (Git Pull), quß║ún l├╜ v├▓ng ─æß╗¥i Docker Container, cho ─æß║┐n kß║┐t nß╗æi v├á truy vß║Ñn trß╗▒c tiß║┐p C╞í sß╗ƒ dß╗» liß╗çu Microsoft SQL Server 2022.

---

## ≡ƒôî PHß║ªN 1: Bß║óNG TRA Cß╗¿U TH├öNG Sß╗É Hß╗å THß╗ÉNG (CHEATSHEET)

| Th├┤ng Sß╗æ | Gi├í Trß╗ï Cß║Ñu H├¼nh | Ghi Ch├║ |
| :--- | :--- | :--- |
| **─Éß╗ïa chß╗ë IP VPS** | `222.255.184.250` | M├íy chß╗º ─æ├ím m├óy Linux Ubuntu |
| **T├¬n miß╗ün c├┤ng khai** | `http://roms-restaurant.duckdns.org` | T├¬n miß╗ün trß╗Å vß╗ü IP VPS |
| **T├ái khoß║ún SSH** | `root` | Quyß╗ün quß║ún trß╗ï cao nhß║Ñt |
| **Mß║¡t khß║⌐u SSH** | `Romsswp391!@` | D├╣ng khi ─æ─âng nhß║¡p SSH Terminal |
| **Th╞░ mß╗Ñc dß╗▒ ├ín tr├¬n VPS** | `~/Restaurant-Ordering-Management-System-ROMS-` | ─É╞░ß╗¥ng dß║½n chß╗⌐a m├ú nguß╗ôn v├á docker-compose |
| **C╞í sß╗ƒ dß╗» liß╗çu (DBMS)** | Microsoft SQL Server 2022 Developer | Chß║íy trong Docker Container `roms-database` |
| **Cß╗òng CSDL (DB Port)** | `1433` | ─É├ú mß╗ƒ c├┤ng khai ra Internet |
| **T├¬n CSDL (Database)** | `ROMS_DB` | Chß╗⌐a to├án bß╗Ö bß║úng, kh├│a ngoß║íi, dß╗» liß╗çu seed |
| **T├ái khoß║ún SA Database** | `sa` | Quß║ún trß╗ï vi├¬n CSDL SQL Server |
| **Mß║¡t khß║⌐u SA Database** | `RomsPass123@2026` | Mß║¡t khß║⌐u kß║┐t nß╗æi JDBC v├á SSMS |
| **M├║i giß╗¥ m├íy chß╗º (Timezone)** | `Asia/Ho_Chi_Minh` (GMT+7) | ─Éß╗ông bß╗Ö cho cß║ú Docker, JVM v├á Database |

---

## ≡ƒûÑ∩╕Å PHß║ªN 2: H╞»ß╗ÜNG Dß║¬N TRUY Cß║¼P & Vß║¼N H├ÇNH SERVER VPS

### 2.1. ─É─âng nhß║¡p SSH v├áo m├íy chß╗º
Mß╗ƒ **PowerShell** hoß║╖c **Command Prompt** (hoß║╖c c├┤ng cß╗Ñ nh╞░ *MobaXterm / PuTTY / VS Code Remote SSH*) tr├¬n m├íy t├¡nh cß╗ºa bß║ín:

```bash
ssh root@222.255.184.250
```

* Khi hß╗ç thß╗æng y├¬u cß║ºu mß║¡t khß║⌐u (`root@222.255.184.250's password:`):
* Nhß║¡p (hoß║╖c chuß╗Öt phß║úi d├ín): **`Romsswp391!@`** rß╗ôi nhß║Ñn **Enter**.
*(L╞░u ├╜: M├án h├¼nh Linux bß║úo mß║¡t sß║╜ kh├┤ng hiß╗ân thß╗ï k├╜ tß╗▒ hay dß║Ñu chß║Ñm tr├▓n, bß║ín chß╗ë cß║ºn d├ín ─æ├║ng rß╗ôi nhß║Ñn Enter).*

### 2.2. Di chuyß╗ân v├áo th╞░ mß╗Ñc dß╗▒ ├ín
Sau khi ─æ─âng nhß║¡p th├ánh c├┤ng v├áo VPS:
```bash
cd ~/Restaurant-Ordering-Management-System-ROMS-
```

Kiß╗âm tra trß║íng th├íi c├íc file hiß╗çn tß║íi:
```bash
git status
```

### 2.3. Quy tr├¼nh k├⌐o code mß╗¢i nhß║Ñt tß╗½ GitHub (Git Pull)
─Éß╗â cß║¡p nhß║¡t m├ú nguß╗ôn mß╗¢i nhß║Ñt tß╗½ nh├ính `develop`:
```bash
git pull origin develop
```

> [!NOTE]
> **Xß╗¡ l├╜ nß║┐u GitHub y├¬u cß║ºu x├íc thß╗▒c t├ái khoß║ún (Khi Repo ß╗ƒ chß║┐ ─æß╗Ö Private):**
> 1. Khi hß╗Åi `Username for 'https://github.com':` ≡ƒæë Nhß║¡p t├¬n GitHub (v├¡ dß╗Ñ: `duongtrong06tk-rgb`).
> 2. Khi hß╗Åi `Password for 'https://...':` ≡ƒæë D├ín m├ú **Personal Access Token (PAT)** dß║íng `ghp_...`.
> 
> **Mß║╣o l╞░u Token v─⌐nh viß╗àn (─æ├ú cß║Ñu h├¼nh sß║╡n tr├¬n VPS):**
> ```bash
> git remote set-url origin https://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@github.com/duongtrong06tk-rgb/Restaurant-Ordering-Management-System-ROMS-.git
> ```
> Khi cß║Ñu h├¼nh link n├áy, lß╗çnh `git pull origin develop` sß║╜ chß║íy tß╗▒ ─æß╗Öng m├á kh├┤ng bao giß╗¥ hß╗Åi mß║¡t khß║⌐u nß╗»a.

---

## ≡ƒÉ│ PHß║ªN 3: ─ÉIß╗ÇU KHIß╗éN & Vß║¼N H├ÇNH DOCKER CONTAINER

Hß╗ç thß╗æng ROMS ─æ╞░ß╗úc ─æiß╗üu phß╗æi ho├án chß╗ënh bß║▒ng Docker Compose vß╗¢i 3 dß╗ïch vß╗Ñ ch├¡nh:
1. `roms-database`: Microsoft SQL Server 2022.
2. `roms-backend`: Spring Boot 3 (Java 21 LTS).
3. `roms-frontend`: React Vite + Production Nginx.

### 3.1. C├íc lß╗çnh triß╗ân khai th╞░ß╗¥ng d├╣ng

#### A. Khß╗ƒi ─æß╗Öng lß║íi v├á build mß╗¢i bß║ún cß║¡p nhß║¡t (Sau khi `git pull`):
```bash
docker compose down
docker compose up -d --build
```
> [!IMPORTANT]
> **Lß╗çnh `docker compose down` c├│ l├ám mß║Ñt dß╗» liß╗çu kh├┤ng?**
> **HO├ÇN TO├ÇN KH├öNG.** Dß╗» liß╗çu CSDL ─æ╞░ß╗úc l╞░u an to├án tß║íi Docker Volume v─⌐nh viß╗àn (`roms-mssql-data`). Lß╗çnh `down` chß╗ë dß╗½ng tiß║┐n tr├¼nh phß║ºn mß╗üm. Tuyß╗çt ─æß╗æi **KH├öNG** g├╡ th├¬m cß╗¥ `-v` (`docker compose down -v`) v├¼ cß╗¥ `-v` mß╗¢i l├á lß╗çnh x├│a volume dß╗» liß╗çu.

#### B. Xem trß║íng th├íi sß╗æng/chß║┐t cß╗ºa c├íc container:
```bash
docker compose ps
```
*Kß║┐t quß║ú l├╜ t╞░ß╗ƒng:* Cß║ú 3 container `roms-database`, `roms-backend`, `roms-frontend` ─æß╗üu hiß╗ân thß╗ï trß║íng th├íi `Up (healthy)`.

#### C. Xem log hß╗ç thß╗æng thß╗¥i gian thß╗▒c (─Éß╗â theo d├╡i hoß║╖c bß║»t lß╗ùi):
* **Xem log Backend (Spring Boot):**
  ```bash
  docker compose logs -f backend --tail 100
  ```
  *(Nhß║Ñn `Ctrl + C` ─æß╗â tho├ít m├án h├¼nh log).*

* **Xem log Frontend (Nginx Web Server):**
  ```bash
  docker compose logs -f frontend --tail 100
  ```

* **Xem log Database (SQL Server Engine):**
  ```bash
  docker compose logs -f database --tail 100
  ```

#### D. Khß╗ƒi ─æß╗Öng lß║íi ri├¬ng lß║╗ tß╗½ng dß╗ïch vß╗Ñ (Kh├┤ng cß║ºn tß║»t to├án bß╗Ö):
```bash
# Khß╗ƒi ─æß╗Öng lß║íi ri├¬ng Backend
docker compose restart backend

# Khß╗ƒi ─æß╗Öng lß║íi ri├¬ng Frontend
docker compose restart frontend

# Khß╗ƒi ─æß╗Öng lß║íi ri├¬ng Database
docker compose restart database
```

#### E. Kiß╗âm tra nhanh sß╗⌐c khß╗Åe hß╗ç thß╗æng (Health Check):
```bash
curl -s http://localhost:8080/actuator/health | jq .
# hoß║╖c kiß╗âm tra tß╗½ b├¬n ngo├ái:
curl -s http://roms-restaurant.duckdns.org/actuator/health
```

#### F. Kiß╗âm tra m├║i giß╗¥ chuß║⌐n trong container Backend:
```bash
docker exec -it roms-backend date
```
*Kß║┐t quß║ú chuß║⌐n phß║úi kß║┐t th├║c bß║▒ng `+07` hoß║╖c `ICT` (V├¡ dß╗Ñ: `Fri Oct 30 16:50:00 +07 2026`).*

---

## ≡ƒùä∩╕Å PHß║ªN 4: Kß║╛T Nß╗ÉI & TRUY Vß║ñN TRß╗░C TIß║╛P C╞á Sß╗₧ Dß╗« LIß╗åU (SQL SERVER)

Bß║ín c├│ thß╗â t╞░╞íng t├íc vß╗¢i CSDL `ROMS_DB` theo 3 ph╞░╞íng thß╗⌐c linh hoß║ít:

---

### PH╞»╞áNG THß╗¿C 1: Kß║┐t nß╗æi bß║▒ng Giao diß╗çn trß╗▒c quan (SSMS / DBeaver / DataGrip)
*Khuy├¬n d├╣ng khi bß║ín l├ám viß╗çc tr├¬n m├íy t├¡nh c├í nh├ón ─æß╗â xem bß║úng, sß╗¡a dß╗» liß╗çu bß║▒ng chuß╗Öt.*

Mß╗ƒ phß║ºn mß╗üm **Microsoft SQL Server Management Studio (SSMS)**:
1. **Server type:** `Database Engine`
2. **Server name:** `222.255.184.250,1433` *(L╞░u ├╜: dß║Ñu phß║⌐y giß╗»a IP v├á cß╗òng 1433)*
3. **Authentication:** `SQL Server Authentication`
4. **Login:** `sa`
5. **Password:** `RomsPass123@2026`
6. Bß║Ñm v├áo n├║t **Options >>**:
   - T├¡ch chß╗ìn ├┤: **`Trust server certificate`** *(Bß║»t buß╗Öc ─æß╗â tr├ính lß╗ùi chß╗⌐ng chß╗ë SSL)*
   - Tab *Connection Properties* $\rightarrow$ Connect to database: chß╗ìn `ROMS_DB`.
7. Nhß║Ñn **Connect**.

---

### PH╞»╞áNG THß╗¿C 2: Truy vß║Ñn trß╗▒c tiß║┐p tß╗½ PowerShell m├íy c├í nh├ón qua `sqlcmd`
Bß║ín kh├┤ng cß║ºn mß╗ƒ SSMS, c├│ thß╗â chß║íy lß╗çnh trß╗▒c tiß║┐p tß╗½ m├íy trß║ím:

```powershell
sqlcmd.exe -S 222.255.184.250,1433 -U sa -P "RomsPass123@2026" -d ROMS_DB -C -l 30 -Q "SELECT TOP 10 id, table_number, name, status FROM restaurant_tables;"
```

---

### PH╞»╞áNG THß╗¿C 3: Truy vß║Ñn ngay b├¬n trong Terminal VPS
Khi ─æang SSH trong m├íy chß╗º VPS, bß║ín c├│ thß╗â t╞░╞íng t├íc trß╗▒c tiß║┐p vß╗¢i container CSDL:

#### A. Chß║íy truy vß║Ñn 1 c├óu lß╗çnh nhanh:
```bash
docker exec -it roms-database /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "RomsPass123@2026" -C -d ROMS_DB -Q "SELECT TOP 10 id, table_number, name, status FROM restaurant_tables;"
```

#### B. Mß╗ƒ giao diß╗çn d├▓ng lß╗çnh SQL t╞░╞íng t├íc li├¬n tß╗Ñc (Interactive CLI):
```bash
docker exec -it roms-database /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "RomsPass123@2026" -C -d ROMS_DB
```
Khi m├án h├¼nh hiß╗çn `1>`, bß║ín c├│ thß╗â g├╡ c├íc c├óu lß╗çnh SQL tß╗▒ do. ─Éß╗â thß╗▒c thi c├óu lß╗çnh, g├╡ `GO` rß╗ôi Enter:
```sql
1> SELECT COUNT(*) AS TotalOrders FROM orders;
2> GO
3> QUIT
```

---

### 4.2. C├íc c├óu lß╗çnh SQL hß╗»u ├¡ch th╞░ß╗¥ng d├╣ng ─æß╗â cß╗⌐u hß╗Ö dß╗» liß╗çu (Troubleshooting Queries)

#### 1. Kiß╗âm tra trß║íng th├íi to├án bß╗Ö b├án ─ân:
```sql
SELECT id, table_number, name, zone, status, capacity, qr_token 
FROM restaurant_tables 
ORDER BY id ASC;
```

#### 2. Cß╗⌐u hß╗Ö b├án bß╗ï kß║╣t trß║íng th├íi (V├¡ dß╗Ñ reset b├án B-02 vß╗ü AVAILABLE):
```sql
-- Cß║¡p nhß║¡t phi├¬n ─ân vß╗ü COMPLETED
UPDATE dining_sessions 
SET status = 'COMPLETED', end_time = GETDATE() 
WHERE table_id = 12 AND status = 'ACTIVE';

-- Cß║¡p nhß║¡t trß║íng th├íi b├án vß╗ü Trß╗æng
UPDATE restaurant_tables 
SET status = 'AVAILABLE' 
WHERE table_id = 12;
```

#### 3. Kiß╗âm tra c├íc ─æ╞ín h├áng ─æang chß╗¥ bß║┐p chß║┐ biß║┐n:
```sql
SELECT o.id, o.order_code, t.table_number, o.status, o.total_amount, o.created_at
FROM orders o
LEFT JOIN dining_sessions s ON o.session_id = s.id
LEFT JOIN restaurant_tables t ON s.table_id = t.id
WHERE o.status IN ('SUBMITTED', 'CONFIRMED', 'COOKING')
ORDER BY o.created_at DESC;
```

#### 4. Kiß╗âm tra danh s├ích nh├ón vi├¬n v├á m├ú PIN:
```sql
SELECT id, staff_code, full_name, role, is_active, failed_pin_attempts 
FROM staffs;
```

#### 5. Mß╗ƒ kh├│a t├ái khoß║ún nh├ón vi├¬n bß╗ï nhß║¡p sai PIN qu├í 5 lß║ºn:
```sql
UPDATE staffs 
SET is_active = 1, failed_pin_attempts = 0 
WHERE staff_code = 'CSH-001';
```

---

## ≡ƒÆ╛ PHß║ªN 5: SAO L╞»U (BACKUP) & PHß╗ñC Hß╗ÆI (RESTORE) C╞á Sß╗₧ Dß╗« LIß╗åU

### 5.1. Tß║ío bß║ún sao l╞░u dß╗▒ ph├▓ng (Full Backup)
Khi ─æang SSH tr├¬n VPS, chß║íy lß╗çnh:
```bash
# 1. Ra lß╗çnh cho SQL Server sao l╞░u database v├áo file .bak
docker exec -it roms-database /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "RomsPass123@2026" -C -Q "BACKUP DATABASE [ROMS_DB] TO DISK = '/var/opt/mssql/backup_roms_$(date +%Y%m%d).bak' WITH FORMAT, INIT, NAME = 'Full Backup of ROMS_DB';"

# 2. Copy file sao l╞░u tß╗½ trong container ra th╞░ mß╗Ñc ngo├ái VPS
docker cp roms-database:/var/opt/mssql/backup_roms_$(date +%Y%m%d).bak ~/backup_roms_$(date +%Y%m%d).bak

# 3. Kiß╗âm tra file backup
ls -lh ~/backup_roms_*.bak
```

### 5.2. Tß║úi bß║ún backup vß╗ü m├íy t├¡nh c├í nh├ón
Mß╗ƒ PowerShell tr├¬n m├íy t├¡nh c├í nh├ón (kh├┤ng phß║úi tr├¬n VPS) v├á chß║íy lß╗çnh `scp`:
```powershell
scp root@222.255.184.250:~/backup_roms_20261030.bak C:\Users\Dell\Downloads\
```

---

## ≡ƒÜ¿ PHß║ªN 6: Cß║¿M NANG Xß╗¼ L├¥ Sß╗░ Cß╗É NHANH (TROUBLESHOOTING FAQs)

### Sß╗▒ cß╗æ 1: M├íy chß╗º b├ío hß║┐t ß╗ò cß╗⌐ng (`No space left on device`)
* **Nguy├¬n nh├ón:** Docker l╞░u lß║íi c├íc bß║ún image build c┼⌐ qua nhiß╗üu lß║ºn cß║¡p nhß║¡t.
* **C├ích xß╗¡ l├╜:** Chß║íy lß╗çnh dß╗ìn r├íc an to├án cß╗ºa Docker:
  ```bash
  docker system prune -f
  ```
  *(Lß╗çnh n├áy chß╗ë x├│a c├íc image thß╗½a kh├┤ng d├╣ng ─æß║┐n, kh├┤ng chß║ím v├áo database volume).*

### Sß╗▒ cß╗æ 2: Trang web bß╗ï quay tr├▓n hoß║╖c b├ío lß╗ùi `502 Bad Gateway`
* **Nguy├¬n nh├ón:** Container Backend bß╗ï crash hoß║╖c ─æang trong 40 gi├óy khß╗ƒi ─æß╗Öng ban ─æß║ºu.
* **C├ích kiß╗âm tra:**
  ```bash
  docker compose ps
  docker compose logs --tail 50 backend
  ```
* Nß║┐u thß║Ñy lß╗ùi Out Of Memory (OOM), khß╗ƒi ─æß╗Öng lß║íi:
  ```bash
  docker compose restart backend
  ```

### Sß╗▒ cß╗æ 3: Tr├¼nh duyß╗çt vß║½n hiß╗ân thß╗ï giao diß╗çn c┼⌐ sau khi server ─æ├ú cß║¡p nhß║¡t
* **Nguy├¬n nh├ón:** Tr├¼nh duyß╗çt l╞░u ─æß╗çm (Browser Cache) c├íc file Javascript/CSS c┼⌐.
* **C├ích xß╗¡ l├╜:** Nhß║Ñn tß╗ò hß╗úp ph├¡m **`Ctrl + Shift + R`** (hoß║╖c mß╗ƒ bß║▒ng tab ß║⌐n danh `Ctrl + Shift + N`) ─æß╗â ├⌐p tr├¼nh duyß╗çt tß║úi file mß╗¢i nhß║Ñt tß╗½ m├íy chß╗º.

---
*T├ái liß╗çu ─æ╞░ß╗úc bi├¬n soß║ín v├á chuß║⌐n h├│a bß╗ƒi ROMS Engineering & DevOps Team.*
