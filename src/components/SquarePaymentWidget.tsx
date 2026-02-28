import { useState, useEffect, useRef } from "react";

export type CardSummary = {
  brand?: string;
  last4?: string;
  expMonth?: number | string;
  expYear?: number | string;
};

interface SquarePaymentWidgetProps {
  applicationId: string;
  locationId: string;
  squareEnvironment: "sandbox" | "production";
  onPaymentSourceReady: (sourceId: string, cardSummary?: CardSummary) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
}

interface Web {
  payments: (applicationId: string, locationId: string) => any;
}

declare global {
  interface Window {
    Square?: Web;
  }
}

export function SquarePaymentWidget({
  applicationId,
  locationId,
  squareEnvironment,
  onPaymentSourceReady,
  onError,
  isProcessing,
}: SquarePaymentWidgetProps) {
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paymentsRef = useRef<any>(null);
  const cardRef = useRef<any>(null);

  useEffect(() => {
    // Load Square Web Payments SDK
    const script = document.createElement("script");
    script.src =
      squareEnvironment === "sandbox"
        ? "https://sandbox.web.squarecdn.com/v1/square.js"
        : "https://web.squarecdn.com/v1/square.js";
    script.async = true;
    script.onload = async () => {
      try {
        if (!window.Square) {
          throw new Error("Square Web Payments SDK failed to load");
        }

        // Initialize payments object
        const payments = window.Square.payments(applicationId, locationId);

        paymentsRef.current = payments;

        // Create card payment element
        const card = await payments.card();
        cardRef.current = card;

        // Attach card to DOM
        if (cardContainerRef.current) {
          await card.attach(cardContainerRef.current);
        }

        setIsLoading(false);
      } catch (err: any) {
        const errorMsg = err?.message || "Failed to initialize Square payment";
        setError(errorMsg);
        onError(errorMsg);
        setIsLoading(false);
      }
    };

    script.onerror = () => {
      const errorMsg = "Failed to load Square Web Payments SDK";
      setError(errorMsg);
      onError(errorMsg);
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [applicationId, locationId, onError, squareEnvironment]);

  const requestCardNonce = async () => {
    if (!cardRef.current || !paymentsRef.current) {
      const errorMsg = "Payment widget not ready";
      setError(errorMsg);
      onError(errorMsg);
      return;
    }

    try {
      setError(null);
      const result = await cardRef.current.tokenize();

      if (result.status === "OK") {
        const cardDetails = result.details?.card;
        const summary: CardSummary | undefined = cardDetails
          ? {
              brand: cardDetails.cardBrand,
              last4: cardDetails.last4,
              expMonth: cardDetails.expMonth,
              expYear: cardDetails.expYear,
            }
          : undefined;

        onPaymentSourceReady(result.token, summary);
      } else {
        const errorMsg =
          result.errors?.[0]?.message || "Failed to process card";
        setError(errorMsg);
        onError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Error processing payment";
      setError(errorMsg);
      onError(errorMsg);
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <h4>Payment Method</h4>

      {isLoading && <div style={{ padding: "20px", textAlign: "center" }}>Loading payment form...</div>}

      {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

      {!isLoading && (
        <>
          <div ref={cardContainerRef} style={{ marginBottom: 12, minHeight: 60 }} />
          <button
            onClick={requestCardNonce}
            disabled={isLoading || isProcessing || !!error}
            style={{
              width: "100%",
              padding: 10,
              backgroundColor: isProcessing ? "#ccc" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: isProcessing ? "default" : "pointer",
            }}
          >
            {isProcessing ? "Processing..." : "Use This Card"}
          </button>
        </>
      )}
    </div>
  );
}

// Export function to request payment nonce (call this after user clicks "Use This Card")
export async function getSquareNonce(applicationId: string, locationId: string): Promise<string> {
  if (!window.Square) {
    throw new Error("Square payment SDK not loaded");
  }

  const payments = window.Square.payments(applicationId, locationId);
  const card = await payments.card();

  const result = await card.tokenize();

  if (result.status === "OK") {
    return result.token;
  } else {
    throw new Error(result.errors?.[0]?.message || "Failed to get payment source");
  }
}
