import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// 안전한 React 앱 초기화
const rootElement = document.getElementById("root");
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error("React 앱 초기화 오류:", error);
    // 폴백 렌더링
    rootElement.innerHTML = '<div style="padding: 20px; text-align: center;">앱을 로딩 중입니다. 잠시만 기다려주세요...</div>';
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
} else {
  console.error("Root 엘리먼트를 찾을 수 없습니다.");
}
