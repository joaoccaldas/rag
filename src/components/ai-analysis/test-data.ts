// Test data for unified prompt analysis display
export const unifiedPromptTestData = {
  summary: "This document provides a comprehensive overview of Q3 2024 financial performance with detailed breakdowns of revenue streams, operational metrics, and strategic initiatives. The analysis reveals strong growth in core business areas with notable improvements in customer satisfaction and operational efficiency.",
  keywords: ["revenue", "growth", "Q3", "financial", "performance", "metrics", "strategy", "efficiency", "customers"],
  tags: ["quarterly-report", "financial-analysis", "business-metrics", "performance-review"],
  topics: ["Financial Performance", "Revenue Analysis", "Operational Metrics", "Strategic Planning", "Customer Analytics"],
  sentiment: "positive" as const,
  complexity: "medium" as const,
  documentType: "Financial Report",
  confidence: 0.92,
  analyzedAt: new Date(),
  model: "Unified LLM v2.1",
  
  // Unified prompt specific fields
  mainMessages: [
    "Q3 2024 revenue increased by 23% year-over-year, reaching $4.2M with strong performance across all business segments",
    "Customer satisfaction scores improved to 94%, representing the highest rating in company history",
    "Operational efficiency gains of 18% were achieved through process automation and strategic workforce optimization",
    "New product launches contributed $1.1M in revenue, exceeding initial projections by 37%"
  ],
  
  mainNumbers: [
    { key: "Revenue Growth", value: "+23%", context: "Year-over-year increase in Q3 2024" },
    { key: "Total Revenue", value: "$4.2M", context: "Q3 2024 total revenue across all segments" },
    { key: "Customer Satisfaction", value: "94%", context: "Highest score in company history" },
    { key: "Efficiency Gains", value: "+18%", context: "Operational efficiency improvement" },
    { key: "New Product Revenue", value: "$1.1M", context: "Revenue from new product launches" },
    { key: "Projection Beat", value: "+37%", context: "Exceeded initial revenue projections" }
  ],
  
  mainAnalysis: [
    "The company demonstrated exceptional financial performance with revenue growth significantly outpacing industry averages",
    "Customer-centric initiatives have proven highly effective, with satisfaction scores reaching record levels",
    "Strategic automation investments are delivering measurable returns through improved operational efficiency",
    "Product innovation pipeline is performing above expectations, validating the R&D investment strategy"
  ],
  
  explanations: [
    "Revenue growth was driven primarily by expansion in existing markets and successful penetration of two new geographic regions",
    "Customer satisfaction improvements stem from enhanced support processes and proactive engagement strategies implemented in Q2",
    "Operational efficiency gains resulted from automated workflow systems and strategic staff allocation optimization",
    "New product success reflects strong market research and customer feedback integration in the development process"
  ],
  
  actions: [
    "Continue aggressive expansion in high-performing geographic markets while maintaining service quality standards",
    "Scale successful customer satisfaction initiatives across all business units and customer touchpoints",
    "Accelerate automation rollout to additional operational areas with projected 25% efficiency gains",
    "Increase R&D investment by 15% to capitalize on successful product innovation momentum"
  ],
  
  visualInsights: [
    "Revenue trend chart shows consistent upward trajectory with minimal seasonal fluctuation",
    "Customer satisfaction heatmap reveals strong performance across all service categories",
    "Operational efficiency dashboard indicates sustained improvement trends across key metrics",
    "Product performance matrix shows new launches significantly outperforming legacy offerings"
  ]
}

export const legacyPromptTestData = {
  summary: "This is a basic financial document analysis with standard metrics and traditional formatting.",
  keywords: ["finance", "report", "basic"],
  tags: ["legacy", "simple"],
  topics: ["Finance", "Reporting"],
  sentiment: "neutral" as const,
  complexity: "low" as const,
  documentType: "Basic Report",
  confidence: 0.75,
  analyzedAt: new Date(),
  model: "Legacy LLM v1.0"
  // No unified prompt fields - should use legacy display
}
