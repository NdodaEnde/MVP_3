import React from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Add debugging to see if this component is even being used
  console.log("🔍 DEBUG: ProtectedRoute component is running!");
  console.log("🔍 DEBUG: Bypassing all authentication");
  
  // Add a visual indicator on the page so you can see this is working
  return (
    <>
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'green',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '5px',
        zIndex: 9999,
        fontSize: '12px'
      }}>
        🟢 AUTH BYPASSED
      </div>
      {children}
    </>
  );
}