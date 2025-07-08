import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./components/ui/theme-provider"
import { Toaster } from "./components/ui/toaster"
import { AuthProvider } from "./contexts/AuthContext"
import { OrganizationProvider } from "./contexts/OrganizationContext"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
// import { ProtectedRoute } from "./components/ProtectedRoute" // COMMENTED OUT FOR DEBUGGING
import { Layout } from "./components/Layout"
import { BlankPage } from "./pages/BlankPage"
import { Dashboard } from "./pages/Dashboard"
import { PatientRegistration } from "./pages/PatientRegistration"
import { PatientQueue } from "./pages/PatientQueue"
import { VitalSignsPage } from "./pages/VitalSigns"
import { Documents } from "./pages/Documents"
import { HistoricalProcessing } from "./pages/HistoricalProcessing"
import { MedicalTests } from "./pages/MedicalTests"
import { CertificateManagement } from "./pages/CertificateManagement"
import { Questionnaires } from "./pages/Questionnaires"
import { MedicalReview } from "./pages/MedicalReview"
import { PatientEHR } from "./pages/PatientEHR"
import { SearchableEHR } from "./pages/SearchableEHR"
import { Reports } from "./pages/Reports"
import { Settings } from "./pages/Settings"
import MobileQuestionnaire from "./components/MobileQuestionnaire"
import StationWorkflowIntegration from "./components/StationWorkflowIntegration"
import NaturalLanguageQueryInterface from "./components/NaturalLanguageQueryInterface"


// Diagnostic component to see what's happening
function DiagnosticWrapper({ children }: { children: React.ReactNode }) {
  console.log("🔍 DIAGNOSTIC: DiagnosticWrapper is rendering");
  return (
    <>
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: 'blue',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '5px',
        zIndex: 9999,
        fontSize: '12px'
      }}>
        🔵 NO PROTECTED ROUTE
      </div>
      {children}
    </>
  );
}

function App() {
  console.log("🔍 DIAGNOSTIC: App component is rendering");
  
  return (
  <AuthProvider>
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <DiagnosticWrapper>
              <OrganizationProvider>
                <Layout />
              </OrganizationProvider>
            </DiagnosticWrapper>
          }>
            <Route index element={<Dashboard />} />
            <Route path="patients/register" element={<PatientRegistration />} />
            <Route path="patients" element={<PatientQueue />} />
            <Route path="vitals" element={<VitalSignsPage />} />
            <Route path="documents" element={<Documents />} />
            <Route path="processing" element={<HistoricalProcessing />} />
            <Route path="questionnaires" element={<MobileQuestionnaire />} />
            <Route path="questionnaires/mobile" element={<MobileQuestionnaire />} />
            <Route path="workflow" element={<StationWorkflowIntegration />} />
            <Route path="tests" element={<MedicalTests />} />
            <Route path="review" element={<MedicalReview />} />
            <Route path="patient-ehr/:patientId" element={<PatientEHR />} />
            <Route path="ehr-database" element={<SearchableEHR />} />
            <Route path="nl-query" element={<NaturalLanguageQueryInterface />} />
            <Route path="certificates" element={<CertificateManagement />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<BlankPage />} />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  </AuthProvider>
  )
}

export default App
