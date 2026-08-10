# Stitch UI Inventory

This document catalogs all Stitch UI screens exported from the design system.

| Stitch Screen | Category | Duplicate? | Notes |
|---------------|----------|------------|-------|
| login_sistem_pencocokan_data_bps | Authentication | No | Login page |
| registrasi_pengguna_baru | Authentication | No | User registration |
| persetujuan_registrasi_pengguna | Authentication | No | Registration approval |
| persetujuan_registrasi_pengguna_admin | Authentication | No | Admin registration approval |
| dashboard_superadmin_1 | Dashboard | Yes | Superadmin dashboard variant 1 |
| dashboard_superadmin_2 | Dashboard | Yes | Superadmin dashboard variant 2 |
| dashboard_utama_superadmin | Dashboard | Yes | Main superadmin dashboard |
| dashboard_eksekutif_kepala_bps_1 | Dashboard | Yes | Executive dashboard variant 1 |
| dashboard_eksekutif_kepala_bps_2 | Dashboard | Yes | Executive dashboard variant 2 |
| dashboard_petugas_verifikasi_1 | Dashboard | Yes | Verification officer dashboard variant 1 |
| dashboard_petugas_verifikasi_2 | Dashboard | Yes | Verification officer dashboard variant 2 |
| manajemen_pengguna | User Management | No | User management interface |
| detail_pengguna_manajemen_akses | User Management | No | User detail management |
| manajemen_dataset | Dataset Management | No | Dataset management interface |
| upload_dataset_baru | Dataset Management | No | Upload new dataset |
| detail_dataset_pratinjau_data | Dataset Management | No | Dataset preview |
| konfigurasi_matching_baru | Matching Configuration | Yes | Matching configuration variant 1 |
| konfigurasi_pencocokan_data_baru | Matching Configuration | Yes | Matching configuration variant 2 |
| manajemen_penugasan_assignment | Assignment | No | Assignment management |
| labeling_data_verifikasi_manual | Labeling | No | Manual verification labeling |
| workspace_verifikasi_manual_labeling | Labeling | No | Manual labeling workspace |
| riwayat_labeling_petugas | History | No | Officer labeling history |
| monitoring_progres_verifikasi | Monitoring | Yes | Verification progress monitoring variant 1 |
| monitoring_progres_verifikasi_operational | Monitoring | Yes | Operational verification monitoring variant 2 |
| hasil_akhir_pencocokan_data | Results | Yes | Final matching results variant 1 |
| hasil_akhir_pencocokan_executive_view | Results | Yes | Executive view of final results variant 2 |
| detail_hasil_matching_verifikasi | Results | No | Matching verification details |
| laporan_hasil_matching_statistik | Reports | Yes | Statistical matching report variant 1 |
| pratinjau_laporan_hasil_matching | Reports | Yes | Matching report preview variant 2 |
| pratinjau_laporan_hasil_matching_executive | Reports | Yes | Executive matching report preview variant 3 |
| riwayat_proses_matching_admin_view | History | No | Admin view of matching process history |
| statistika_institutional_system | Statistics | No | Institutional system statistics |

## Summary

- **Total screens**: 29
- **Unique functional screens**: ~20
- **Duplicate variations**: ~9
- **Main categories**: Authentication, Dashboard, User Management, Dataset Management, Matching Configuration, Assignment, Labeling, Monitoring, Results, Reports, History, Statistics

## Notes for Implementation

1. **Dashboard duplicates**: Multiple dashboard variants exist for different roles and layouts. Consolidation needed during UI implementation phase.
2. **Configuration duplicates**: Two similar matching configuration screens exist.
3. **Monitoring duplicates**: Two monitoring screens with similar functionality.
4. **Results duplicates**: Multiple result view screens for different user roles.
5. **Reports duplicates**: Three report preview screens with overlapping functionality.

## Design System Elements Observed

- Consistent Tailwind CSS usage
- Material Design color palette with BPS branding
- Public Sans font family
- Material Symbols icons
- Responsive design patterns
- Indonesian language interface (lang="id")

This inventory will be used during the UI implementation phase to create a consolidated, efficient component structure.