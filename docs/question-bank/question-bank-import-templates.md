# EduGuard - Bộ 20 file mẫu import đề dành cho giảng viên

Bộ file này dùng cho giảng viên soạn và import câu hỏi vào EduGuard. Bộ mẫu **không giới hạn ở một môn học cố định**. Giảng viên có thể dùng cho bất kỳ môn học, phân môn hoặc hoạt động giáo dục nào thuộc chương trình giáo dục phổ thông Việt Nam từ lớp 1 đến lớp 12.

Điểm quan trọng:

- Cột `subject` trong CSV/XLSX hoặc dòng `Môn:` trong TXT/DOCX/PDF là nội dung giảng viên tự nhập.
- Không khóa danh sách môn trong file mẫu.
- Có thể nhập các môn như Tiếng Việt, Toán, Đạo đức, Tự nhiên và Xã hội, Lịch sử và Địa lí, Khoa học tự nhiên, Tin học, Công nghệ, Ngữ văn, Ngoại ngữ, Giáo dục công dân, Giáo dục kinh tế và pháp luật, Âm nhạc, Mỹ thuật, Giáo dục thể chất, Hoạt động trải nghiệm, hướng nghiệp, Nội dung giáo dục địa phương, Giáo dục quốc phòng và an ninh hoặc môn/hoạt động giáo dục phù hợp khác trong chương trình học.
- Các câu hỏi trong file chỉ là ví dụ minh họa. Khi dùng thật, giảng viên thay nội dung câu hỏi, đáp án, môn học, chương, bài và giải thích theo đề của mình.

## 0. File hướng dẫn đi kèm

Bộ này có thêm file hướng dẫn dành cho giảng viên:

- `question-import-template-usage.md`
- `Huong_Dan_Su_Dung_File_Mau_Import_De.docx`
- `Huong_Dan_Su_Dung_File_Mau_Import_De.pdf`

## 1. Danh sách 20 file mẫu

| STT | Định dạng | Loại câu hỏi | Tên file |
|---:|---|---|---|
| 1 | CSV | Trắc nghiệm một đáp án | `Mau_De_Thi_Trac_Nghiem_Mot_Dap_An.csv` |
| 2 | CSV | Trắc nghiệm nhiều đáp án | `Mau_De_Thi_Trac_Nghiem_Nhieu_Dap_An.csv` |
| 3 | CSV | Câu hỏi đúng/sai | `Mau_De_Thi_Dung_Sai.csv` |
| 4 | CSV | Câu trả lời ngắn | `Mau_De_Thi_Tra_Loi_Ngan.csv` |
| 5 | XLSX | Trắc nghiệm một đáp án | `Mau_De_Thi_Trac_Nghiem_Mot_Dap_An.xlsx` |
| 6 | XLSX | Trắc nghiệm nhiều đáp án | `Mau_De_Thi_Trac_Nghiem_Nhieu_Dap_An.xlsx` |
| 7 | XLSX | Câu hỏi đúng/sai | `Mau_De_Thi_Dung_Sai.xlsx` |
| 8 | XLSX | Câu trả lời ngắn | `Mau_De_Thi_Tra_Loi_Ngan.xlsx` |
| 9 | TXT | Trắc nghiệm một đáp án | `Mau_De_Thi_Trac_Nghiem_Mot_Dap_An.txt` |
| 10 | TXT | Trắc nghiệm nhiều đáp án | `Mau_De_Thi_Trac_Nghiem_Nhieu_Dap_An.txt` |
| 11 | TXT | Câu hỏi đúng/sai | `Mau_De_Thi_Dung_Sai.txt` |
| 12 | TXT | Câu trả lời ngắn | `Mau_De_Thi_Tra_Loi_Ngan.txt` |
| 13 | DOCX | Trắc nghiệm một đáp án | `Mau_De_Thi_Trac_Nghiem_Mot_Dap_An.docx` |
| 14 | DOCX | Trắc nghiệm nhiều đáp án | `Mau_De_Thi_Trac_Nghiem_Nhieu_Dap_An.docx` |
| 15 | DOCX | Câu hỏi đúng/sai | `Mau_De_Thi_Dung_Sai.docx` |
| 16 | DOCX | Câu trả lời ngắn | `Mau_De_Thi_Tra_Loi_Ngan.docx` |
| 17 | PDF | Trắc nghiệm một đáp án | `Mau_De_Thi_Trac_Nghiem_Mot_Dap_An.pdf` |
| 18 | PDF | Trắc nghiệm nhiều đáp án | `Mau_De_Thi_Trac_Nghiem_Nhieu_Dap_An.pdf` |
| 19 | PDF | Câu hỏi đúng/sai | `Mau_De_Thi_Dung_Sai.pdf` |
| 20 | PDF | Câu trả lời ngắn | `Mau_De_Thi_Tra_Loi_Ngan.pdf` |

