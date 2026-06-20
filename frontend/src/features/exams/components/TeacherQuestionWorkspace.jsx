import Badge from "../../../components/common/Badge";
import Card from "../../../components/common/Card";
import EmptyState from "../../../components/common/EmptyState";
import QuestionCard from "./QuestionCard";
import QuestionForm from "./QuestionForm";
import QuestionImportPanel from "./QuestionImportPanel";
import QuestionImportResources from "./QuestionImportResources";
import {
  buildQuestionSummaryItems,
  filterQuestionItems,
  formatQuestionImportFieldName,
  QUESTION_IMPORT_ACCEPTED_EXTENSIONS,
  QUESTION_WORKSPACE_FILTERS,
  QUESTION_WORKSPACE_SORT_OPTIONS,
  sortQuestionItems,
} from "./teacher-question-workspace-helpers";

const EMPTY_SUBMIT_RESULT = {
  didSave: false,
  shouldReset: false,
};

export default function TeacherQuestionWorkspace({
  exam = null,
  questions = [],
  canManage = false,
  importCommitLabel = "Commit vào đề",
  importInfoMessage = "",
  importReadyBadgeLabel = "Sẵn sàng commit",
  importStatusLabel = "Review trước khi commit",
  importSubmittingLabel = "Đang commit...",
  isReady = true,
  isDraftMode = false,
  isImportCommitDisabled = false,
  readyBadgeLabel = "Lưu đề trước",
  isQuestionSubmitting = false,
  isImportSubmitting = false,
  editingQuestionId = null,
  deletingQuestionId = null,
  armedDeleteQuestionId = null,
  expandedQuestionId = null,
  questionWorkspaceMode = "manual",
  questionWorkspaceFilter = "All",
  questionWorkspaceSort = "OrderAsc",
  composerRevision = 0,
  stagedImportFile = null,
  importReviewMessage = "",
  importResultErrors = [],
  onChangeMode,
  onFilterChange,
  onSortChange,
  onQuestionDirtyChange,
  onRequestCreateNew,
  onSubmitCreateQuestion,
  onSubmitUpdateQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onToggleExpand,
  onFileSelected,
  onClearFile,
  onCommitImport,
}) {
  const editingQuestion = questions.find((question) => question.id === editingQuestionId) ?? null;
  const questionSummaryItems = buildQuestionSummaryItems(exam, questions);
  const visibleQuestions = sortQuestionItems(
    filterQuestionItems(questions, questionWorkspaceFilter),
    questionWorkspaceSort,
  );
  const questionComposerKey = editingQuestion
    ? `question-edit-${editingQuestion.id}-${composerRevision}`
    : `question-create-${questions.length}-${composerRevision}`;
  const isImportMode = questionWorkspaceMode === "import";
  const createQuestionTitle = isDraftMode ? "Soạn câu hỏi mới" : "Tạo câu hỏi mới";
  const editQuestionTitle = isDraftMode
    ? `Chỉnh câu nháp #${editingQuestion?.orderIndex}`
    : `Chỉnh sửa câu hỏi #${editingQuestion?.orderIndex}`;
  const createQuestionSubmitLabel = isDraftMode ? "Thêm vào đề" : "Lưu câu hỏi";
  const editQuestionSubmitLabel = isDraftMode ? "Cập nhật trong đề" : "Cập nhật câu hỏi";
  const emptyStateTitle = !isReady
    ? "Lưu đề trước để mở danh sách câu hỏi."
    : questionWorkspaceFilter === "All"
      ? "Đề thi này chưa có câu hỏi nào."
      : "Chưa có câu hỏi phù hợp với bộ lọc hiện tại.";

  return (
    <div className="space-y-5">
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-primary">Workspace câu hỏi</h3>

          {canManage ? (
            <Badge variant={isReady ? (isImportMode ? "info" : "success") : "neutral"}>
              {isReady ? (isImportMode ? "Đang review import" : "Đang tạo tay") : readyBadgeLabel}
            </Badge>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {questionSummaryItems.map((item) => (
            <div key={item.label} className="rounded-[16px] border border-border bg-neutral p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-secondary">
                {item.label}
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-primary">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <QuestionImportResources />

      <div
        className={
          canManage
            ? "grid items-start gap-6 xl:grid-cols-[380px_minmax(0,1fr)] 2xl:grid-cols-[400px_minmax(0,1fr)]"
            : "space-y-5"
        }
      >
        {canManage ? (
          <div className="space-y-4 2xl:sticky 2xl:top-6">
            <div className="flex flex-wrap gap-2">
              <button
                className={questionWorkspaceMode === "manual" ? "eg-question-filter-chip eg-question-filter-chip-active" : "eg-question-filter-chip"}
                onClick={() => onChangeMode?.("manual")}
                type="button"
              >
                Tạo tay
              </button>
              <button
                className={questionWorkspaceMode === "import" ? "eg-question-filter-chip eg-question-filter-chip-active" : "eg-question-filter-chip"}
                onClick={() => onChangeMode?.("import")}
                type="button"
              >
                Nhập từ file
              </button>
            </div>

            {isImportMode ? (
              <QuestionImportPanel
                acceptedExtensions={QUESTION_IMPORT_ACCEPTED_EXTENSIONS}
                commitLabel={importCommitLabel}
                errorMessage={importReviewMessage}
                infoMessage={importInfoMessage}
                isCommitDisabled={isImportCommitDisabled}
                isDisabled={!isReady}
                isSubmitting={isImportSubmitting}
                maxFileSizeLabel="5 MB"
                onClearFile={onClearFile}
                onCommitImport={onCommitImport}
                onFileSelected={onFileSelected}
                statusLabel={importStatusLabel}
                stagedFile={stagedImportFile}
                submittingLabel={importSubmittingLabel}
              />
            ) : (
              <QuestionForm
                defaultOrderIndex={editingQuestion?.orderIndex ?? questions.length + 1}
                isDisabled={!isReady}
                isDraftMode={isDraftMode}
                isSubmitting={isQuestionSubmitting}
                key={questionComposerKey}
                onDirtyChange={onQuestionDirtyChange}
                onRequestCreateNew={editingQuestion ? onRequestCreateNew : null}
                onSubmitQuestion={
                  isReady
                    ? editingQuestion
                      ? (payload) => onSubmitUpdateQuestion?.(editingQuestion.id, payload)
                      : onSubmitCreateQuestion
                    : async () => EMPTY_SUBMIT_RESULT
                }
                question={editingQuestion}
                showDescriptions={false}
                submitLabel={editingQuestion ? editQuestionSubmitLabel : createQuestionSubmitLabel}
                title={editingQuestion ? editQuestionTitle : createQuestionTitle}
              />
            )}
          </div>
        ) : null}

        <Card className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h3 className="text-lg font-semibold text-primary">Danh sách câu hỏi</h3>

            <label className="space-y-2 text-sm text-secondary">
              <span className="block font-medium text-primary">Sắp xếp</span>
              <select
                className="eg-input min-w-48"
                onChange={(event) => onSortChange?.(event.target.value)}
                value={questionWorkspaceSort}
              >
                {QUESTION_WORKSPACE_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {canManage && isImportMode ? (
            <div className="rounded-[20px] border border-info/16 bg-info-muted p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="font-semibold text-primary">Review import</h4>
                <Badge variant={stagedImportFile ? "info" : "neutral"}>
                  {stagedImportFile ? importReadyBadgeLabel : readyBadgeLabel}
                </Badge>
              </div>

              {stagedImportFile ? (
                <div className="mt-4 rounded-[16px] border border-info/14 bg-white/75 px-4 py-3 text-sm text-primary">
                  {stagedImportFile.name}
                </div>
              ) : null}

              {importResultErrors.length > 0 ? (
                <div className="mt-4 space-y-3 rounded-[18px] border border-danger/18 bg-danger-muted p-4 text-danger">
                  <p className="font-semibold text-danger">Lỗi import</p>
                  <div className="space-y-2">
                    {importResultErrors.map((errorItem, index) => (
                      <div
                        key={`${errorItem.rowNumber}-${errorItem.fieldName}-${index}`}
                        className="rounded-[14px] border border-danger/14 bg-white/70 px-3 py-2 text-sm leading-6"
                      >
                        <span className="font-semibold">Dòng {errorItem.rowNumber}</span> • {formatQuestionImportFieldName(errorItem.fieldName)}: {errorItem.errorMessage}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {QUESTION_WORKSPACE_FILTERS.map((filterOption) => (
              <button
                key={filterOption.value}
                className={questionWorkspaceFilter === filterOption.value ? "eg-question-filter-chip eg-question-filter-chip-active" : "eg-question-filter-chip"}
                onClick={() => onFilterChange?.(filterOption.value)}
                type="button"
              >
                {filterOption.label}
              </button>
            ))}
          </div>

          {visibleQuestions.length > 0 ? (
            <div className="space-y-4">
              {visibleQuestions.map((question) => (
                <div key={question.id} className="space-y-3">
                  <QuestionCard
                    canManage={canManage}
                    isDeleting={deletingQuestionId === question.id}
                    isEditing={editingQuestionId === question.id}
                    isExpanded={expandedQuestionId === question.id}
                    onDeleteQuestion={() => onDeleteQuestion?.(question.id)}
                    onEditQuestion={() => onEditQuestion?.(question.id)}
                    onToggleExpand={() => onToggleExpand?.(question.id)}
                    question={question}
                  />

                  {armedDeleteQuestionId === question.id ? (
                    <p className="rounded-[16px] border border-danger/15 bg-danger/5 px-4 py-3 text-sm text-danger">
                      Bạn bấm thêm một lần nữa vào nút xóa của câu này để xác nhận thao tác.
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={emptyStateTitle} />
          )}
        </Card>
      </div>
    </div>
  );
}
