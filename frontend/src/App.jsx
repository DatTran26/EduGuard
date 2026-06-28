import RealtimeNotificationListener from "./features/notifications/components/RealtimeNotificationListener";
import DevRouteLogger from "./components/dev/DevRouteLogger";
import AppRoutes from "./routes/AppRoutes";

// Component gốc này gắn listener realtime toàn app rồi render bộ route chính.
export default function App() {
  return (
    <>
      <DevRouteLogger />
      <RealtimeNotificationListener />
      <AppRoutes />
    </>
  );
}
