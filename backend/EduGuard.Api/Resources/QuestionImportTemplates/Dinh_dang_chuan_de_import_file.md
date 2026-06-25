# Định dạng chuẩn để import file đề

## 1. Phạm vi bắt buộc

Tài liệu này là chuẩn kỹ thuật để AI chuyển một bộ đề có sẵn thành file Excel import câu hỏi.

File đầu ra phải là `.xlsx`.

File đầu ra chỉ chứa dữ liệu import hợp lệ theo chuẩn dưới đây.

Không dùng tài liệu này để sinh thêm đề mới nếu bộ đề gốc không yêu cầu.

Không dùng tài liệu này để giải thích, tóm tắt, viết lời dẫn hoặc tạo nội dung ngoài bảng import.

## 2. Nguyên tắc xử lý bộ đề gốc

AI phải làm đúng các nguyên tắc sau:

- Chỉ chuyển đổi nội dung từ bộ đề gốc được cung cấp.
- Giữ nguyên ý nghĩa câu hỏi.
- Giữ nguyên đáp án đúng nếu bộ đề gốc đã có đáp án.
- Không tự thêm câu hỏi ngoài bộ đề gốc.
- Không tự bỏ câu hỏi nếu câu hỏi có đủ dữ liệu để import.
- Không tự đổi câu hỏi từ loại này sang loại khác nếu bộ đề gốc đã thể hiện rõ loại câu hỏi.
- Không tự đoán đáp án đúng khi đề gốc không cung cấp hoặc không đủ căn cứ.
- Không tự bịa `subject`, `chapter`, `lesson`, `difficulty`, `explanation` nếu đề gốc không có.
- Nếu đề gốc thiếu thông tin phụ, để trống các cột phụ tương ứng.
- Nếu câu hỏi thiếu dữ liệu bắt buộc, không đưa câu đó vào file import hợp lệ.

## 3. Định dạng file Excel bắt buộc

Được làm:

- Tạo file Excel `.xlsx`.
- Dùng sheet đầu tiên làm sheet import.
- Dòng 1 là header chuẩn.
- Từ dòng 2 trở đi, mỗi dòng là một câu hỏi.
- Có thể trộn cả 4 loại câu hỏi trong cùng một file.
- Phân biệt loại câu hỏi bằng cột `question_type` của từng dòng.

Không được làm:

- Không tạo file `.csv`, `.txt`, `.docx`, `.pdf` cho prompt chuyển đổi Excel này.
- Không tạo nhiều sheet chứa dữ liệu import.
- Không đặt tiêu đề, mô tả hoặc hướng dẫn phía trên header.
- Không tạo dòng ghi chú, tổng kết hoặc hướng dẫn phía dưới bảng.
- Không merge ô.
- Không chèn ảnh.
- Không dùng textbox.
- Không dùng công thức Excel.
- Không dùng comment, note hoặc màu sắc để chứa dữ liệu import.
- Không thêm cột ngoài cột chuẩn.
- Không đổi tên cột.
- Không đổi thứ tự cột.

## 4. Header chuẩn

File Excel phải có đúng 13 cột sau, đúng tên và đúng thứ tự:

| STT | Tên cột | Bắt buộc | Nội dung |
|---:|---|---|---|
| 1 | `question_text` | Có | Nội dung câu hỏi |
| 2 | `question_type` | Có | Loại câu hỏi |
| 3 | `option_a` | Tùy loại | Lựa chọn A |
| 4 | `option_b` | Tùy loại | Lựa chọn B |
| 5 | `option_c` | Tùy loại | Lựa chọn C |
| 6 | `option_d` | Tùy loại | Lựa chọn D |
| 7 | `correct_answer` | Có | Đáp án đúng hoặc đáp án mẫu |
| 8 | `score` | Không | Điểm của câu hỏi |
| 9 | `subject` | Không | Môn học |
| 10 | `chapter` | Không | Chương, phần hoặc chủ đề |
| 11 | `lesson` | Không | Bài học hoặc nội dung cụ thể |
| 12 | `difficulty` | Không | Mức độ câu hỏi |
| 13 | `explanation` | Không | Giải thích đáp án |

