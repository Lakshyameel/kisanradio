import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("KishanVaani Error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1rem",
            textAlign: "center",
            backgroundColor: "#fcfdf9",
            color: "#1b3320",
          }}
        >
          <div
            style={{
              fontSize: "3.5rem",
              marginBottom: "1rem",
            }}
          >
            🌾
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            कुछ अप्रत्याशित हुआ / Something went wrong
          </h2>
          <p style={{ maxWidth: "520px", color: "#4f6554", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
            किसानवाणी पर पृष्ठ लोड करने में समस्या आई है। कृपया पृष्ठ पुनः लोड करें अथवा मुख्य पृष्ठ पर जाएं।
            <br />
            We encountered an issue loading this page. Please reload or return home.
          </p>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: "#2e7d32",
                color: "#ffffff",
                padding: "0.6rem 1.4rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.95rem",
                boxShadow: "0 2px 6px rgba(46, 125, 50, 0.2)",
              }}
            >
              🔄 पृष्ठ पुनः लोड करें / Reload
            </button>
            <button
              onClick={this.handleGoHome}
              style={{
                backgroundColor: "#ffffff",
                color: "#2e7d32",
                padding: "0.6rem 1.4rem",
                borderRadius: "8px",
                border: "1.5px solid #2e7d32",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              🏠 मुख्य पृष्ठ / Home
            </button>
          </div>
          <div
            style={{
              padding: "0.75rem 1.25rem",
              backgroundColor: "#e8f5e9",
              borderRadius: "8px",
              border: "1px solid #c8e6c9",
              fontSize: "0.85rem",
              color: "#2e7d32",
            }}
          >
            📞 <strong>किसान कॉल सेन्टर (Kisan Call Center):</strong> Toll-Free 1800-180-1551 (6:00 AM - 10:00 PM)
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
