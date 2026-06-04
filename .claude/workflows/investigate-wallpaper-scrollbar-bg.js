export const meta = {
  name: 'investigate-wallpaper-scrollbar-bg',
  description: 'Investigate why custom wallpaper makes scrollbar show a background',
  phases: [
    { title: 'Inspect', detail: 'Find wallpaper and scrollbar styling code' },
    { title: 'Synthesize', detail: 'Cross-check root cause and explanation' }
  ]
}
const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    evidence: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          file: { type: 'string' },
          lines: { type: 'string' },
          detail: { type: 'string' }
        },
        required: ['file', 'lines', 'detail']
      }
    },
    likelyCause: { type: 'string' },
    confidence: { type: 'string' }
  },
  required: ['summary', 'evidence', 'likelyCause', 'confidence']
}
phase('Inspect')
const probes = [
  {
    label: 'wallpaper-flow',
    prompt: 'In this repo, inspect the code paths for custom wallpaper/background image settings and how the wallpaper is applied. Focus on CSS classes, inline styles, body/html backgrounds, and containers. Return the root-cause-relevant evidence with clickable file paths and line numbers.'
  },
  {
    label: 'scrollbar-styles',
    prompt: 'In this repo, inspect all scrollbar-related CSS/styles and global layout overflow behavior. Determine why a scrollbar track/background would become visible specifically when a custom wallpaper is used. Return evidence with file paths and line numbers.'
  },
  {
    label: 'layout-overflow',
    prompt: 'In this repo, inspect app shell/layout components for scroll containers, backdrop overlays, transparency/opaque backgrounds, and custom wallpaper interactions. Explain whether the scrollbar belongs to body/html or an inner container and why its track has a background. Return evidence with file paths and line numbers.'
  }
]
const findings = await pipeline(
  probes,
  p => agent(p.prompt, { label: p.label, phase: 'Inspect', schema: RESULT_SCHEMA })
)
phase('Synthesize')
const synthesis = await agent('Synthesize these independent findings into a concise Chinese answer to the user question "为什么使用自定义壁纸时滚动条有背景？". Identify the most likely root cause, mention exact files/lines, and distinguish browser default scrollbar track from app CSS background if relevant. Findings: ' + JSON.stringify(findings), { label: 'root-cause-synthesis', phase: 'Synthesize', schema: RESULT_SCHEMA })
return { findings, synthesis }