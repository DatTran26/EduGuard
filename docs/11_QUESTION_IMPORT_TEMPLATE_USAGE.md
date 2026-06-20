# EduGuard - Hướng dẫn sử dụng bộ file mẫu import đề dành cho giảng viên

Tài liệu này đi kèm bộ 20 file mẫu import đề. Bộ mẫu **không giới hạn môn học**. Giảng viên có thể dùng cho bất kỳ môn học, phân môn hoặc hoạt động giáo dục nào thuộc chương trình giáo dục phổ thông Việt Nam từ lớp 1 đến lớp 12.

Giảng viên chỉ cần chọn đúng file mẫu theo định dạng đang muốn dùng, sửa nội dung câu hỏi trong file, sau đó upload lên EduGuard.

## 1. Nên chọn file mẫu nào?

| Nhu cầu của giảng viên | Nên dùng file |
|---|---|
| Muốn soạn nhanh bằng Excel | `.xlsx` |
| Đã có dữ liệu dạng bảng hoặc xuất từ hệ thống khác | `.csv` |
| Muốn gõ đề nhanh bằng văn bản thường | `.txt` |
| Muốn soạn đề dễ đọc trong Word | `.docx` |
| Muốn gửi bản cố định, không dễ bị chỉnh sửa | `.pdf` xuất từ Word |

Lưu ý: PDF phải là PDF có chữ thật. Không dùng ảnh scan hoặc ảnh chụp đề thi.

## 2. Chọn đúng loại câu hỏi

| Loại câu hỏi | Tên file mẫu | Khi dùng |
|---|---|---|
| Trắc nghiệm một đáp án | `Mau_01_single_choice` | Câu hỏi chỉ có 1 đáp án đúng |
| Trắc nghiệm nhiều đáp án | `Mau_02_multiple_choice` | Câu hỏi có từ 2 đáp án đúng trở lên |
| Đúng / Sai | `Mau_03_true_false` | Câu nhận định đúng hoặc sai |
| Trả lời ngắn | `Mau_04_short_answer` | Câu hỏi cần nhập đáp án mẫu ngắn |

## 3. Cách sửa file CSV/XLSX

CSV và Excel dùng dạng bảng. Dòng đầu tiên là tên cột, mỗi dòng bên dưới là một câu hỏi. Không đổi tên cột.

| Cột | Giảng viên nhập gì? |
|---|---|
| `question_text` | Nội dung câu hỏi |
| `question_type` | `single_choice`, `multiple_choice`, `true_false` hoặc `short_answer` |
| `option_a` - `option_d` | Các lựa chọn A đến D |
| `correct_answer` | Đáp án đúng hoặc đáp án mẫu |
| `score` | Điểm của câu hỏi |
| `subject` | Môn học hoặc hoạt động giáo dục, không khóa danh sách cố định |
| `chapter` | Chương / chủ đề / mạch nội dung |
| `lesson` | Bài học / nội dung cụ thể |
| `difficulty` | Mức độ: Dễ, Trung bình, Khó |
| `explanation` | Giải thích đáp án |

### 3.1. Ví dụ Excel/CSV - một đáp án

| question_text | question_type | A | B | C | D | Đáp án |
|---|---|---|---|---|---|---|
| Trong câu "Em đọc sách", từ nào là động từ? | single_choice | Em | đọc | sách | câu | B |

### 3.2. Ví dụ Excel/CSV - nhiều đáp án

| question_text | question_type | A | B | C | D | Đáp án |
|---|---|---|---|---|---|---|
| Những thiết bị nào là thiết bị nhập dữ liệu? | multiple_choice | Bàn phím | Chuột | Máy quét | Máy chiếu | A,B,C |

Với file CSV, nếu đáp án có dấu phẩy như `A,B,C`, nên đặt trong dấu nháy kép: `"A,B,C"`.

### 3.3. Ví dụ Excel/CSV - đúng/sai

| question_text | question_type | A | B | C | D | Đáp án |
|---|---|---|---|---|---|---|
| Khi dùng Internet, không nên chia sẻ mật khẩu cá nhân cho người khác. | true_false | Đúng | Sai |  |  | TRUE |

