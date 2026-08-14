export type DiagnosticMode =
  | "correctness"
  | "race"
  | "leak"
  | "bench"
  | "escape";

export type AlgorithmicSpecs = {
  timeComplexity: string;
  spaceComplexity: string;
};

export type RuntimeInvariants = {
  maxHeapAllocsPerRun?: number;
  allowedRaceConditions?: number;
  goroutineLeakThreshold?: number;
  enforceSliceCapacityReuse?: boolean;
};

export type PlatformProblem = {
  id: string;
  title: string;
  trackId: string;
  difficulty: string;
  algorithmicSpecs: AlgorithmicSpecs;
  runtimeInvariants: RuntimeInvariants;
  starterCode: string;
  solutionCode: string;
  testSuiteCode: string;
};

export type DiagnosticMarker = {
  line: number;
  column: number;
  severity: "warning" | "info" | "error";
  message: string;
  escaped: boolean;
};

export type EscapeAnalysisEvent = {
  event: "ESCAPE_ANALYSIS_READY";
  markers: DiagnosticMarker[];
};

export type SafetyCheckEvent = {
  event: "SAFETY_CHECK_RESULT";
  raceDetected: boolean;
  leaksDetected: boolean;
  testsPassed: number;
  testsFailed: number;
  output?: string;
};

export type BenchmarkEvent = {
  event: "BENCHMARK_COMPLETE";
  nsPerOp: number;
  bytesPerOp: number;
  allocsPerOp: number;
  passedStaffBar: boolean;
};

export type DiagnosticProgressEvent = {
  event: "PROGRESS";
  step: string;
  message: string;
};

export type DiagnosticErrorEvent = {
  event: "ERROR";
  message: string;
};

export type DiagnosticStreamEvent =
  | EscapeAnalysisEvent
  | SafetyCheckEvent
  | BenchmarkEvent
  | DiagnosticProgressEvent
  | DiagnosticErrorEvent
  | { event: "COMPLETE"; jobId: string };

export type ExecuteDiagnosticsRequest = {
  problemId: string;
  code: string;
  modes?: DiagnosticMode[];
  hearNotes?: Record<string, unknown>;
  etchDiagram?: Record<string, unknown>;
  anchorInvariants?: Record<string, unknown>;
};

export type HeatSubmissionStatus =
  | "pending"
  | "passed"
  | "failed"
  | "race_detected"
  | "alloc_violation"
  | "leak_detected";

export type HeatSubmission = {
  id: string;
  problemId: string;
  hearNotes: Record<string, unknown>;
  etchDiagramJson: Record<string, unknown>;
  anchorInvariants: Record<string, unknown>;
  temperCode: string;
  status: HeatSubmissionStatus;
  benchNsPerOp?: number;
  benchAllocsPerOp?: number;
  benchBytesPerOp?: number;
  createdAt: string;
};

export type HearStageConfig = {
  throughputTarget: string;
  allocationProfile: string;
  concurrencyModel: string;
};

export type AnchorInvariants = {
  dataStructure: string;
  timeTarget: string;
  spaceTarget: string;
  syncChoice: string;
};
