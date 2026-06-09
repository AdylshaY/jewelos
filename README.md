# JewelOS

Kuyumculuk işletmeleri için geliştirilmiş modüler, yerel öncelikli (local-first) ve güvenli bir mağaza yönetim işletim sistemidir.

## 🌟 Temel Özellikler (Phase 1)

### 💼 Günlük Kasa (Daily Vault)
* Günlük bazda nakit (TRY, USD, EUR) ve Has Altın (Fine Gold Gram) bakiyelerinin takibi.
* Günlük döviz ve altın kuru girişleri.
* Gün içi nakit/altın takas (Swap) işlemleri.
* Gün sonu mutabakatı ve kasanın güvenli şekilde kapatılması.

### 📦 Ürün ve Stok Yönetimi (Inventory)
* Kategori bazlı ürün tanımlama kataloğu (14K, 18K, 22K, 24K vb. ayar desteği).
* Barkodlu, ağırlık ve has altın dönüşümlü tekil stok takibi.
* Stok giriş (alış), çıkış (satış), iade ve envanter düzeltme hareketleri.
* Filtrelenebilir dinamik stok tabloları ve güncel stok istatistikleri.

### 📊 Satış Raporları (Sales Reports)
* Recharts ile oluşturulmuş, tema uyumlu etkileşimli grafikler.
* Nakit ve has altın bazında ciro ve satış hacmi analizi.

### 🛡️ Sistem Ayarları ve Güvenlik
* SQLite veritabanının tek tıkla yedeklenmesi ve yedekten geri yüklenmesi (Backup/Restore).
* Hassas işlemler için SHA-256 şifrelemeli Yönetici PIN kodu ve 16 haneli kurtarma anahtarı (Recovery Key) koruması.
* İlk açılışta veritabanını ve yönetici parolasını yapılandıran **Kurulum Sihirbazı (Onboarding Wizard)**.
* Sistem genelinde localStorage kayıtlı **Açık/Koyu Tema** desteği.
* Geliştirme ortamında testleri kolaylaştırmak için yerleşik **Veritabanı Sıfırlama (Database Reset)** aracı.

---

## 🛠️ Teknoloji Yığını

* **Ön Yüz (Frontend)**: React, TypeScript, Tailwind CSS v4, Lucide React, Recharts
* **Arka Yüz (Backend)**: Rust, Tauri v2 (OS API ve Dosya Sistemi entegrasyonu)
* **Veritabanı**: SQLite (rusqlite + rusqlite_migration ile otomatik şema göçleri)

---

## 💻 Kurulum ve Çalıştırma

### 1. Sistem Gereksinimleri
Uygulamayı derlemek ve çalıştırmak için sisteminizde aşağıdaki araçların bulunması gerekir:
* **Node.js** (v18 veya üzeri)
* **Rust & Cargo** (Tauri derleyicisi için)
  * *macOS*: Xcode Command Line Tools kurulumu gereklidir:
    ```bash
    xcode-select --install
    ```
  * *Windows*: C++ Build Tools ve ilgili Windows SDK kurulumları gereklidir (Visual Studio Installer üzerinden kurulabilir).

### 2. Geliştirme Ortamını Başlatma
1. Proje bağımlılıklarını yükleyin:
   ```bash
   npm install
   ```
2. Uygulamayı geliştirme modunda (Hot-Reloading aktif) çalıştırın:
   ```bash
   npm run tauri dev
   ```

### 3. Uygulamayı Paketleme ve Yükleyici (Installer) Oluşturma
Uygulamanın dağıtılabilir native paketlerini (`.dmg`, `.app`, `.msi`, `.exe`) üretmek için:
```bash
npm run tauri build
```

Derlenen paketler şu dizinlerde yer alacaktır:
* **macOS**: `src-tauri/target/release/bundle/dmg/` (Installer) & `src-tauri/target/release/bundle/macos/` (.app)
* **Windows**: `src-tauri/target/release/bundle/msi/` & `src-tauri/target/release/bundle/nsis/` (.exe)

---

## 📂 Proje Yapısı

```text
├── .agents/               # Yapay zeka standartları ve kuralları
├── src/                   # Ön Yüz (React + TSX)
│   ├── core/              # Ortak bileşenler, sihirbazlar ve PIN modalleri
│   └── features/          # Dikey modüller (daily_vault, inventory, sales_report, settings)
└── src-tauri/             # Arka Yüz (Rust + SQLite)
    ├── migrations/        # SQL Veritabanı şema göçleri (V001..V008)
    └── src/               # Tauri komutları, veritabanı bağlantısı ve servisler
```
