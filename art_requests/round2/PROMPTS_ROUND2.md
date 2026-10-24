# Meow Hotpot Conveyor — art requests, round 2

## Cách dùng
1. Mở **một** cuộc trò chuyện ChatGPT mới. Dán **QUY TẮC CHUNG** bên dưới làm tin nhắn đầu tiên, kèm `references/00_style_anchor.png`.
2. Mỗi tin nhắn gửi **một** ảnh trong `references/` kèm prompt cùng số. Có 15 ảnh: 21a–21d, 22a–22d, 23a–23f, 24.
3. Tải ảnh về, đặt tên theo số (ví dụ `21a.png`), gửi lại cho Claude.
4. Nếu ChatGPT đổi số khung, thêm chữ hoặc thêm đồ vật, nhắn lại: *"Same grid as the reference: exactly N frames in R rows, no text, no extra objects."*

Ưu tiên: **23a–23f** (khách mèo ngồi ăn, thấy nhiều nhất) → **21a–21d** (đầu bếp bê khay) → **22a–22d** (đầu bếp đặt đĩa) → **24**.

Không cần ChatGPT cho: tường (cửa giấy shoji, rèm noren, tranh hoa đào), vì phần đó vẽ bằng code, Claude tự đổi.

---

## QUY TẮC CHUNG (dán một lần, kèm 00_style_anchor.png)

```
I'm reskinning my cozy mobile tycoon game from a sushi restaurant into a HOT POT conveyor restaurant (lẩu băng chuyền). The cat characters stay exactly the same.

Each request attaches ORIGINAL game sprites arranged in a grid of animation frames. Please EDIT them, do not redraw:
- Output exactly the same grid: same number of frames, same rows and columns, same order, same spacing.
- Every frame keeps the same cat, pose, size, position, camera angle (isometric 3/4) and outline style as the reference frame in the same cell. Only the food changes.
- Frames are an animation: keep the cat and the furniture pixel-consistent from frame to frame.
- Art style as the style anchor: chunky cute cartoon, thick dark-brown outline, soft cel shading, light from the top-left.
- Do NOT add text, file names, labels, watermarks, extra props (no chairs, lanterns, plates I didn't ask for), floor shadows or a scene.
- Background: transparent PNG, or if not possible a single flat plain colour.
```

---

## 21a–21d · Mèo đầu bếp bê khay (mỗi ảnh 2 hàng × 4 khung = 2 hướng đi bộ)
Ảnh: `21a_chef_carry_front+back.png`, `21b_…`, `21c_…`, `21d_…`
```
Edit this grid (2 rows x 4 walking frames). The chef cat carries a wooden tray of sushi. Replace the sushi on the tray with hot pot ingredients: small plates of rolled marbled beef slices, shrimp, and a little bundle of enoki mushrooms and bok choy. Keep the tray, the cat, the walk cycle and both rows (the back-view row shows only the tray edges, keep it that way) exactly as in the reference.
```

## 22a–22d · Mèo đầu bếp đặt đĩa lên băng chuyền (2 hàng × 4 khung)
Ảnh: `22a_chef_place_front+back.png`, `22b_…`, `22c_…`, `22d_…`
```
Edit this grid (2 rows x 4 frames). The chef cat puts a plate of salmon sushi on the conveyor. Replace the sushi with a plate of rolled marbled raw beef slices (thin hot pot beef rolls). Keep the plate size and colour, the cat, the conveyor edge under it and all frames exactly the same.
```

## 23a · Một khách mèo cam ngồi ăn, ghế trái (2 hàng × 4 = 8 khung) — `23a_dine_one_L.png`
```
Edit these 8 frames of one cat eating at a small dining table. Replace the sushi plate and soy dish on the table with hot pot dining items: a small bowl of dipping sauce and a small plate of raw beef slices, placed near the cat's side of the table. LEAVE THE CENTRE OF THE TABLE EMPTY (a hot pot is added there by the game). The cat now lifts a thin slice of beef with chopsticks instead of sushi. Keep the cat, chairs, table and the 8-frame eating animation identical.
```

## 23b · Một khách mèo, ghế phải (8 khung) — `23b_dine_one_R.png`
```
Same edit as before for these 8 frames (cat on the right chair): sushi plate -> small bowl of dipping sauce + small plate of beef slices on the cat's side, table centre left empty, chopsticks hold a beef slice. Keep everything else identical.
```

## 23c · Một khách mèo xám (8 khung) — `23c_dine_one_G.png`
```
Same edit for these 8 frames of the gray cat: sushi -> dipping sauce bowl + small plate of beef slices on its side, table centre empty, chopsticks hold beef. Keep everything else identical.
```

## 23d · Hai khách ngồi chung bàn (3 khung) — `23d_dine_pair.png`
```
Edit these 3 frames of two cats sharing a table. Replace the sushi plates and soy dishes with: one small dipping sauce bowl in front of each cat and one shared plate of beef slices and vegetables at the table edge. LEAVE THE CENTRE OF THE TABLE EMPTY for the hot pot. The orange cat's chopsticks hold a beef slice or a mushroom instead of sushi. Keep both cats, chairs, table and the 3-frame animation identical.
```

## 23e · Khách ngồi một mình, tách lớp (2 hàng × 3 khung) — `23e_dine_solo.png`
```
Edit these 6 frames (top row: orange cat alone, bottom row: gray cat alone; each cat is cut out from its chair, no table). Only change what is in the paws/chopsticks: sushi -> a thin slice of beef or a mushroom. Keep the cats exactly the same, keep the empty background around them.
```

## 23f · Bàn trống (2 khung) — `23f_dine_empty.png`
```
Edit these 2 empty dining tables with chairs: keep them identical, just add a small chopstick rest with a pair of chopsticks and a tiny empty sauce dish at each seat. Leave the table centre empty.
```

## 24 · Quầy bò lúc hết nguyên liệu — `24_beef_counter_empty.png`
```
This is my hot pot beef counter. Make the EMPTY version of exactly the same counter (same size, angle, position, every detail identical): the wooden crate on the left is empty (no beef inside), nothing on the cutting board, the sauce tray stays. Transparent background, no text.
```
