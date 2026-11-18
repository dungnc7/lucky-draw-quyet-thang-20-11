# Lucky Draw v2.6 — approved event/theme requirements

## Baseline and owner authorization

Implementation extends approved v2.4 commit 696a734. Inspection found no prior v2.6 source, theme registry or presets. On 2026-11-18 the owner explicitly chose “Cho phép mở rộng v2.4 và tạo 7 theme mới”. This authorizes the first registry and event layer below; it supersedes the earlier assumption that a seven-theme system already existed. Preserve these IDs and choices in future releases.

## Default theme

Use `DEFAULT_THEME_ID = 'quyet-thang-corporate'`, display name **Sắc Màu Quyết Thắng**, for every new event without an explicit valid theme choice. Initialize and persist `appearance.themeId`. Use original logo and corporate blue #2E7BC3, red #F2363F, navy #0D1B3D. Apply consistent tokens across Admin, Stage, Winner Reveal and Completed.

Seven freely selectable themes:

| ID | Name |
|---|---|
| quyet-thang-corporate | Sắc Màu Quyết Thắng — Mặc định |
| lotus | Sen Vàng Đỏ Ngọc |
| midnight-gold | Đêm Vàng Sang Trọng |
| emerald | Ngọc Lục Bảo |
| royal-purple | Tím Hoàng Gia |
| ocean | Đại Dương Xanh |
| crimson | Đỏ Rực Rỡ |

A valid saved theme remains selected after reload, including lotus; do not replace it with corporate. Missing/invalid theme IDs use the default while retaining unrelated fields. Persist each event's selection separately. The default label is not the same thing as the current selection.

## Event presets and independence

Provide Ngày Nhà giáo Việt Nam 20/11, Year End Party and Chương trình tùy chỉnh. All new events start corporate by default. Presets contain content, themes contain styling. Changing preset preserves appearance; changing appearance preserves content, draw state, prices, Excel data and audio settings. Year End Party must not render Teachers' Day text in Stage, Reveal, Completed or audit event content. Creating an event from a preset must not edit the currently open event.

## Preserved draw contract

Exactly 13 manually prepared/started batches, 10,000 ms each: consolation 5×6, fourth 2×4, third 3×1, second 2×1, first 1×1. Total 44 unique winners and 130 seconds of configured countdown. Preserve cryptographic selection, persistence/recovery, locked prize editing after start, Excel import/export and independent audio/music behavior. No automatic next draw. Never publish real participant data, CCCD, session dumps or outcomes.

## Acceptance

Automated tests must cover all presets/defaults, all seven themes and valid saved selections, missing/invalid fallback, event isolation, content independence, theme changes during drawing without mutation, selector labels, metadata errors/concurrent edits, and all approved draw regressions. Browser evidence must cover the four corporate screens, original logo, responsive layouts, preset content, seven selectable themes and reload persistence. Screenshots use synthetic data only. A release is live only after successful Pages deployment and anonymous endpoint verification.
