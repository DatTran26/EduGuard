import RealtimeNotificationListener from "./features/notifications/components/RealtimeNotificationListener";
import AppErrorBoundary from "./components/common/AppErrorBoundary";
import DevRouteLogger from "./components/dev/DevRouteLogger";
import AppRoutes from "./routes/AppRoutes";

// Component gốc này gắn listener realtime toàn app rồi render bộ route chính.
export default function App() {
  return (
    <AppErrorBoundary>
      <DevRouteLogger />
      <RealtimeNotificationListener />
      <AppRoutes />
    </AppErrorBoundary>
  );
}
