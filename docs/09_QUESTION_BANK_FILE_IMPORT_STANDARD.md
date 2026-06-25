# Định Chuẩn Import File Ngân Hàng Câu Hỏi

Tài liệu này định nghĩa chuẩn import file dùng để tạo câu hỏi trắc nghiệm cho bài kiểm tra trong EduGuard. Nội dung dựa trên định chuẩn xử lý file ngân hàng câu hỏi đã được duyệt và được giới hạn theo phạm vi backend hiện tại: hoàn thiện nhóm trắc nghiệm trước, tự luận phát triển sau.

## 1. Phạm Vi

Phạm vi backend hiện tại:

- Import câu hỏi vào một bài kiểm tra đã tồn tại.
- Hỗ trợ file `.csv`, `.xlsx`, `.txt`, `.docx` và PDF có text thật (`.pdf`) nếu nội dung đúng template.
- Hỗ trợ các loại câu hỏi: `single_choice`, `multiple_choice`, `true_false`, và `short_answer` tự chấm bằng đáp án mẫu.
- Validate toàn bộ file trước khi lưu bất kỳ dữ liệu nào vào database.
- Trả lỗi theo từng dòng/cột hoặc từng câu để giáo viên/admin sửa file.

Phạm vi để phát triển sau:

- Import `essay` / câu tự luận dài cần chấm thủ công.
- Import hình ảnh/media trong câu hỏi.
- Import `.zip` chứa câu hỏi kèm media.
- OCR cho PDF scan ảnh.
- Lưu lịch sử import bằng các bảng riêng như `QuestionBank`, `ImportBatch`, `ImportError`.
- Luồng preview/xác nhận import ở frontend.

## 2. API Contract

Endpoint:

```http
POST /api/exams/{id}/questions/import
Content-Type: multipart/form-data
```

Form field:

| Field | Bắt buộc | Mô tả |
|---|---:|---|
| `file` | Có | File `.csv`, `.xlsx`, `.txt`, `.docx` hoặc PDF text thật theo schema/template bên dưới |

Phân quyền:

- Bắt buộc Bearer JWT.
- Role: `Teacher` hoặc `Admin`.
- Giáo viên chỉ import vào bài kiểm tra do mình tạo.
- Admin được import vào bất kỳ bài kiểm tra nào.

Hành vi:

- Nếu có bất kỳ dòng nào lỗi, không lưu câu hỏi nào vào database.
- Nếu toàn bộ dòng hợp lệ, câu hỏi import sẽ được thêm vào sau các câu hỏi hiện có của bài kiểm tra.

## 3. Quy Tắc File Hỗ Trợ

File hỗ trợ trong backend hiện tại:

| Quy tắc | Giá trị |
|---|---|
| Extension | `.csv`, `.xlsx`, `.txt`, `.docx`, `.pdf` |
| Encoding | UTF-8 với `.csv`/`.txt`, chấp nhận BOM |
| Dung lượng tối đa | 5 MB |
| MIME type | Theo từng extension; chấp nhận MIME chuẩn của CSV/XLSX/TXT/DOCX/PDF và `application/octet-stream` |

Quy tắc theo định dạng:

| Định dạng | Cách đọc | Ghi chú |
|---|---|---|
| `.csv` | Đọc header và dòng dữ liệu theo schema cột chuẩn | Dữ liệu có dấu phẩy trong ô cần đặt trong dấu nháy kép |
| `.xlsx` | Đọc sheet đầu tiên theo schema cột chuẩn | Không cần thêm package ngoài; đọc OpenXML cơ bản |
| `.txt` | Đọc line-by-line theo mẫu `Câu n:` / `Question n:` | Dùng cú pháp đáp án `A.`, `B.`, `C.`, `D.` và `Đáp án:` / `Answer:` |
| `.docx` | Đọc paragraph/table text theo cùng template Word/TXT | Không xử lý ảnh/media nhúng trong giai đoạn này |
| `.pdf` | Chỉ đọc PDF có text thật theo template Word/TXT | PDF scan ảnh/OCR chưa hỗ trợ |

