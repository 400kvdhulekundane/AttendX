import { AuthProvider } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import { AppShell } from "./AppShell";

function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
