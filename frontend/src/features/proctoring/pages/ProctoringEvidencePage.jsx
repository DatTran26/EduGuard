import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCamera, FiFilm, FiSearch, FiShield } from "react-icons/fi";
import { examApi } from "../../../api/examApi";
import { proctoringApi } from "../../../api/proctoringApi";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import Button from "../../../components/common/Button";
import Select from "../../../components/forms/Select";
import TextInput from "../../../components/forms/TextInput";
import PageHeader from "../../../components/layout/PageHeader";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import EvidenceCard from "../components/EvidenceCard";
import EvidenceLightbox from "../components/EvidenceLightbox";
import { EVIDENCE_TYPE_OPTIONS } from "../utils/evidenceHelpers";

const PAGE_SIZE = 24;

function SummaryTile({ icon: Icon, label, value, accentClass }) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-border bg-surface px-4 py-4 shadow-sm">
      <div className={`absolute inset-y-0 left-0 w-1 ${accentClass}`} />
      <div className="flex items-center gap-3 pl-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-surface-sunken text-secondary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">{label}</p>
          <p className="text-2xl font-bold tabular-nums text-primary">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProctoringEvidencePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [exams, setExams] = useState([]);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    totalCount: 0,
    snapshotCount: 0,
    clipCount: 0,
    autoCount: 0,
  });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let isMounted = true;

    async function loadExams() {
      try {
        const response = await examApi.getAll();
        if (isMounted) {
          setExams(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        if (isMounted) {
          showToast({
            tone: "danger",
            title: "Không tải được danh sách đề thi",
            message: error.message,
          });
        }
      }
    }

    loadExams();
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;

    async function fetchEvidence() {
      setIsLoading(true);
      try {
        const response = await proctoringApi.getEvidenceList({
          examId: selectedExamId || undefined,
          evidenceType: selectedType || undefined,
          search: debouncedSearch || undefined,
          page: 1,
          pageSize: PAGE_SIZE,
        });
        if (!isMounted) {
          return;
        }
        const data = response.data ?? {};
        setItems(Array.isArray(data.items) ? data.items : []);
        setSummary({
          totalCount: Number(data.totalCount) || 0,
          snapshotCount: Number(data.snapshotCount) || 0,
          clipCount: Number(data.clipCount) || 0,
          autoCount: Number(data.autoCount) || 0,
        });
        setPage(1);
      } catch (error) {
        if (isMounted) {
          showToast({
            tone: "danger",
            title: "Không tải được bằng chứng",
            message: error.message,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchEvidence();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, selectedExamId, selectedType, showToast]);

  const loadMoreEvidence = useCallback(async () => {
    if (isLoadingMore || items.length >= summary.totalCount) {
      return;
    }

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const response = await proctoringApi.getEvidenceList({
        examId: selectedExamId || undefined,
        evidenceType: selectedType || undefined,
        search: debouncedSearch || undefined,
        page: nextPage,
        pageSize: PAGE_SIZE,
      });
      const data = response.data ?? {};
      const nextItems = Array.isArray(data.items) ? data.items : [];
      setItems((previous) => [...previous, ...nextItems]);
      setPage(nextPage);
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Không tải thêm bằng chứng thất bại",
        message: error.message,
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    debouncedSearch,
    isLoadingMore,
    items.length,
    page,
    selectedExamId,
    selectedType,
    showToast,
    summary.totalCount,
  ]);

  const examOptions = useMemo(
    () => [
      { value: "", label: "Tất cả đề thi" },
      ...exams.map((exam) => ({
        value: String(exam.id),
        label: exam.title || `Đề #${exam.id}`,
      })),
    ],
    [exams],
  );

  const hasMore = items.length < summary.totalCount;

  function handleLoadMore() {
    loadMoreEvidence();
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Giám sát thi"
        title="Bằng chứng vi phạm"
        description="Xem lại ảnh chụp, video clip và bằng chứng AI đã lưu trong hệ thống — không cần mở thư mục server."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile accentClass="bg-brand" icon={FiShield} label="Tổng bằng chứng" value={summary.totalCount} />
        <SummaryTile accentClass="bg-info" icon={FiCamera} label="Ảnh chụp" value={summary.snapshotCount} />
        <SummaryTile accentClass="bg-danger" icon={FiFilm} label="Video clip" value={summary.clipCount} />
        <SummaryTile accentClass="bg-caution" icon={FiSearch} label="Tự động / AI" value={summary.autoCount} />
      </div>

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
          <Select
            label="Đề thi"
            options={examOptions}
            value={selectedExamId}
            onChange={(event) => setSelectedExamId(event.target.value)}
          />
          <Select
            label="Loại bằng chứng"
            options={EVIDENCE_TYPE_OPTIONS}
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
          />
          <TextInput
            label="Tìm sinh viên hoặc tên đề"
            placeholder="Nhập tên sinh viên, tên đề thi..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <p className="text-xs text-secondary">
          {user?.role === "Admin"
            ? "Quản trị viên xem toàn bộ bằng chứng trên hệ thống."
            : "Giảng viên chỉ xem bằng chứng từ đề thi mình tạo hoặc được phân công co-giám sát."}
        </p>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-[280px] animate-pulse rounded-[18px] bg-surface-sunken" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Chưa có bằng chứng nào"
          description="Ảnh chụp và video sẽ xuất hiện ở đây sau khi giáo viên ghi nhận trong phòng giám sát, hoặc khi hệ thống tự động lưu theo chính sách vi phạm."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.map((item) => (
              <EvidenceCard key={item.id} item={item} onOpen={setActiveItem} />
            ))}
          </div>

          {hasMore ? (
            <div className="flex justify-center pt-2">
              <Button disabled={isLoadingMore} onClick={handleLoadMore} variant="secondary">
                {isLoadingMore ? "Đang tải..." : `Tải thêm (${items.length}/${summary.totalCount})`}
              </Button>
            </div>
          ) : null}
        </>
      )}

      {activeItem ? (
        <EvidenceLightbox
          item={activeItem}
          items={items}
          onClose={() => setActiveItem(null)}
          onNavigate={setActiveItem}
        />
      ) : null}
    </div>
  );
}