Các file bị từ chối:

- File thực thi hoặc script như `.exe`, `.bat`, `.js`, `.ps1`.
- `.doc` và `.xls`; cần chuyển sang `.docx` hoặc `.xlsx` trước.
- `.zip` chứa media; để phát triển sau khi có luồng xử lý ảnh/file đính kèm.
- File rỗng hoặc file không có dòng câu hỏi.

## 4. Schema CSV / XLSX

Cột bắt buộc:

| Cột | Bắt buộc | Mô tả |
|---|---:|---|
| `question_text` | Có | Nội dung câu hỏi |
| `question_type` | Có | `single_choice`, `multiple_choice`, `true_false`, hoặc `short_answer` |
| `correct_answer` | Có | Ký hiệu đáp án đúng với câu lựa chọn, hoặc đáp án mẫu với `short_answer` |

Cột bắt buộc theo loại câu hỏi:

| Cột | Bắt buộc | Mô tả |
|---|---:|---|
| `option_a` | Với câu hỏi lựa chọn | Đáp án A |
| `option_b` | Với câu hỏi lựa chọn | Đáp án B |
| `option_c` | Không | Đáp án C |
| `option_d` | Không | Đáp án D |

Cột tùy chọn:

| Cột | Mặc định | Mô tả |
|---|---|---|
| `score` | `1` | Điểm câu hỏi. Phải lớn hơn 0. |

Các cột được nhận diện nhưng chưa lưu trong backend hiện tại:

- `subject`
- `chapter`
- `lesson`
- `difficulty`
- `explanation`
- `tags`
- `image_url`
- `status`

## 5. Quy Tắc Theo Loại Câu Hỏi

### single_choice

Quy tắc:

- Có ít nhất 2 đáp án không rỗng.
- Có đúng 1 đáp án đúng.
- `correct_answer` phải là một trong các option tồn tại: `A`, `B`, `C`, `D`.

Ví dụ:

```csv
question_text,question_type,option_a,option_b,option_c,option_d,correct_answer,score
ASP.NET Core dùng để làm gì?,single_choice,Cơ sở dữ liệu,Web API,Bảng tính,Hệ điều hành,B,1
```

### multiple_choice

Quy tắc:

- Có ít nhất 2 đáp án không rỗng.
- Có ít nhất 2 đáp án đúng theo chuẩn import.
- `correct_answer` dùng ký hiệu cách nhau bằng dấu phẩy, ví dụ `A,C`.
- Mọi đáp án đúng phải tồn tại trong danh sách option.

Vì CSV dùng dấu phẩy để tách cột, giá trị có dấu phẩy cần được đặt trong dấu nháy kép:

```csv
question_text,question_type,option_a,option_b,option_c,option_d,correct_answer,score
Những thành phần nào có thể thuộc kiến trúc backend?,multiple_choice,Controller,Service,Repository,CSS,"A,B,C",1
```

### true_false

Quy tắc:

- `correct_answer` phải là `TRUE` hoặc `FALSE`.
- Backend tự sinh 2 lựa chọn đúng/sai cho loại câu hỏi này.

Ví dụ:

```csv
question_text,question_type,correct_answer,score
JWT thường được dùng để xác thực trong Web API.,true_false,TRUE,1
```

### short_answer

Quy tắc:

- `question_type` phải là `short_answer` trong file import.
- Không cần cột `option_a` đến `option_d` / không cần các dòng đáp án `A.` đến `D.`.
- `correct_answer` được lưu thành một đáp án mẫu để backend chấm tự động theo so khớp text không phân biệt hoa thường.
- Nếu cần nhiều đáp án mẫu cho cùng một câu hỏi, thêm thủ công trong UI sau khi import.

Ví dụ:

```csv
question_text,question_type,correct_answer,score
Thu do cua Viet Nam la gi?,short_answer,Ha Noi,1
```

## 6. Template TXT / DOCX / PDF Text