Header chính xác:

```text
question_text,question_type,option_a,option_b,option_c,option_d,correct_answer,score,subject,chapter,lesson,difficulty,explanation
```

Không được thêm khoảng trắng vào tên cột.

Không được Việt hóa tên cột.

Không được viết hoa tên cột.

Không được đổi `option_a` thành `A`, `answer_a`, `lua_chon_a` hoặc tên khác.

## 5. Cột bắt buộc theo từng dòng

Mọi dòng câu hỏi hợp lệ đều bắt buộc có:

- `question_text`
- `question_type`
- `correct_answer`

Nếu một trong ba cột này trống, dòng đó không hợp lệ.

`score` không bắt buộc. Nếu đề gốc không có điểm, điền `1`.

Các cột `subject`, `chapter`, `lesson`, `difficulty`, `explanation` không bắt buộc. Nếu đề gốc không có dữ liệu, để trống.

## 6. Giá trị hợp lệ của `question_type`

Chỉ được dùng 4 giá trị sau:

```text
single_choice
multiple_choice
true_false
short_answer
```

Không được dùng:

- `essay`
- `tu_luan`
- `fill_blank`
- `matching`
- `ordering`
- `single choice`
- `multiple choice`
- `true false`
- `Trắc nghiệm`
- `Đúng sai`
- Bất kỳ giá trị nào khác 4 giá trị chuẩn

## 7. Chuẩn `single_choice`

`single_choice` là câu hỏi trắc nghiệm một đáp án đúng.

Được làm:

- Đặt `question_type` là `single_choice`.
- Ghi nội dung câu hỏi vào `question_text`.
- Ghi các lựa chọn vào `option_a`, `option_b`, `option_c`, `option_d`.
- Có thể có 2, 3 hoặc 4 lựa chọn.
- Có thể để trống `option_c` và `option_d` nếu câu hỏi chỉ có 2 lựa chọn.
- Ghi đáp án đúng bằng đúng 1 chữ cái trong `correct_answer`.
- Đáp án đúng phải trỏ tới một option có nội dung.

Không được làm:

- Không để ít hơn 2 lựa chọn.
- Không ghi nhiều đáp án đúng như `A,B`.
- Không ghi nội dung đáp án vào `correct_answer`.
- Không ghi `TRUE` hoặc `FALSE` trong `correct_answer`.
- Không để `correct_answer` trỏ tới option trống.
- Không đưa đáp án đúng vào `question_text` nếu đề gốc không ghi như vậy.

Giá trị hợp lệ:

| Cột | Quy định |
|---|---|
| `question_type` | `single_choice` |
| `option_a` - `option_d` | Ít nhất 2 option có nội dung |
| `correct_answer` | Một chữ cái: `A`, `B`, `C` hoặc `D` |

Ví dụ hợp lệ:

| question_text | question_type | option_a | option_b | option_c | option_d | correct_answer | score | subject | chapter | lesson | difficulty | explanation |
|---|---|---|---|---|---|---|---:|---|---|---|---|---|
| Thủ đô của Việt Nam là thành phố nào? | single_choice | Hà Nội | Huế | Đà Nẵng | TP. Hồ Chí Minh | A | 1 | Lịch sử và Địa lí | Địa lí Việt Nam | Thủ đô | Dễ | Hà Nội là thủ đô của Việt Nam. |

## 8. Chuẩn `multiple_choice`

`multiple_choice` là câu hỏi trắc nghiệm có từ hai đáp án đúng trở lên.

Được làm:

- Đặt `question_type` là `multiple_choice`.
- Ghi nội dung câu hỏi vào `question_text`.
- Ghi các lựa chọn vào `option_a`, `option_b`, `option_c`, `option_d`.
- Có thể có 2, 3 hoặc 4 lựa chọn.
- Ghi các đáp án đúng vào `correct_answer` bằng chữ cái option.
- Phân tách nhiều đáp án đúng bằng dấu phẩy.
- Dùng dạng `A,B`, `A,C`, `B,D`, `A,B,C` hoặc `A,B,C,D`.

