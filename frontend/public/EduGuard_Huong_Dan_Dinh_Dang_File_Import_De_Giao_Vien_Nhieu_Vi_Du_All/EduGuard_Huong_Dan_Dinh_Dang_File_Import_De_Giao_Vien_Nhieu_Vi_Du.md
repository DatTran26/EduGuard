# HƯỚNG DẪN ĐỊNH DẠNG FILE IMPORT ĐỀ CHO GIẢNG VIÊN

**Áp dụng cho EduGuard - Ví dụ Toán, Lý, Hóa, Sinh**  
**Mục đích:** Giúp giảng viên biết chính xác cần soạn file import như thế nào. Tài liệu này ưu tiên ví dụ, hạn chế chữ dài.

## 1. File hệ thống chấp nhận

| File | Cách hiểu nhanh | Ví dụ nên dùng |
|---|---|---|
| `.csv` | Dữ liệu dạng bảng, mỗi câu là một dòng | Khi đã có danh sách câu hỏi từ hệ thống khác |
| `.xlsx` | File Excel | Khi giảng viên soạn đề bằng Excel |
| `.txt` | Văn bản thường | Khi muốn gõ đề nhanh, không cần bảng |
| `.docx` | File Word | Khi muốn trình bày đề dễ đọc trước khi import |
| `.pdf` | PDF có chữ thật | Khi xuất từ Word ra PDF, không dùng ảnh scan |

## 2. Quy tắc chung

- Mỗi câu phải có nội dung câu hỏi.
- Mỗi câu phải có đáp án đúng hoặc đáp án mẫu.
- File Excel không được gộp ô.
- PDF phải là PDF có text thật, không phải ảnh chụp.
- Font khuyến nghị cho Word/PDF: Arial, cỡ 13.

## 3. CSV - Ví dụ theo từng loại câu hỏi

### 3.1. Trắc nghiệm một đáp án

```csv
question_text,question_type,option_a,option_b,option_c,option_d,correct_answer,score
Giá trị của 2x + 3 khi x = 2 là bao nhiêu?,single_choice,5,7,8,9,B,1
```

### 3.2. Trắc nghiệm nhiều đáp án

```csv
question_text,question_type,option_a,option_b,option_c,option_d,correct_answer,score
Những chất nào là đơn chất?,multiple_choice,O2,H2,H2O,CO2,"A,B",1
```

### 3.3. Đúng / Sai

```csv
question_text,question_type,option_a,option_b,option_c,option_d,correct_answer,score
Nước sôi ở 100 độ C trong điều kiện áp suất khí quyển chuẩn.,true_false,Đúng,Sai,,,TRUE,1
```

### 3.4. Trả lời ngắn

```csv
question_text,question_type,option_a,option_b,option_c,option_d,correct_answer,score
Cơ quan nào thực hiện quang hợp chính ở thực vật?,short_answer,,,,,Lá,1
```

**Lưu ý CSV:** nếu đáp án đúng có dấu phẩy như `A,B`, nên đặt trong dấu nháy kép: `"A,B"`.

## 4. XLSX / Excel - Ví dụ cách điền từng cột

Trong Excel, dòng đầu tiên là tên cột. Mỗi dòng tiếp theo là một câu hỏi.

### 4.1. Trắc nghiệm một đáp án

| Cột trong Excel | Giá trị ví dụ |
|---|---|
| `question_text` | Giá trị của 2x + 3 khi x = 2 là bao nhiêu? |
| `question_type` | single_choice |
| `option_a` | 5 |
| `option_b` | 7 |
| `option_c` | 8 |
| `option_d` | 9 |
| `correct_answer` | B |
| `score` | 1 |

### 4.2. Trắc nghiệm nhiều đáp án

| Cột trong Excel | Giá trị ví dụ |
|---|---|
| `question_text` | Những chất nào là đơn chất? |
| `question_type` | multiple_choice |
| `option_a` | O2 |
| `option_b` | H2 |
| `option_c` | H2O |
| `option_d` | CO2 |
| `correct_answer` | A,B |
| `score` | 1 |

### 4.3. Đúng / Sai

| Cột trong Excel | Giá trị ví dụ |
|---|---|
| `question_text` | Nước sôi ở 100 độ C trong điều kiện áp suất khí quyển chuẩn. |
| `question_type` | true_false |
| `option_a` | Đúng |
| `option_b` | Sai |
| `option_c` | Để trống |
| `option_d` | Để trống |
| `correct_answer` | TRUE |
| `score` | 1 |

