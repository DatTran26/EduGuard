from __future__ import annotations

import json
import shutil
import subprocess
from collections import Counter
from datetime import datetime
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter


REPO_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_ROOT = REPO_ROOT / "frontend"
DOCS_ROOT = REPO_ROOT / "docs"
OUTPUT_XLSX = DOCS_ROOT / "doc_hieu.xlsx"
OUTPUT_XLXN = DOCS_ROOT / "doc_hieu.xlxn"

CODE_EXTENSIONS = {".js", ".jsx", ".ts", ".tsx"}
TEXT_EXTENSIONS = {".css", ".csv", ".html", ".js", ".json", ".jsx", ".md", ".svg", ".ts", ".tsx", ".txt", ".xml", ".yml", ".yaml"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico"}
DOC_EXTENSIONS = {".doc", ".docx", ".pdf", ".md", ".txt"}
BINARY_EXTENSIONS = {".bin", ".dat", ".dll", ".dylib", ".exe", ".pdb", ".so"}
EXCLUDED_DIRS = {".git", "node_modules", ".vite"}
ARTIFACT_PREFIXES = {
    "dist",
    "temp-backend-build-admin-real-data",
    "temp-backend-classroom-debug",
    "temp-backend-int",
    "temp-backend-out",
    "temp-build-admin-real-data-sync",
    "temp-build-form-validation-refresh",
    "temp-build-ui",
}

TOKENS = {
    "admin": "quản trị viên",
    "anti": "chống",
    "api": "API",
    "app": "ứng dụng",
    "assignment": "bài tập",
    "assignments": "bài tập",
    "attempt": "lượt làm",
    "attempts": "lượt làm",
    "auth": "xác thực",
    "avatar": "ảnh đại diện",
    "badge": "nhãn",
    "button": "nút",
    "card": "thẻ",
    "classroom": "lớp học",
    "classrooms": "lớp học",
    "common": "dùng chung",
    "components": "thành phần",
    "config": "cấu hình",
    "connection": "kết nối",
    "connections": "kết nối",
    "create": "tạo",
    "dashboard": "dashboard",
    "detail": "chi tiết",
    "exam": "đề thi",
    "exams": "đề thi",
    "features": "tính năng",
    "field": "trường",
    "filters": "bộ lọc",
    "form": "biểu mẫu",
    "format": "định dạng",
    "forms": "biểu mẫu",
    "google": "Google",
    "header": "tiêu đề",
    "helpers": "tiện ích",
    "helper": "tiện ích",
    "hooks": "hook",
    "import": "import",
    "input": "ô nhập",
    "join": "tham gia",
    "layout": "bố cục",
    "list": "danh sách",
    "loader": "bộ tải",
    "login": "đăng nhập",
    "main": "chính",
    "metric": "chỉ số",
    "monitor": "giám sát",
    "monitoring": "giám sát",
    "navbar": "thanh điều hướng",
    "notification": "thông báo",
    "notifications": "thông báo",
    "page": "trang",
    "pages": "trang",
    "panel": "bảng chức năng",
    "preview": "xem trước",
    "profile": "hồ sơ",
    "public": "công khai",
    "question": "câu hỏi",
    "questions": "câu hỏi",
    "realtime": "thời gian thực",
    "register": "đăng ký",
    "result": "kết quả",
    "results": "kết quả",
    "role": "vai trò",
    "route": "route",
    "routes": "route",
    "schedule": "lịch",
    "search": "tìm kiếm",
    "section": "khu vực",
    "select": "chọn",
    "shell": "khung",
    "sidebar": "thanh bên",
    "signalr": "SignalR",
    "skeleton": "khung chờ",
    "stat": "thống kê",
    "storage": "lưu trữ",
    "student": "học sinh",
    "teacher": "giáo viên",
    "theme": "giao diện",
    "timeline": "dòng thời gian",
    "toast": "thông báo nổi",
    "token": "token",
    "top": "trên",
    "ui": "UI",
    "user": "người dùng",
    "users": "người dùng",
    "utils": "tiện ích",
    "validation": "kiểm tra hợp lệ",
    "viewport": "vùng hiển thị",
    "workspace": "không gian làm việc",
}

COLORS = {
    "navy": "1F4E79",
    "blue": "2D6A9F",
    "green": "2F7D57",
    "border": "C9D2DC",
}


def humanize_identifier(value: str) -> str:
    normalized = value.replace("-", " ").replace("_", " ")
    pieces = []
    buffer = ""
    for char in normalized:
        if char.isupper() and buffer and not buffer[-1].isupper():
            pieces.append(buffer)
            buffer = char
        elif char == " ":
            if buffer:
                pieces.append(buffer)
                buffer = ""
        else:
            buffer += char
    if buffer:
        pieces.append(buffer)
    translated = []
    for piece in pieces:
        key = piece.lower()
        translated.append(TOKENS.get(key, piece if piece.isupper() else piece.lower()))
    return " ".join(translated).strip() or value


def titleize_subject(value: str) -> str:
    subject = humanize_identifier(value)
    return subject[:1].upper() + subject[1:] if subject else value


def first_part(relative_path: Path) -> str:
    return relative_path.parts[0] if relative_path.parts else ""


def display_path(relative_path: Path | None) -> str:
    if relative_path is None or str(relative_path) in {"", "."}:
        return "frontend"
    return f"frontend/{relative_path.as_posix()}"


def is_text_file(path: Path) -> bool:
    return path.suffix.lower() in TEXT_EXTENSIONS


def is_source_code(relative_path: Path) -> bool:
    return relative_path.suffix.lower() in CODE_EXTENSIONS and first_part(relative_path) not in ARTIFACT_PREFIXES


def infer_directory_purpose(relative_path: Path) -> str:
    if str(relative_path) in {"", "."}:
        return "Thư mục gốc của frontend: chứa mã nguồn React/Vite, tài sản tĩnh và các thư mục build tạm phục vụ phát triển."
    parts = list(relative_path.parts)
    head = parts[0]
    if head == "src":
        if len(parts) == 1:
            return "Mã nguồn chính của ứng dụng frontend."
        second = parts[1]
        mapping = {
            "api": "Các module giao tiếp backend, helper gọi HTTP và lớp cấu hình client dùng chung.",
            "assets": "Tài sản tĩnh được import trực tiếp từ mã nguồn.",
            "hooks": "Custom hook dùng chung để chia sẻ trạng thái và hành vi React.",
            "lib": "Thư viện tiện ích nhỏ và adapter nền tảng.",
            "routes": "Khai báo route, quyền truy cập và cấu hình điều hướng.",
            "signalr": "Thiết lập kết nối SignalR và realtime listener.",
            "utils": "Các hàm tiện ích thuần túy như định dạng, validate và lưu token.",
        }
        if second in mapping:
            return mapping[second]
        if second == "components":
            if len(parts) == 2:
                return "Thư viện component tái sử dụng ở nhiều tính năng."
            return f"Nhóm component {titleize_subject(parts[2])} trong thư viện dùng chung."
        if second == "features":
            if len(parts) == 2:
                return "Các tính năng được tổ chức theo domain nghiệp vụ."
            feature = titleize_subject(parts[2])
            if len(parts) == 3:
                return f"Mã nguồn của tính năng {feature}."
            if parts[3] == "pages":
                return f"Các trang cấp route cho tính năng {feature}."
            if parts[3] == "components":
                return f"Component cục bộ phục vụ riêng cho tính năng {feature}."
            return f"Thư mục con {parts[3]} hỗ trợ cho tính năng {feature}."
        return f"Thư mục con {second} trong mã nguồn chính."
    if head == "public":
        if len(parts) == 1:
            return "Tài sản tĩnh được phục vụ nguyên trạng bởi Vite hoặc HTTP server."
        if "Huong_Dan" in "/".join(parts):
            return "Bộ tài liệu hướng dẫn import đề để người dùng tải hoặc xem trực tiếp."
        return "Nhóm tài sản tĩnh công khai."
    if head == "dist":
        return "Đầu ra build production của frontend; chủ yếu là file tối ưu hóa để triển khai hoặc kiểm tra."
    if head.startswith("temp-build"):
        return "Thư mục build tạm của frontend dùng để snapshot, so sánh hoặc kiểm thử cục bộ; không phải mã nguồn chính."
    if head.startswith("temp-backend"):
        return "Thư mục đầu ra build/backend tạm đặt cạnh frontend để phục vụ debug hoặc đồng bộ dữ liệu cục bộ."
    if head in EXCLUDED_DIRS:
        return "Thư mục phụ thuộc hoặc nội bộ môi trường; được ghi chú nhưng không bung chi tiết để workbook gọn và hữu ích hơn."
    return f"Thư mục {parts[-1]} trong frontend."


def classify_file_kind(relative_path: Path) -> tuple[str, str]:
    ext = relative_path.suffix.lower()
    head = first_part(relative_path)
    if head in ARTIFACT_PREFIXES:
        if ext in {".js", ".css", ".html"}:
            return "Build artifact", "File đầu ra build hoặc tạm thời"
        if ext in BINARY_EXTENSIONS:
            return "Binary artifact", "Thư viện nhị phân hoặc file thực thi"
    if ext in CODE_EXTENSIONS:
        return "Source code", "Mã nguồn"
    if ext == ".css":
        return "Stylesheet", "Kiểu dáng"
    if ext == ".json":
        return "Config/Data", "Cấu hình hoặc dữ liệu JSON"
    if ext == ".html":
        return "Markup", "Trang HTML"
    if ext in IMAGE_EXTENSIONS:
        return "Static asset", "Hình ảnh hoặc biểu tượng"
    if ext in DOC_EXTENSIONS:
        return "Document", "Tài liệu"
    if ext in BINARY_EXTENSIONS:
        return "Binary", "Nhị phân"
    return "Other", "Tệp khác"


def infer_file_purpose(relative_path: Path, kind_note: str) -> str:
    name = relative_path.name
    stem = relative_path.stem
    ext = relative_path.suffix.lower()
    parts = relative_path.parts
    exact = {
        "package.json": "Khai báo package frontend, script Vite và dependency của ứng dụng.",
        "package-lock.json": "Khóa phiên bản dependency để cài đặt frontend tái lập được.",
        "vite.config.js": "Cấu hình Vite dùng để chạy dev server và build frontend.",
        "eslint.config.js": "Cấu hình ESLint cho mã nguồn frontend.",
        "tsconfig.json": "Cấu hình TypeScript cho tooling frontend.",
        "index.html": "HTML shell làm điểm gắn ứng dụng React vào trình duyệt.",
        "README.md": "Tài liệu mô tả và hướng dẫn ngắn cho frontend.",
        "main.jsx": "Điểm khởi động ứng dụng React; mount router và component gốc.",
        "App.jsx": "Component gốc cấp cao của ứng dụng frontend.",
        "index.css": "Bộ style toàn cục của frontend.",
        "axiosClient.js": "Khởi tạo axios client dùng chung, interceptor và cấu hình gọi API.",
        "mockDatabase.js": "Dữ liệu hoặc adapter mock để mô phỏng backend trong một số luồng frontend.",
        "routeConfig.js": "Khai báo metadata route, nhãn điều hướng và quyền truy cập.",
        "roleRoutes.js": "Ánh xạ route theo vai trò người dùng.",
        "AppRoutes.jsx": "Dựng bộ route chính của ứng dụng bằng React Router.",
        "cn.js": "Tiện ích ghép class name hoặc chuẩn hóa chuỗi class CSS.",
        "utils.ts": "Hàm tiện ích chung cấp thư viện nhỏ cho UI hoặc xử lý dữ liệu.",
        "tokenStorage.js": "Tiện ích đọc, ghi và xóa token xác thực ở phía client.",
        "formValidation.js": "Các hàm kiểm tra hợp lệ biểu mẫu ở frontend.",
        "formatDate.js": "Tiện ích định dạng ngày giờ để hiển thị.",
        "avatar.js": "Tiện ích tạo hoặc chọn thông tin avatar hiển thị.",
    }
    if name in exact:
        return exact[name]
    if parts and parts[0] in ARTIFACT_PREFIXES:
        if parts[0] == "dist":
            return "File nằm trong thư mục build production của frontend; dùng cho triển khai hoặc kiểm thử đầu ra."
        if parts[0].startswith("temp-build"):
            return "File đầu ra build tạm để kiểm thử giao diện hoặc đồng bộ dữ liệu; không phải mã nguồn chính."
        if parts[0].startswith("temp-backend"):
            return "Artifact backend tạm phục vụ debug hoặc copy runtime; không phải mã nguồn frontend chính."
    if parts and parts[0] == "public":
        if ext in IMAGE_EXTENSIONS:
            return "Tài sản tĩnh công khai để trình duyệt tải trực tiếp."
        if ext in DOC_EXTENSIONS:
            return "Tài liệu công khai để người dùng tải xuống hoặc xem trực tiếp từ frontend."
        return "Tệp công khai phục vụ trực tiếp bởi frontend."
    if parts and parts[0] == "src":
        if len(parts) >= 2 and parts[1] == "api":
            if stem.endswith("Api"):
                return f"Module đóng gói lời gọi API cho {titleize_subject(stem[:-3] or stem)}."
            return f"Module API hoặc helper giao tiếp backend cho {titleize_subject(stem)}."
        if len(parts) >= 2 and parts[1] == "hooks":
            return f"Custom hook chia sẻ trạng thái hoặc hành vi cho {titleize_subject(stem)}."
        if len(parts) >= 2 and parts[1] == "signalr":
            return f"Thiết lập kết nối realtime hoặc SignalR cho {titleize_subject(stem)}."
        if len(parts) >= 2 and parts[1] == "utils":
            return f"Tệp tiện ích phục vụ {titleize_subject(stem)}."
        if len(parts) >= 3 and parts[1] == "features":
            feature = titleize_subject(parts[2])
            if "pages" in parts:
                return f"Trang cấp route hoặc màn hình chính của tính năng {feature}."
            if "components" in parts:
                if stem.endswith("Form"):
                    return f"Biểu mẫu hoặc luồng nhập liệu cho tính năng {feature}."
                if stem.endswith("Card"):
                    return f"Component card hiển thị dữ liệu trong tính năng {feature}."
                if stem.endswith("Panel"):
                    return f"Bảng chức năng hoặc khu vực thao tác trong tính năng {feature}."
                if stem.endswith("Section"):
                    return f"Khối giao diện con trong tính năng {feature}."
                return f"Component cục bộ phục vụ tính năng {feature}."
            if "helpers" in stem.lower():
                return f"Các hàm tiện ích nội bộ cho tính năng {feature}."
        if len(parts) >= 3 and parts[1] == "components":
            group = titleize_subject(parts[2])
            if stem.endswith("Route"):
                return f"Component wrapper hoặc bảo vệ điều hướng trong nhóm {group}."
            if stem.endswith("Navbar") or stem.endswith("Sidebar") or stem.endswith("Shell") or stem.endswith("TopBar"):
                return f"Component bố cục hoặc điều hướng thuộc nhóm {group}."
            if stem.endswith("Form"):
                return f"Component biểu mẫu dùng chung trong nhóm {group}."
            return f"Component dùng chung thuộc nhóm {group}."
        if len(parts) >= 2 and parts[1] == "assets":
            return "Tài sản tĩnh được import bởi mã nguồn."
        if ext in CODE_EXTENSIONS:
            return f"Mã nguồn frontend cho {titleize_subject(stem)}."
    if ext in IMAGE_EXTENSIONS:
        return "Hình ảnh hoặc biểu tượng dùng cho giao diện frontend."
    if ext in DOC_EXTENSIONS:
        return "Tài liệu hoặc nội dung tham khảo đi kèm frontend."
    if ext == ".css":
        return "Tệp style điều khiển giao diện."
    if ext == ".json":
        return "Cấu hình hoặc dữ liệu ở định dạng JSON."
    if ext == ".html":
        return "Tệp HTML phục vụ khởi tạo hoặc xem trước giao diện."
    return f"{kind_note} của frontend."


def infer_function_purpose(function_name: str, file_record: dict) -> str:
    lower = function_name.lower()
    file_stem = file_record["stem"]
    file_ext = file_record["extension"]
    if function_name == file_stem:
        if file_ext in {".jsx", ".tsx"}:
            return "Component chính của file, chịu trách nhiệm render giao diện và phối hợp trạng thái hoặc handler cục bộ."
        return "Hàm chính cùng tên với file, đóng vai trò điểm vào logic của mô-đun này."
    prefixes = [
        ("use", "Custom hook dùng để đóng gói trạng thái hoặc hành vi cho {subject}."),
        ("handle", "Xử lý sự kiện {subject} trong luồng của file này."),
        ("fetch", "Lấy dữ liệu {subject} từ API hoặc nguồn dữ liệu tương ứng."),
        ("load", "Nạp dữ liệu hoặc trạng thái {subject} vào màn hình hoặc logic hiện tại."),
        ("get", "Trả về hoặc tính toán giá trị {subject}."),
        ("set", "Thiết lập hoặc cập nhật giá trị {subject}."),
        ("validate", "Kiểm tra hợp lệ cho {subject} trước khi lưu hoặc xử lý tiếp."),
        ("format", "Định dạng dữ liệu {subject} để hiển thị hoặc truyền tiếp."),
        ("parse", "Phân tích hoặc chuyển đổi dữ liệu {subject} sang cấu trúc cần dùng."),
        ("create", "Tạo mới đối tượng hoặc payload {subject}."),
        ("build", "Dựng cấu trúc hoặc dữ liệu {subject} từ đầu vào hiện có."),
        ("map", "Ánh xạ hoặc chuyển đổi dữ liệu sang dạng {subject}."),
        ("merge", "Gộp dữ liệu hoặc trạng thái {subject}."),
        ("normalize", "Chuẩn hóa dữ liệu {subject} trước khi sử dụng."),
        ("filter", "Lọc danh sách hoặc dữ liệu {subject} theo tiêu chí phù hợp."),
        ("sort", "Sắp xếp dữ liệu {subject} theo thứ tự mong muốn."),
        ("toggle", "Đảo trạng thái bật hoặc tắt cho {subject}."),
        ("open", "Mở {subject} trong giao diện hoặc luồng xử lý."),
        ("close", "Đóng {subject} trong giao diện hoặc luồng xử lý."),
        ("submit", "Gửi dữ liệu {subject} hoặc kích hoạt bước submit tương ứng."),
        ("save", "Lưu dữ liệu {subject} về state, storage hoặc backend."),
        ("remove", "Loại bỏ {subject} khỏi tập dữ liệu hiện tại."),
        ("delete", "Xóa {subject} theo ngữ cảnh nghiệp vụ của file."),
        ("update", "Cập nhật dữ liệu hoặc trạng thái {subject}."),
        ("connect", "Thiết lập kết nối cho {subject}."),
        ("disconnect", "Ngắt kết nối hoặc dọn dẹp tài nguyên của {subject}."),
        ("render", "Dựng phần hiển thị {subject} trong UI."),
        ("is", "Kiểm tra điều kiện đúng hoặc sai cho {subject}."),
        ("has", "Kiểm tra sự tồn tại của {subject}."),
        ("can", "Xác định khả năng hoặc quyền thực hiện {subject}."),
        ("to", "Chuyển đổi đầu vào sang dạng {subject}."),
    ]
    for prefix, template in prefixes:
        if lower.startswith(prefix) and len(function_name) > len(prefix):
            subject = humanize_identifier(function_name[len(prefix):])
            return template.format(subject=subject)
    if file_ext in {".jsx", ".tsx"} and function_name[:1].isupper():
        return "Component React hoặc sub-component dùng để render một phần giao diện."
    return f"Hàm hỗ trợ cho logic của file này. Bối cảnh chính của file: {file_record['purpose']}"


def read_text_file(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore") if is_text_file(path) else ""


def count_lines(content: str) -> int | None:
    return None if content == "" else content.count("\n") + 1


def build_code_analysis(file_paths: list[Path]) -> dict[str, dict]:
    if not file_paths:
        return {}
    temp_js = None
    try:
        helper_source = r'''
import fs from "node:fs";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import generatorModule from "@babel/generator";

const traverse = traverseModule.default || traverseModule;
const generate = generatorModule.default || generatorModule;
const input = JSON.parse(fs.readFileSync(0, "utf8"));
const results = {};

function getName(node) {
  if (!node) return null;
  if (node.type === "Identifier") return node.name;
  if (node.type === "StringLiteral") return node.value;
  return null;
}

for (const filePath of input.files) {
  const source = fs.readFileSync(filePath, "utf8");
  try {
    const ast = parse(source, {
      sourceType: "unambiguous",
      errorRecovery: true,
      allowReturnOutsideFunction: true,
      plugins: [
        "jsx",
        "typescript",
        "classProperties",
        "classPrivateProperties",
        "classPrivateMethods",
        "topLevelAwait",
        "objectRestSpread",
        "optionalChaining",
        "nullishCoalescingOperator",
        "decorators-legacy"
      ]
    });
    const items = [];
    const seen = new Set();
    function addItem(name, node, kind) {
      if (!name || !node) return;
      const line = node.loc && node.loc.start ? node.loc.start.line : null;
      const key = name + ":" + line + ":" + kind;
      if (seen.has(key)) return;
      seen.add(key);
      const params = (node.params || []).map((param) => generate(param).code);
      items.push({ name, kind, line, params });
    }
    traverse(ast, {
      FunctionDeclaration(path) {
        if (path.node.id && path.node.id.name) addItem(path.node.id.name, path.node, "function_declaration");
      },
      VariableDeclarator(path) {
        if (!path.node.id || path.node.id.type !== "Identifier" || !path.node.init) return;
        if (path.node.init.type === "ArrowFunctionExpression") addItem(path.node.id.name, path.node.init, "arrow_function");
        if (path.node.init.type === "FunctionExpression") addItem(path.node.id.name, path.node.init, "function_expression");
      },
      ObjectProperty(path) {
        if (!path.node.value) return;
        if (path.node.value.type !== "ArrowFunctionExpression" && path.node.value.type !== "FunctionExpression") return;
        const name = getName(path.node.key);
        if (!name) return;
        const kind = path.node.value.type === "ArrowFunctionExpression" ? "object_arrow_function" : "object_function_expression";
        addItem(name, path.node.value, kind);
      }
    });
    items.sort((a, b) => (a.line || 0) - (b.line || 0) || a.name.localeCompare(b.name));
    results[filePath] = { functions: items, parseError: null };
  } catch (error) {
    results[filePath] = { functions: [], parseError: error.message };
  }
}

process.stdout.write(JSON.stringify(results));
'''
        temp_js = FRONTEND_ROOT / ".frontend_inventory_babel_scan.mjs"
        temp_js.write_text(helper_source, encoding="utf-8")
        result = subprocess.run(
            ["node", str(temp_js)],
            input=json.dumps({"files": [str(path) for path in file_paths]}),
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
            cwd=str(FRONTEND_ROOT),
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or "Node AST helper failed without stderr.")
        return json.loads(result.stdout)
    finally:
        if temp_js and temp_js.exists():
            temp_js.unlink()


def collect_inventory() -> tuple[list[dict], list[dict], list[dict], list[dict]]:
    directory_records: list[dict] = []
    file_records: list[dict] = []
    tree_rows: list[dict] = []
    code_files: list[Path] = []

    def scan_dir(abs_dir: Path, rel_dir: Path | None) -> None:
        rel_key = Path(".") if rel_dir is None else rel_dir
        record = {
            "relative_path": rel_key,
            "path": display_path(rel_dir),
            "name": "frontend" if rel_dir is None else rel_dir.name,
            "level": 0 if rel_dir is None else len(rel_dir.parts),
            "purpose": infer_directory_purpose(rel_key),
            "excluded": False,
            "direct_files": 0,
            "direct_dirs": 0,
            "recursive_files": 0,
            "recursive_dirs": 0,
            "code_files": 0,
            "function_count": 0,
        }
        directory_records.append(record)
        tree_rows.append({
            "path": record["path"],
            "display": f"{'  ' * record['level']}{record['name']}/",
            "type": "Directory",
            "level": record["level"],
            "purpose": record["purpose"],
            "note": "",
        })

        children = sorted(abs_dir.iterdir(), key=lambda item: (not item.is_dir(), item.name.lower()))
        for child in children:
            child_rel = child.name if rel_dir is None else f"{rel_dir.as_posix()}/{child.name}"
            child_rel_path = Path(child_rel)
            if child.is_dir():
                record["direct_dirs"] += 1
                if child.name in EXCLUDED_DIRS:
                    excluded_record = {
                        "relative_path": child_rel_path,
                        "path": display_path(child_rel_path),
                        "name": child.name,
                        "level": len(child_rel_path.parts),
                        "purpose": infer_directory_purpose(child_rel_path),
                        "excluded": True,
                        "direct_files": None,
                        "direct_dirs": None,
                        "recursive_files": None,
                        "recursive_dirs": None,
                        "code_files": None,
                        "function_count": None,
                    }
                    directory_records.append(excluded_record)
                    tree_rows.append({
                        "path": excluded_record["path"],
                        "display": f"{'  ' * excluded_record['level']}{child.name}/",
                        "type": "Directory (excluded)",
                        "level": excluded_record["level"],
                        "purpose": excluded_record["purpose"],
                        "note": "Bỏ qua chi tiết để tránh workbook quá lớn hoặc chứa phụ thuộc ngoài dự án.",
                    })
                    continue
                scan_dir(child, child_rel_path)
                continue

            record["direct_files"] += 1
            kind, kind_note = classify_file_kind(child_rel_path)
            content = read_text_file(child)
            file_record = {
                "relative_path": child_rel_path,
                "path": display_path(child_rel_path),
                "directory": display_path(rel_dir),
                "name": child.name,
                "stem": child.stem,
                "extension": child.suffix.lower(),
                "kind": kind,
                "kind_note": kind_note,
                "size_bytes": child.stat().st_size,
                "line_count": count_lines(content),
                "purpose": infer_file_purpose(child_rel_path, kind_note),
                "function_count": 0,
                "analysis_status": "not_applicable",
                "parse_error": "",
                "functions": [],
                "notes": "",
            }
            if child_rel_path.suffix.lower() in CODE_EXTENSIONS:
                if is_source_code(child_rel_path):
                    file_record["analysis_status"] = "pending"
                    code_files.append(child)
                else:
                    file_record["analysis_status"] = "skipped_artifact"
                    file_record["notes"] = "Là output build hoặc tệp tạm nên không phân tích hàm chi tiết để tránh nhiễu."
            file_records.append(file_record)
            tree_rows.append({
                "path": file_record["path"],
                "display": f"{'  ' * len(child_rel_path.parts)}{child.name}",
                "type": "File",
                "level": len(child_rel_path.parts),
                "purpose": file_record["purpose"],
                "note": file_record["notes"],
            })

    scan_dir(FRONTEND_ROOT, None)
    code_analysis = build_code_analysis(code_files)
    file_lookup = {str((FRONTEND_ROOT / record["relative_path"]).resolve()): record for record in file_records}
    for file_path in code_files:
        record = file_lookup[str(file_path.resolve())]
        analysis = code_analysis.get(str(file_path.resolve()), {"functions": [], "parseError": "Không có kết quả phân tích."})
        functions = []
        for item in analysis.get("functions", []):
            functions.append({
                "name": item.get("name") or "anonymous",
                "kind": item.get("kind") or "function",
                "line": item.get("line"),
                "params": ", ".join(item.get("params") or []),
            })
        record["functions"] = functions
        record["function_count"] = len(functions)
        if analysis.get("parseError"):
            record["analysis_status"] = "parse_error"
            record["parse_error"] = analysis["parseError"]
            record["notes"] = "Phân tích AST lỗi; số hàm có thể thiếu."
        else:
            record["analysis_status"] = "parsed"

    for directory in directory_records:
        if directory["excluded"]:
            continue
        rel_dir = directory["relative_path"]
        if str(rel_dir) == ".":
            related_files = file_records
            related_dirs = [item for item in directory_records if item["path"] != "frontend"]
        else:
            prefix = f"{rel_dir.as_posix()}/"
            related_files = [item for item in file_records if item["relative_path"].as_posix().startswith(prefix)]
            related_dirs = [item for item in directory_records if item["path"] != directory["path"] and item["path"].startswith(f"frontend/{prefix}")]
        directory["recursive_files"] = len(related_files)
        directory["recursive_dirs"] = len(related_dirs)
        directory["code_files"] = sum(1 for item in related_files if item["kind"] == "Source code")
        directory["function_count"] = sum(item["function_count"] for item in related_files)

    function_rows = []
    for file_record in sorted(file_records, key=lambda item: item["path"].lower()):
        for function in file_record["functions"]:
            function_rows.append({
                "file_path": file_record["path"],
                "file_name": file_record["name"],
                "function_name": function["name"],
                "kind": function["kind"],
                "line": function["line"],
                "params": function["params"],
                "purpose": infer_function_purpose(function["name"], file_record),
            })
    return directory_records, file_records, tree_rows, function_rows


def autosize_columns(worksheet, widths: dict[int, int] | None = None) -> None:
    widths = widths or {}
    for idx, column_cells in enumerate(worksheet.columns, start=1):
        max_length = widths.get(idx, 0)
        for cell in column_cells:
            value = "" if cell.value is None else str(cell.value)
            max_length = max(max_length, len(value))
        worksheet.column_dimensions[get_column_letter(idx)].width = min(max(max_length + 2, 12), 60)


def style_data_sheet(worksheet, header_row: int = 1, freeze: str = "A2") -> None:
    header_fill = PatternFill("solid", fgColor=COLORS["blue"])
    header_font = Font(color="FFFFFF", bold=True)
    thin_border = Border(
        left=Side(style="thin", color=COLORS["border"]),
        right=Side(style="thin", color=COLORS["border"]),
        top=Side(style="thin", color=COLORS["border"]),
        bottom=Side(style="thin", color=COLORS["border"]),
    )
    worksheet.freeze_panes = freeze
    worksheet.auto_filter.ref = worksheet.dimensions
    for cell in worksheet[header_row]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin_border
    for row in worksheet.iter_rows(min_row=header_row + 1):
        for cell in row:
            cell.alignment = Alignment(vertical="top", wrap_text=True)
            cell.border = thin_border


def build_workbook(directory_records: list[dict], file_records: list[dict], tree_rows: list[dict], function_rows: list[dict]) -> Workbook:
    workbook = Workbook()
    overview = workbook.active
    overview.title = "TongQuan"

    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    total_dirs = sum(1 for item in directory_records if not item["excluded"])
    excluded_dirs = sum(1 for item in directory_records if item["excluded"])
    total_files = len(file_records)
    source_files = sum(1 for item in file_records if item["kind"] == "Source code")
    total_functions = sum(item["function_count"] for item in file_records)
    kind_counter = Counter(item["kind"] for item in file_records)

    overview.merge_cells("A1:F1")
    overview["A1"] = "Frontend Inventory Workbook"
    overview["A1"].font = Font(size=18, bold=True, color=COLORS["navy"])
    overview["A1"].alignment = Alignment(horizontal="center")
    overview.merge_cells("A2:F2")
    overview["A2"] = "Cây thư mục frontend, mô tả thư mục hoặc tệp và thống kê hàm cho các file mã nguồn do dự án sở hữu."
    overview["A2"].alignment = Alignment(horizontal="center", wrap_text=True)

    summary_rows = [
        ("Ngày sinh", generated_at),
        ("Phạm vi", "frontend/ của repo EduGuard"),
        ("Số thư mục được phân tích", total_dirs),
        ("Số thư mục bị loại trừ", excluded_dirs),
        ("Số tệp", total_files),
        ("Số file mã nguồn", source_files),
        ("Tổng số hàm tìm thấy", total_functions),
        ("Ghi chú phạm vi", "Bỏ qua chi tiết node_modules/.git/.vite; file build/minified hoặc DLL được giữ ở mức artifact và không bung hàm."),
        ("File xuất tương thích", f"{OUTPUT_XLSX.name} và bản sao {OUTPUT_XLXN.name}"),
    ]
    row_idx = 4
    for label, value in summary_rows:
        overview[f"A{row_idx}"] = label
        overview[f"B{row_idx}"] = value
        row_idx += 1

    overview[f"A{row_idx}"] = "Phân loại tệp"
    overview[f"A{row_idx}"].font = Font(bold=True, color=COLORS["green"])
    row_idx += 1
    overview[f"A{row_idx}"] = "Loại"
    overview[f"B{row_idx}"] = "Số lượng"
    for cell in overview[row_idx]:
        cell.fill = PatternFill("solid", fgColor=COLORS["green"])
        cell.font = Font(color="FFFFFF", bold=True)
    row_idx += 1
    for kind, count in sorted(kind_counter.items()):
        overview[f"A{row_idx}"] = kind
        overview[f"B{row_idx}"] = count
        row_idx += 1

    overview["D4"] = "Ý nghĩa sheet"
    overview["D4"].font = Font(bold=True, color=COLORS["green"])
    sheet_notes = [
        ("TongQuan", "Tóm tắt phạm vi, số liệu và quy ước đọc workbook."),
        ("CayThuMuc", "Cây thư mục theo đường dẫn, kèm mục đích từng thư mục hoặc tệp."),
        ("ThuMuc", "Thông tin tổng hợp cho từng thư mục."),
        ("TapTin", "Danh sách từng tệp, loại tệp, mục đích, số hàm và ghi chú phân tích."),
        ("Ham", "Danh sách từng hàm tìm thấy trong các file mã nguồn được phân tích AST."),
    ]
    sheet_row = 5
    for name, note in sheet_notes:
        overview[f"D{sheet_row}"] = name
        overview[f"E{sheet_row}"] = note
        sheet_row += 1
    for row in overview.iter_rows(min_row=4, max_row=max(row_idx, sheet_row), min_col=1, max_col=5):
        for cell in row:
            cell.alignment = Alignment(vertical="top", wrap_text=True)
            cell.border = Border(
                left=Side(style="thin", color=COLORS["border"]),
                right=Side(style="thin", color=COLORS["border"]),
                top=Side(style="thin", color=COLORS["border"]),
                bottom=Side(style="thin", color=COLORS["border"]),
            )
    overview.column_dimensions["A"].width = 26
    overview.column_dimensions["B"].width = 74
    overview.column_dimensions["D"].width = 18
    overview.column_dimensions["E"].width = 54

    tree_sheet = workbook.create_sheet("CayThuMuc")
    tree_sheet.append(["Đường dẫn", "Hiển thị cây", "Loại", "Cấp", "Mục đích", "Ghi chú"])
    for row in tree_rows:
        tree_sheet.append([row["path"], row["display"], row["type"], row["level"], row["purpose"], row["note"]])
    style_data_sheet(tree_sheet)
    autosize_columns(tree_sheet, {2: 34, 5: 48, 6: 48})

    dir_sheet = workbook.create_sheet("ThuMuc")
    dir_sheet.append(["Đường dẫn thư mục", "Tên", "Mức sâu", "Mục đích", "Bị loại trừ", "Số thư mục con trực tiếp", "Số tệp trực tiếp", "Số thư mục con đệ quy", "Số tệp đệ quy", "Số file mã nguồn", "Tổng số hàm"])
    for record in sorted(directory_records, key=lambda item: item["path"].lower()):
        dir_sheet.append([record["path"], record["name"], record["level"], record["purpose"], "Có" if record["excluded"] else "Không", record["direct_dirs"], record["direct_files"], record["recursive_dirs"], record["recursive_files"], record["code_files"], record["function_count"]])
    style_data_sheet(dir_sheet)
    autosize_columns(dir_sheet, {4: 54})

    file_sheet = workbook.create_sheet("TapTin")
    file_sheet.append(["Đường dẫn tệp", "Thư mục", "Tên tệp", "Đuôi", "Loại", "Mô tả loại", "Kích thước (bytes)", "Số dòng", "Số hàm", "Trạng thái phân tích", "Mục đích", "Ghi chú", "Lỗi parse"])
    for record in sorted(file_records, key=lambda item: item["path"].lower()):
        file_sheet.append([record["path"], record["directory"], record["name"], record["extension"], record["kind"], record["kind_note"], record["size_bytes"], record["line_count"], record["function_count"], record["analysis_status"], record["purpose"], record["notes"], record["parse_error"]])
    style_data_sheet(file_sheet)
    autosize_columns(file_sheet, {1: 36, 2: 28, 11: 52, 12: 44, 13: 42})

    function_sheet = workbook.create_sheet("Ham")
    function_sheet.append(["Đường dẫn tệp", "Tên tệp", "Tên hàm", "Loại hàm", "Dòng", "Tham số", "Chức năng"])
    for row in function_rows:
        function_sheet.append([row["file_path"], row["file_name"], row["function_name"], row["kind"], row["line"], row["params"], row["purpose"]])
    style_data_sheet(function_sheet)
    autosize_columns(function_sheet, {1: 36, 6: 26, 7: 54})
    return workbook


def main() -> None:
    DOCS_ROOT.mkdir(parents=True, exist_ok=True)
    directory_records, file_records, tree_rows, function_rows = collect_inventory()
    workbook = build_workbook(directory_records, file_records, tree_rows, function_rows)
    workbook.save(OUTPUT_XLSX)
    shutil.copyfile(OUTPUT_XLSX, OUTPUT_XLXN)
    load_workbook(OUTPUT_XLSX, read_only=True)
    summary = {
        "output_xlsx": str(OUTPUT_XLSX),
        "output_xlxn": str(OUTPUT_XLXN),
        "directories": len(directory_records),
        "files": len(file_records),
        "functions": len(function_rows),
    }
    print(json.dumps(summary, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