Không được làm:

- Không để ít hơn 2 lựa chọn.
- Không ghi chỉ một đáp án đúng.
- Không ghi nội dung đáp án vào `correct_answer`.
- Không ghi `TRUE` hoặc `FALSE` trong `correct_answer`.
- Không để đáp án đúng trỏ tới option trống.
- Không dùng ký tự phân tách khác dấu phẩy trong file chuẩn.
- Không thêm khoảng trắng không cần thiết như `A, B, C`; dùng `A,B,C`.

Giá trị hợp lệ:

| Cột | Quy định |
|---|---|
| `question_type` | `multiple_choice` |
| `option_a` - `option_d` | Ít nhất 2 option có nội dung |
| `correct_answer` | Ít nhất 2 chữ cái, phân tách bằng dấu phẩy |

Ví dụ hợp lệ:

| question_text | question_type | option_a | option_b | option_c | option_d | correct_answer | score | subject | chapter | lesson | difficulty | explanation |
|---|---|---|---|---|---|---|---:|---|---|---|---|---|
| Những thiết bị nào là thiết bị nhập dữ liệu? | multiple_choice | Bàn phím | Chuột | Máy quét | Máy chiếu | A,B,C | 1 | Tin học | Thiết bị số | Thiết bị nhập | Dễ | Bàn phím, chuột và máy quét là thiết bị nhập dữ liệu. |

## 9. Chuẩn `true_false`

`true_false` là câu hỏi dạng nhận định đúng hoặc sai.

Được làm:

- Đặt `question_type` là `true_false`.
- Ghi câu nhận định vào `question_text`.
- Ghi `Đúng` vào `option_a`.
- Ghi `Sai` vào `option_b`.
- Để trống `option_c`.
- Để trống `option_d`.
- Ghi `TRUE` vào `correct_answer` nếu nhận định đúng.
- Ghi `FALSE` vào `correct_answer` nếu nhận định sai.

Không được làm:

- Không ghi `A` hoặc `B` trong `correct_answer`.
- Không ghi `Đúng` hoặc `Sai` trong `correct_answer`.
- Không ghi `true`, `false`, `Yes`, `No`, `Y`, `N`; dùng đúng `TRUE` hoặc `FALSE`.
- Không thêm lựa chọn C hoặc D.
- Không biến câu đúng/sai thành `single_choice` nếu đề gốc là nhận định đúng/sai.

Giá trị hợp lệ:

| Cột | Quy định |
|---|---|
| `question_type` | `true_false` |
| `option_a` | `Đúng` |
| `option_b` | `Sai` |
| `option_c` | Để trống |
| `option_d` | Để trống |
| `correct_answer` | `TRUE` hoặc `FALSE` |

Ví dụ hợp lệ:

| question_text | question_type | option_a | option_b | option_c | option_d | correct_answer | score | subject | chapter | lesson | difficulty | explanation |
|---|---|---|---|---|---|---|---:|---|---|---|---|---|
| Khi dùng Internet, không nên chia sẻ mật khẩu cá nhân cho người khác. | true_false | Đúng | Sai |  |  | TRUE | 1 | Tin học | An toàn thông tin | Bảo vệ tài khoản | Dễ | Mật khẩu cá nhân cần được giữ bí mật. |

## 10. Chuẩn `short_answer`

`short_answer` là câu hỏi trả lời ngắn có đáp án mẫu.

Được làm:

- Đặt `question_type` là `short_answer`.
- Ghi nội dung câu hỏi vào `question_text`.
- Để trống `option_a`.
- Để trống `option_b`.
- Để trống `option_c`.
- Để trống `option_d`.
- Ghi đáp án mẫu vào `correct_answer`.
- Dùng cho đáp án ngắn như tên riêng, thuật ngữ, số, cụm từ ngắn.

Không được làm:

