# 🩸 GlucoTrack AI - Premium Health Tracker

GlucoTrack AI is a state-of-the-art mobile application designed for intelligent glucose monitoring and nutritional tracking. Built with React Native and Expo, it leverages AI to provide deep insights into metabolic health through behavioral discovery and high-fidelity data visualization.

## ✨ Core Features

### 🌓 Predictive Customization
- **Intelligent Theming**: Seamless switching between vibrant Light mode and premium Dark mode, optimized for low-light glucose monitoring.
- **Persistent State**: User preferences and theme selections are automatically remembered across sessions.

### 🏠 Dynamic Holistic Dashboard
- **7-Day Trend Analytics**: Visual sparklines displaying weekly glucose stability at a glance.
- **Hydration Monitoring**: Integrated water tracking system with customizable daily goals.
- **Real-Time progress**: Dynamic 'Time in Range' and carb consumption donut charts powered by actual user logs.
- **Activity Feed**: Horizontal scroll view of today's nutritional intake.

### 📊 AI-Driven Health Insights
- **Behavioral Discovery**: Smart pattern alerts that analyze correlations between nutritional triggers and glucose spikes.
- **Metabolic Forecasting**: Estimated A1c calculation based on historical reading data.
- **Clinical Data Export**: One-tap "Doctor's Report" generation in PDF format for professional consultations.
- **Trigger Analysis**: Identification of specific foods causing significant metabolic impact.

### ➕ Streamlined Logging System
- **Quick-Add Context**: Rapid tagging of glucose readings (Fasted, Pre-meal, Post-meal, Bedtime).
- **Nutritional Shortcuts**: One-tap logging for common high-impact foods.
- **AI Scan Integration**: seamless interaction with image-based meal scanning for carb estimation.

### ⚙️ Secure & Scalable Infrastructure
- **Cloud Synchronization**: Optional secure upload of health data for cross-device accessibility.
- **Privacy First**: Local-first storage for guest users, with easy migration paths to secure cloud accounts.
- **Global Preferences**: dynamic switching between clinical measurement units (mg/dL vs mmol/L).

---

## 🛠 Tech Stack

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) with persistence
- **Backend/Auth**: [Supabase](https://supabase.com/)
- **Styling**: Semantic Design System with Vanilla Styles
- **Icons**: Expo Vector Icons (Ionicons, MaterialCommunityIcons)

---

## 🚀 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AsadNoul/-Ai-Glucotracker.git
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   Ensure your `supabase.ts` and `google-services.json` are correctly configured for your specific instances.
4. **Launch Application**:
   ```bash
   npx expo start
   ```

---

## 📜 Medical Disclaimer
GlucoTrack AI is designed for informational purposes only. It is not a replacement for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