## 2. Cấu trúc cột cho CSV/XLSX

CSV và Excel dùng dạng bảng. Dòng đầu tiên là tên cột, mỗi dòng tiếp theo là một câu hỏi.

| Cột | Ý nghĩa cho giảng viên |
|---|---|
| `question_text` | Nội dung câu hỏi |
| `question_type` | Loại câu hỏi: `single_choice`, `multiple_choice`, `true_false`, `short_answer` |
| `option_a` | Lựa chọn A |
| `option_b` | Lựa chọn B |
| `option_c` | Lựa chọn C |
| `option_d` | Lựa chọn D |
| `correct_answer` | Đáp án đúng hoặc đáp án mẫu |
| `score` | Điểm của câu hỏi |
| `subject` | Môn học hoặc hoạt động giáo dục, không giới hạn danh sách cố định |
| `chapter` | Chương / chủ đề / mạch nội dung |
| `lesson` | Bài học / nội dung cụ thể |
| `difficulty` | Mức độ: Dễ, Trung bình, Khó |
| `explanation` | Giải thích đáp án |

Lưu ý:

- Với `single_choice`, cột `correct_answer` ghi một chữ cái: `A`, `B`, `C` hoặc `D`.
- Với `multiple_choice`, cột `correct_answer` ghi nhiều chữ cái, ví dụ: `A,B,D`.
- Với `true_false`, cột `correct_answer` ghi `TRUE` hoặc `FALSE`.
- Với `short_answer`, chỉ nhập đáp án mẫu vào `correct_answer`; các cột `option_a` đến `option_d` để trống.
- Với file CSV, nếu đáp án có dấu phẩy như `A,B,D`, nên đặt trong dấu nháy kép: `"A,B,D"`.

## 3. Cấu trúc cho TXT/DOCX/PDF

TXT, DOCX và PDF dùng dạng văn bản. Mỗi câu hỏi viết thành một khối riêng.

### 3.1. Trắc nghiệm một đáp án

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

### 3.2. Trắc nghiệm nhiều đáp án

```txt
Câu 1: Những việc nào giúp bảo vệ môi trường ở trường học?
question_type: multiple_choice
A. Bỏ rác đúng nơi quy định
B. Tắt điện khi ra khỏi phòng
C. Trồng và chăm sóc cây xanh
D. Vứt rác xuống sân trường
Đáp án: A,B,C
Điểm: 1
Môn: Hoạt động trải nghiệm
Chương: Trách nhiệm với cộng đồng
Bài: Bảo vệ môi trường học đường
Mức độ: Dễ
Giải thích: Bỏ rác đúng nơi, tiết kiệm điện và chăm sóc cây xanh đều góp phần bảo vệ môi trường.
```

### 3.3. Câu hỏi đúng/sai

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

### 3.4. Câu trả lời ngắn

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

## 4. Quy tắc thống nhất trong bộ mẫu

| Loại câu hỏi | Cách ghi trong file | Cách ghi đáp án |
|---|---|---|
| Trắc nghiệm một đáp án | `single_choice` | Một đáp án: `A`, `B`, `C` hoặc `D` |
| Trắc nghiệm nhiều đáp án | `multiple_choice` | Nhiều đáp án, ví dụ `A,B,D` |
| Đúng/Sai | `true_false` | `TRUE` hoặc `FALSE` |
| Trả lời ngắn | `short_answer` | Nhập đáp án mẫu, ví dụ `Hà Nội`, `bàn phím`, `50` |

## 5. Ghi chú cho giảng viên

- Không đổi tên cột trong file CSV/XLSX.
- Không gộp ô trong Excel.
- Không chèn ảnh, textbox hoặc công thức dạng ảnh vào Word/PDF.
- PDF nên được xuất trực tiếp từ Word hoặc Google Docs, không dùng PDF scan ảnh.
- Font khuyến nghị cho DOCX/PDF: Arial cỡ 13.
- Những ô trống trong `true_false` và `short_answer` là có chủ đích, không cần điền thêm.
- Nếu môn học của giảng viên không có trong ví dụ, vẫn có thể nhập vào `subject` hoặc `Môn:` miễn là thuộc chương trình học đang triển khai.

## 6. Checklist trước khi import

- [ ] File thuộc một trong các định dạng: `.csv`, `.xlsx`, `.txt`, `.docx`, `.pdf`.
- [ ] Mỗi câu có nội dung câu hỏi.
- [ ] Mỗi câu có loại câu hỏi.
- [ ] Mỗi câu có đáp án đúng hoặc đáp án mẫu.
- [ ] Câu trắc nghiệm có ít nhất 2 lựa chọn.
- [ ] Câu nhiều đáp án có ít nhất 2 đáp án đúng.
- [ ] Câu trả lời ngắn không nhập lựa chọn A/B/C/D.
- [ ] Excel không gộp ô.
- [ ] PDF là text thật, không phải ảnh scan.