### 4.4. Trả lời ngắn

| Cột trong Excel | Giá trị ví dụ |
|---|---|
| `question_text` | Cơ quan nào thực hiện quang hợp chính ở thực vật? |
| `question_type` | short_answer |
| `option_a` | Để trống |
| `option_b` | Để trống |
| `option_c` | Để trống |
| `option_d` | Để trống |
| `correct_answer` | Lá |
| `score` | 1 |

## 5. TXT - Ví dụ theo từng loại câu hỏi

### 5.1. Trắc nghiệm một đáp án

```txt
Câu 1: Trong các chất sau, chất nào là hợp chất?
A. O2
B. H2
C. H2O
D. Fe
Đáp án: C
Điểm: 1
```

### 5.2. Trắc nghiệm nhiều đáp án

```txt
Câu 2: Những phát biểu nào đúng về tế bào nhân thực?
A. Có nhân hoàn chỉnh
B. Có màng nhân
C. Có thể có ti thể
D. Không có bào quan có màng
Đáp án: A,B,C
Điểm: 1
```

### 5.3. Đúng / Sai

```txt
Câu 3: Vận tốc là đại lượng vectơ.
A. Đúng
B. Sai
Đáp án: A
Điểm: 1
```

### 5.4. Trả lời ngắn

```txt
Câu 4: Nguyên tố hóa học có ký hiệu Na là gì?
Loại câu hỏi: short_answer
Đáp án: Natri
Điểm: 1
```

## 6. DOCX / Word - Ví dụ cách soạn

Word dùng cùng cấu trúc với TXT. Nên dùng Arial cỡ 13, mỗi câu cách nhau một dòng trống.

### 6.1. Ví dụ một câu trong Word

```txt
Câu 1: Trong các chất sau, chất nào là hợp chất?
A. O2
B. H2
C. H2O
D. Fe
Đáp án: C
Điểm: 1
```

### 6.2. Ví dụ câu trả lời ngắn trong Word

```txt
Câu 4: Nguyên tố hóa học có ký hiệu Na là gì?
Loại câu hỏi: short_answer
Đáp án: Natri
Điểm: 1
```

## 7. PDF - Ví dụ cách chuẩn bị

PDF không nên soạn trực tiếp. Giảng viên nên soạn bằng Word trước, sau đó chọn **Save As PDF** hoặc **Export PDF**.

### 7.1. Nội dung trong Word trước khi xuất PDF

```txt
Câu 2: Những phát biểu nào đúng về tế bào nhân thực?
A. Có nhân hoàn chỉnh
B. Có màng nhân
C. Có thể có ti thể
D. Không có bào quan có màng
Đáp án: A,B,C
Điểm: 1
```

### 7.2. Ví dụ PDF không hợp lệ

```txt
Không hợp lệ: Chụp màn hình đề thi rồi lưu thành PDF.
Lý do: Hệ thống hiện chưa đọc OCR ảnh scan.
```

## 8. Lỗi thường gặp và cách sửa

| Lỗi sai | Cách sửa |
|---|---|
| Đổi tên cột question_text thành cau_hoi | Giữ đúng tên cột question_text |
| Câu nhiều đáp án ghi đáp án là A | Ghi từ 2 đáp án trở lên, ví dụ A,B |
| short_answer vẫn nhập option_a, option_b | Để trống option_a-option_d, chỉ nhập correct_answer |
| PDF được chụp từ màn hình đề | Xuất PDF trực tiếp từ Word/Google Docs |
| Excel gộp ô tiêu đề hoặc gộp dòng câu hỏi | Bỏ gộp ô, mỗi câu nằm trên một dòng |

## 9. Checklist nhanh trước khi import

- [ ] File đúng định dạng: `.csv`, `.xlsx`, `.txt`, `.docx`, `.pdf`.
- [ ] Mỗi câu có nội dung câu hỏi.
- [ ] Mỗi câu có đáp án đúng hoặc đáp án mẫu.
- [ ] Câu trắc nghiệm có ít nhất 2 lựa chọn.
- [ ] Câu nhiều đáp án có ít nhất 2 đáp án đúng.
- [ ] Câu trả lời ngắn có dòng `Loại câu hỏi: short_answer` nếu dùng TXT/DOCX/PDF.
- [ ] Excel không gộp ô.
- [ ] PDF là text thật, không phải ảnh scan.
