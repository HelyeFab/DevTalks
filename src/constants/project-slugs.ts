export const PROJECT_SLUGS = {
  AI_CODE_ASSISTANT: 'ai-code-assistant',
  NEURAL_NETWORK_VIZ: 'neural-network-viz',
  SMART_ENERGY: 'smart-energy'
} as const

export type ProjectSlug = typeof PROJECT_SLUGS[keyof typeof PROJECT_SLUGS]
