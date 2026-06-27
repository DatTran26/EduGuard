import { Component } from "react";
import Button from "./Button";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("EduGuard UI crash:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.assign("/");
  };

  render() {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-neutral px-4 py-10">
        <div className="mx-auto w-full max-w-xl space-y-5 rounded-[28px] border border-border bg-surface p-8 text-center shadow-[0_18px_40px_rgb(15_23_42/10%)]">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-primary">Giao diện gặp sự cố</h1>
            <p className="text-sm leading-6 text-secondary">
              EduGuard không thể hiển thị trang này do lỗi JavaScript. Bạn có thể tải lại trang hoặc quay về
              trang chủ.
            </p>
          </div>

          {import.meta.env.DEV ? (
            <pre className="max-h-40 overflow-auto rounded-[16px] border border-border bg-surface-sunken p-3 text-left text-xs text-danger whitespace-pre-wrap">
              {error.message || String(error)}
            </pre>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="primary" onClick={this.handleReload}>
              Tải lại trang
            </Button>
            <Button variant="secondary" onClick={this.handleGoHome}>
              Về trang chủ
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