Các file `.txt`, `.docx` và PDF có text thật phải dùng mẫu văn bản rõ ràng để backend tách câu hỏi chính xác.

Quy tắc chung:

- Mỗi câu hỏi bắt đầu bằng `Câu n:` hoặc `Question n:`.
- Mỗi đáp án bắt đầu bằng `A.`, `B.`, `C.`, `D.`.
- Dòng đáp án đúng dùng `Đáp án:` hoặc `Answer:`.
- Có thể thêm `Score:` / `Điểm:` nếu muốn khác mặc định `1`.
- Có thể thêm `question_type:` nếu muốn khai báo rõ; nếu không backend tự suy luận `true_false` theo đáp án đúng/sai, `multiple_choice` khi có nhiều đáp án đúng, còn lại là `single_choice`. Với `short_answer`, bắt buộc khai báo `question_type: short_answer`.
- Các dòng metadata như `Mức độ:`, `Chương:`, `Giải thích:` được đọc để bỏ qua an toàn nhưng chưa lưu vào database.

Ví dụ một đáp án đúng:

```txt
Câu 1: ASP.NET Core là gì?
A. Một hệ quản trị cơ sở dữ liệu
B. Một framework phát triển ứng dụng web
C. Một trình duyệt web
D. Một hệ điều hành
Đáp án: B
Score: 1
```

Ví dụ nhiều đáp án đúng:

```txt
Câu 2: Những thành phần nào có thể thuộc kiến trúc backend?
A. Controller
B. Service
C. Repository
D. CSS Animation
Đáp án: A,B,C
```

Ví dụ đúng/sai:

```txt
Câu 3: JWT thường được dùng để xác thực trong Web API.
A. Đúng
B. Sai
Đáp án: A
```

## 7. Lỗi Validate

Backend phải bắt các lỗi sau trước khi lưu:

- Thiếu cột bắt buộc.
- Thiếu nội dung câu hỏi.
- `question_type` không được hỗ trợ.
- Thiếu hoặc sai `correct_answer`.
- Đáp án đúng không nằm trong danh sách option hiện có.
- Câu hỏi lựa chọn có ít hơn 2 đáp án.
- `single_choice` không có đáp án đúng hoặc có nhiều hơn 1 đáp án đúng.
- `multiple_choice` có ít hơn 2 đáp án đúng trong file import.
- `short_answer` thiếu đáp án mẫu trong `correct_answer` / `Answer:`.
- `score` không hợp lệ hoặc nhỏ hơn/bằng 0.
- File rỗng hoặc không có dòng câu hỏi.

Response lỗi gồm:

- `rowNumber`
- `fieldName`
- `errorMessage`

Nếu có ít nhất một lỗi validate, backend không ghi bất kỳ thay đổi nào vào database.

## 8. Quy Tắc Bảo Mật

- Validate extension và MIME type.
- Giới hạn dung lượng file.
- Xem nội dung file upload là dữ liệu không đáng tin cậy.
- Không thực thi bất kỳ nội dung nào trong file.
- Không lưu file upload vào thư mục public trong MVP.
- Escape/sanitize nội dung câu hỏi khi render ở frontend.
- Nếu sau này cần lưu file, phải dùng tên file do hệ thống sinh ra thay vì dùng trực tiếp tên file người dùng upload.

## 9. Roadmap

Các bước đề xuất sau backend import trắc nghiệm đa định dạng:

1. Thêm UI upload ở frontend và hiển thị lỗi theo từng dòng/cột hoặc từng câu.
2. Thêm file mẫu `.csv`, `.xlsx`, `.txt`, `.docx` để giáo viên tải về.
3. Thêm luồng preview/xác nhận trước khi import thật.
4. Hỗ trợ `essay` / câu tự luận dài cần chấm thủ công.
5. Lưu lịch sử import batch và phát hiện câu hỏi trùng.
6. Hỗ trợ import media nếu câu hỏi cần hình ảnh.
7. Hỗ trợ OCR cho PDF scan nếu thật sự cần.
