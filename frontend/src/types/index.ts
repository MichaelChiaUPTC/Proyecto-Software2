export type Role = 'student' | 'teacher'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  program: string
  semester?: number
  group?: string
  joinedAt: string
}

export type Difficulty = 'basic' | 'medium' | 'advanced'
export type ItemStatus = 'todo' | 'current' | 'done'

export type LessonBlock =
  | { type: 'p'; text: string }
  | { type: 'h'; id: string; text: string }
  | { type: 'code'; code: string; caption?: string; lang?: string }
  | { type: 'callout'; title: string; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'flow'; steps: FlowStep[]; caption?: string }

export interface FlowStep {
  kind: 'start' | 'decision' | 'action' | 'end'
  label: string
  yes?: string
  no?: string
}

export interface Lesson {
  id: string
  moduleId: string
  order: number
  title: string
  minutes: number
  published: boolean
  blocks: LessonBlock[]
}

export interface TestCase {
  input: string
  expected: string
}

export interface ExerciseRule {
  /** expresión regular (string) que debe aparecer en el código del estudiante */
  pattern: string
  message: string
  concept: string
}

export interface Exercise {
  id: string
  moduleId: string
  lessonId: string
  order: number
  title: string
  statement: string
  goal: string
  difficulty: Difficulty
  published: boolean
  examples: TestCase[]
  constraints: string[]
  hints: string[]
  starter: string
  expectedAnswer: string
  tests: TestCase[]
  rules: ExerciseRule[]
  successNote: string
}

export interface Module {
  id: string
  order: number
  code: string
  title: string
  summary: string
  published: boolean
}

export interface Attempt {
  id: string
  exerciseId: string
  at: string
  passed: boolean
  hintsUsed: number
  feedback: string
}

export interface ProgressState {
  completedLessons: string[]
  exercises: Record<string, { solved: boolean; attempts: number; bestHints: number }>
  attempts: Attempt[]
  badges: Record<string, string>
  lessonsOpened: string[]
  lessonLog?: { lessonId: string; at: string }[]
}

export interface BadgeDef {
  id: string
  name: string
  condition: string
  target: number
  progress: (p: ProgressState, ctx: BadgeContext) => number
}

export interface BadgeContext {
  completedModules: number
  completedModuleIds: string[]
}

export interface BadgeView {
  id: string
  name: string
  condition: string
  target: number
  current: number
  earnedAt?: string
}

export interface StudentRow {
  id: string
  name: string
  email: string
  group: string
  progress: number
  solved: number
  totalExercises: number
  successRate: number
  lastActivity: string
  currentModule: string
}

export type SubmitStatus = 'initial' | 'running' | 'success' | 'error' | 'hint'

export interface SubmitResult {
  passed: boolean
  title: string
  message: string
  concept?: string
  line?: number
  testsPassed: number
  testsTotal: number
  failedTests: number[]
  newBadges: string[]
  pointsGained: number
}