- Không điền lựa chọn A/B/C/D.
- Không ghi đáp án dạng chữ cái `A`, `B`, `C`, `D` nếu đó không phải đáp án văn bản thật.
- Không ghi nhiều đáp án trắc nghiệm như `A,B`.
- Không để `correct_answer` trống.
- Không dùng cho câu tự luận dài cần giáo viên chấm thủ công.
- Không dùng cho câu có nhiều ý trả lời dài, nhiều đoạn hoặc cần rubrics.

Giá trị hợp lệ:

| Cột | Quy định |
|---|---|
| `question_type` | `short_answer` |
| `option_a` | Để trống |
| `option_b` | Để trống |
| `option_c` | Để trống |
| `option_d` | Để trống |
| `correct_answer` | Đáp án mẫu không trống |

Ví dụ hợp lệ:

| question_text | question_type | option_a | option_b | option_c | option_d | correct_answer | score | subject | chapter | lesson | difficulty | explanation |
|---|---|---|---|---|---|---|---:|---|---|---|---|---|
| Tên thủ đô của Việt Nam là gì? | short_answer |  |  |  |  | Hà Nội | 1 | Lịch sử và Địa lí | Địa lí Việt Nam | Thủ đô | Dễ | Hà Nội là thủ đô của Việt Nam. |

## 11. Quy định cho `score`

Được làm:

- Nếu đề gốc có điểm từng câu, dùng điểm trong đề gốc.
- Nếu đề gốc không có điểm từng câu, điền `1`.
- Dùng số lớn hơn `0`.
- Có thể dùng số thập phân nếu đề gốc yêu cầu, ví dụ `0.5`, `1.5`, `2`.

Không được làm:

- Không để `score` nhỏ hơn hoặc bằng `0`.
- Không ghi chữ như `một điểm`.
- Không ghi kèm đơn vị như `1 điểm`.
- Không ghi biểu thức như `1+1`.
- Không dùng công thức Excel để tính điểm.

## 12. Quy định cho cột thông tin phụ

Các cột thông tin phụ gồm:

- `subject`
- `chapter`
- `lesson`
- `difficulty`
- `explanation`

Được làm:

- Điền nếu đề gốc có thông tin.
- Để trống nếu đề gốc không có thông tin.
- Ghi `explanation` nếu đề gốc có lời giải hoặc giải thích đáp án.

Không được làm:

- Không tự bịa môn học, chương, bài, mức độ hoặc giải thích nếu đề gốc không cung cấp.
- Không dùng các cột phụ để chứa dữ liệu bắt buộc bị thiếu.
- Không đưa đáp án đúng vào `explanation` thay cho `correct_answer`.

## 13. Quy tắc nhận diện loại câu hỏi từ đề gốc

Khi chuyển đổi, AI phải xác định loại câu hỏi theo nội dung đề gốc.

Chọn `single_choice` khi:

- Câu hỏi có các lựa chọn A/B/C/D hoặc tương tự.
- Đề gốc chỉ định đúng một đáp án đúng.
- Câu hỏi yêu cầu chọn một phương án đúng nhất.

Chọn `multiple_choice` khi:

- Câu hỏi có các lựa chọn A/B/C/D hoặc tương tự.
- Đề gốc chỉ định từ hai đáp án đúng trở lên.
- Câu hỏi yêu cầu chọn nhiều phương án đúng.

Chọn `true_false` khi:

- Câu hỏi là một nhận định cần xác định đúng hoặc sai.
- Đề gốc có đáp án Đúng/Sai, True/False hoặc tương đương.

Chọn `short_answer` khi:

- Câu hỏi yêu cầu trả lời bằng một từ, một cụm từ ngắn, một số hoặc một đáp án mẫu ngắn.
- Đề gốc không có danh sách lựa chọn A/B/C/D.
- Đáp án không cần giáo viên chấm thủ công theo bài tự luận dài.

## 14. Quy tắc xử lý dữ liệu không đủ chuẩn

