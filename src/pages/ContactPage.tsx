import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { ticketsApi } from "../api";

export function ContactPage() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.includes("@")) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    if (subject.trim().length === 0) {
      showToast("Please enter a subject", "error");
      return;
    }

    if (message.trim().length === 0) {
      showToast("Please enter a message", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      await ticketsApi.create({
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      showToast("Your message has been sent! We'll get back to you soon.", "success");
      
      // Reset form
      setEmail("");
      setSubject("");
      setMessage("");
      
      // Navigate back after a brief delay
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      showToast("Failed to send message. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2>Contact Us</h2>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Have a question or need a custom order? Send us a message and we'll get back to you as soon as possible.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="email" style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>
            Email *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid #ccc",
              borderRadius: 4,
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="subject" style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>
            Subject *
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="e.g., Custom order request"
            maxLength={255}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid #ccc",
              borderRadius: 4,
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="message" style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>
            Message *
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            placeholder="Tell us about your request..."
            rows={8}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid #ccc",
              borderRadius: 4,
              boxSizing: "border-box",
              fontFamily: "system-ui",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 500,
              background: isSubmitting ? "#ccc" : "#22c55e",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 500,
              background: "#fff",
              color: "#333",
              border: "1px solid #ccc",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