### 3.4. Ví dụ Excel/CSV - trả lời ngắn

| question_text | question_type | A | B | C | D | Đáp án |
|---|---|---|---|---|---|---|
| Tên thủ đô của Việt Nam là gì? | short_answer |  |  |  |  | Hà Nội |

Với `short_answer`, không nhập đáp án A/B/C/D. Chỉ nhập đáp án mẫu vào `correct_answer`.

## 4. Cách sửa file TXT/DOCX/PDF

TXT, DOCX và PDF dùng dạng văn bản. Mỗi câu hỏi viết thành một khối riêng. DOCX nên dùng Arial cỡ 13. PDF nên xuất từ Word, không chụp ảnh đề.

### 4.1. Trắc nghiệm một đáp án

```txt
Câu 1: Trong câu "Em đọc sách", từ nào là động từ?
question_type: single_choice
A. Em
B. đọc
C. sách
D. câu
Đáp án: B
Điểm: 1
Môn: Tiếng Việt
Chương: Từ loại
Bài: Động từ trong câu
Mức độ: Dễ
Giải thích: Từ "đọc" chỉ hoạt động nên là động từ.
```

### 4.2. Trắc nghiệm nhiều đáp án

```txt
Câu 1: Những thiết bị nào là thiết bị nhập dữ liệu?
question_type: multiple_choice
A. Bàn phím
B. Chuột
C. Máy quét
D. Máy chiếu
Đáp án: A,B,C
Điểm: 1
Môn: Tin học
Chương: Máy tính và thiết bị số
Bài: Thiết bị vào
Mức độ: Dễ
Giải thích: Bàn phím, chuột và máy quét là thiết bị nhập; máy chiếu là thiết bị xuất.
```

### 4.3. Đúng / Sai

```txt
Câu 1: Khi dùng Internet, không nên chia sẻ mật khẩu cá nhân cho người khác.
question_type: true_false
A. Đúng
B. Sai
Đáp án: TRUE
Điểm: 1
Môn: Tin học
Chương: An toàn thông tin
Bài: Bảo vệ tài khoản cá nhân
Mức độ: Dễ
Giải thích: Mật khẩu cá nhân cần được giữ bí mật để bảo vệ tài khoản.
```

### 4.4. Trả lời ngắn

```txt
Câu 1: Tên thủ đô của Việt Nam là gì?
question_type: short_answer
Đáp án: Hà Nội
Điểm: 1
Môn: Lịch sử và Địa lí
Chương: Địa lí Việt Nam
Bài: Thủ đô Việt Nam
Mức độ: Dễ
Giải thích: Hà Nội là thủ đô của Việt Nam.
```

## 5. Các lỗi cần tránh

| Lỗi thường gặp | Cách sửa |
|---|---|
| Đổi tên cột trong Excel/CSV | Giữ nguyên tên cột của file mẫu |
| Gộp ô trong Excel | Bỏ gộp ô, mỗi câu nằm trên một dòng |
| Câu nhiều đáp án chỉ ghi một đáp án | Ghi từ 2 đáp án trở lên, ví dụ `A,B,D` |
| Câu đúng/sai ghi `A` hoặc `B` trong CSV/XLSX | Ghi `TRUE` hoặc `FALSE` |
| Câu trả lời ngắn vẫn nhập option A/B/C/D | Để trống option A/B/C/D, chỉ nhập đáp án mẫu |
| PDF là ảnh scan | Xuất PDF trực tiếp từ Word hoặc Google Docs |

## 6. Checklist trước khi import

- [ ] Chọn đúng file mẫu theo định dạng cần dùng.
- [ ] Không đổi tên cột trong CSV/XLSX.
- [ ] Không gộp ô trong Excel.
- [ ] Mỗi câu có nội dung câu hỏi.
- [ ] Mỗi câu có `question_type`.
- [ ] Mỗi câu có đáp án đúng hoặc đáp án mẫu.
- [ ] Câu trắc nghiệm có ít nhất 2 lựa chọn.
- [ ] Câu nhiều đáp án có ít nhất 2 đáp án đúng.
- [ ] Câu trả lời ngắn không nhập lựa chọn A/B/C/D.
- [ ] PDF là text thật, không phải ảnh scan.