Nếu một câu hỏi thiếu dữ liệu bắt buộc, AI không được đoán.

Các trường hợp phải báo lỗi riêng:

- Không xác định được nội dung câu hỏi.
- Không xác định được đáp án đúng.
- Không xác định được câu hỏi thuộc 1 trong 4 loại được hỗ trợ.
- Câu trắc nghiệm không có đủ lựa chọn.
- Đáp án đúng trỏ tới lựa chọn không tồn tại.
- Câu nhiều đáp án nhưng đề gốc không cho biết đủ các đáp án đúng.
- Câu tự luận dài không phù hợp với `short_answer`.

File Excel import chỉ chứa các câu hợp lệ.

Nếu có câu lỗi, báo danh sách câu lỗi bên ngoài file Excel. Không đưa bảng lỗi vào sheet import.

## 15. Ví dụ file mixed hợp lệ

| question_text | question_type | option_a | option_b | option_c | option_d | correct_answer | score | subject | chapter | lesson | difficulty | explanation |
|---|---|---|---|---|---|---|---:|---|---|---|---|---|
| Trong câu "Em đọc sách", từ nào là động từ? | single_choice | Em | đọc | sách | câu | B | 1 | Tiếng Việt | Từ loại | Động từ | Dễ | Từ "đọc" chỉ hoạt động nên là động từ. |
| Những thiết bị nào là thiết bị nhập dữ liệu? | multiple_choice | Bàn phím | Chuột | Máy quét | Máy chiếu | A,B,C | 1 | Tin học | Thiết bị số | Thiết bị nhập | Dễ | Bàn phím, chuột và máy quét là thiết bị nhập. |
| Khi dùng Internet, không nên chia sẻ mật khẩu cá nhân cho người khác. | true_false | Đúng | Sai |  |  | TRUE | 1 | Tin học | An toàn thông tin | Mật khẩu | Dễ | Không chia sẻ mật khẩu để bảo vệ tài khoản. |
| Tên thủ đô của Việt Nam là gì? | short_answer |  |  |  |  | Hà Nội | 1 | Lịch sử và Địa lí | Địa lí Việt Nam | Thủ đô | Dễ | Hà Nội là thủ đô của Việt Nam. |

## 16. Checklist bắt buộc trước khi xuất file

Trước khi xuất file `.xlsx`, AI phải tự kiểm tra:

- [ ] File đầu ra là `.xlsx`.
- [ ] Dữ liệu import nằm ở sheet đầu tiên.
- [ ] Dòng 1 là header chuẩn.
- [ ] Header có đúng 13 cột.
- [ ] Header đúng tên cột.
- [ ] Header đúng thứ tự cột.
- [ ] Không có cột thừa.
- [ ] Không có dòng tiêu đề phụ.
- [ ] Không có ghi chú ngoài bảng.
- [ ] Không có ô merge.
- [ ] Không có ảnh.
- [ ] Không có textbox.
- [ ] Không có công thức Excel.
- [ ] Mỗi dòng từ dòng 2 trở đi là một câu hỏi.
- [ ] Mỗi câu có `question_text`.
- [ ] Mỗi câu có `question_type`.
- [ ] Mỗi câu có `correct_answer`.
- [ ] Mọi `question_type` thuộc 1 trong 4 giá trị chuẩn.
- [ ] Mọi `correct_answer` đúng quy định của từng loại câu hỏi.
- [ ] `single_choice` có ít nhất 2 option và đúng 1 đáp án đúng.
- [ ] `multiple_choice` có ít nhất 2 option và ít nhất 2 đáp án đúng.
- [ ] `true_false` có `option_a = Đúng`, `option_b = Sai`, `correct_answer = TRUE` hoặc `FALSE`.
- [ ] `short_answer` để trống toàn bộ option và có đáp án mẫu.
- [ ] `score` là số lớn hơn 0.
- [ ] Không có đáp án đúng trỏ tới option trống.
- [ ] Không có câu bị tự đoán đáp án.
- [ ] Không có câu được thêm ngoài bộ đề gốc.
