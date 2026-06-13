import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCallback, useEffect, useState } from 'react';
import {
  AgentStateDonut,
  AlertTicker,
  BlastRadiusTreemap,
  CodeChurnLine,
  HumanInterventions,
  McpBarChart,
  Panel,
  SecurityGauge,
  SessionScatter,
  ShellOutcomeArea,
  ThinkTimeLine,
} from './components/Charts.jsx';
import { ProjectBar } from './components/ProjectBar.jsx';
import { useMetrics } from './useMetrics.js';

const DEFAULT_PANEL_ORDER = [
  'agent-state',
  'security-block',
  'human-loop',
  'think-time',
  'shell-outcome',
  'code-churn',
  'session-scatter',
  'blast-radius',
  'mcp-usage',
];

const PANEL_ORDER_KEY = 'panel-order';

function readPanelOrder() {
  try {
    const stored = localStorage.getItem(PANEL_ORDER_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length === DEFAULT_PANEL_ORDER.length) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_PANEL_ORDER;
}

function savePanelOrder(order) {
  try {
    localStorage.setItem(PANEL_ORDER_KEY, JSON.stringify(order));
  } catch {
    // Ignore storage errors
  }
}

function SortablePanel({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="h-full">
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
    </div>
  );
}

function SettingsModal({ onClose, onResetLayout }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-slate-300"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border p-4">
            <h3 className="mb-1 text-sm font-medium text-slate-200">Layout</h3>
            <p className="mb-3 text-xs text-slate-500">
              Resets the panel order to the original default arrangement.
            </p>
            <button
              type="button"
              onClick={onResetLayout}
              className="rounded-md bg-accent/20 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/30"
            >
              Reset layout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [project, setProject] = useState(null);
  const [panelOrder, setPanelOrder] = useState(readPanelOrder);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isElectron = typeof window.dashboard !== 'undefined';
  const projectId = isElectron ? (project?.id ?? null) : 'default';
  const { metrics, connected } = useMetrics(projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!isElectron) return undefined;
    window.dashboard.getActiveProject().then(setProject);
    const unsubscribe = window.dashboard.onProjectChanged(setProject);
    return unsubscribe;
  }, [isElectron]);

  const handleOpen = useCallback(async () => {
    if (!isElectron) return;
    const opened = await window.dashboard.openProject();
    if (opened) setProject(opened);
  }, [isElectron]);

  const handleSwitch = useCallback(async (id) => {
    if (!isElectron) return;
    const switched = await window.dashboard.switchProject(id);
    if (switched) setProject(switched);
  }, [isElectron]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPanelOrder((prev) => {
        const oldIndex = prev.indexOf(active.id);
        const newIndex = prev.indexOf(over.id);
        const next = arrayMove(prev, oldIndex, newIndex);
        savePanelOrder(next);
        return next;
      });
    }
  }, []);

  const handleResetLayout = useCallback(() => {
    setPanelOrder(DEFAULT_PANEL_ORDER);
    savePanelOrder(DEFAULT_PANEL_ORDER);
    setSettingsOpen(false);
  }, []);

  const showEmptyState = isElectron && !project;

  const panelContent = {
    'agent-state': (dragHandleProps) => (
      <Panel title="Agent State Distribution" subtitle="Metric #1 · Donut chart" dragHandleProps={dragHandleProps}>
        <div className="flex min-h-0 flex-1 flex-col">
          <AgentStateDonut data={metrics.agentStateDistribution} />
          <ul className="mt-2 flex shrink-0 flex-wrap justify-center gap-3 text-xs text-slate-400">
            {metrics.agentStateDistribution.map((d, i) => (
              <li key={d.name}>
                <span
                  className="mr-1 inline-block h-2 w-2 rounded-full"
                  style={{ background: `hsl(${240 + i * 40}, 70%, 60%)` }}
                />
                {d.name} {d.percent}%
              </li>
            ))}
          </ul>
        </div>
      </Panel>
    ),
    'security-block': (dragHandleProps) => (
      <Panel title="Security Block Rate" subtitle="Metric #2 · Policy gauge" dragHandleProps={dragHandleProps}>
        <SecurityGauge {...metrics.securityBlockRate} />
      </Panel>
    ),
    'human-loop': (dragHandleProps) => (
      <Panel title="Human-in-the-Loop" subtitle="Metric #10 · Manual approval friction" dragHandleProps={dragHandleProps}>
        <HumanInterventions data={metrics.humanInterventions} />
      </Panel>
    ),
    'think-time': (dragHandleProps) => (
      <Panel title="Average Think Time" subtitle="Metric #3 · Reasoning latency" dragHandleProps={dragHandleProps}>
        <ThinkTimeLine data={metrics.thinkTimeSeries} />
      </Panel>
    ),
    'shell-outcome': (dragHandleProps) => (
      <Panel title="Shell Success vs Failure" subtitle="Metric #4 · Exit code time series" dragHandleProps={dragHandleProps}>
        <ShellOutcomeArea data={metrics.shellOutcomeSeries} />
      </Panel>
    ),
    'code-churn': (dragHandleProps) => (
      <Panel title="Code Churn Volume" subtitle="Metric #8 · Lines added/removed" dragHandleProps={dragHandleProps}>
        <CodeChurnLine data={metrics.codeChurnSeries} />
      </Panel>
    ),
    'session-scatter': (dragHandleProps) => (
      <Panel title="Autonomous Loop Duration" subtitle="Metric #9 · Session scatter plot" dragHandleProps={dragHandleProps}>
        <SessionScatter data={metrics.sessionScatter} />
      </Panel>
    ),
    'blast-radius': (dragHandleProps) => (
      <Panel title="Project Blast Radius" subtitle="Metric #5 · Directory heatmap" dragHandleProps={dragHandleProps}>
        <BlastRadiusTreemap data={metrics.blastRadius} />
      </Panel>
    ),
    'mcp-usage': (dragHandleProps) => (
      <Panel title="MCP Usage Breakdown" subtitle="Metric #6 · Tool call frequency" dragHandleProps={dragHandleProps}>
        <McpBarChart data={metrics.mcpUsage} />
      </Panel>
    ),
  };

  return (
    <div className="min-h-screen bg-[#0b0c10]">
      <ProjectBar
        project={project}
        onOpen={handleOpen}
        onSwitch={handleSwitch}
        connected={connected}
      />

      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
        className="fixed left-0 top-0 z-20 h-10 w-10 cursor-pointer opacity-0 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      />

      {!isElectron && (
        <header className="sticky top-0 z-10 border-b border-border bg-panel/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] items-center justify-end px-4 py-2">
            <div className="flex items-center gap-4 text-sm">
              <div className="hidden sm:block text-right">
                <p className="text-slate-400">
                  {metrics.totals.recentEvents} events / {metrics.totals.sessions} sessions (1h)
                </p>
                <p className="text-xs text-slate-600">{metrics.totals.events} total buffered</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-danger'}`}
                />
                <span className="text-slate-400">{connected ? 'Live' : 'Reconnecting…'}</span>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-[1600px] px-4 py-4">
        {showEmptyState ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-semibold text-white">No project selected</h2>
            <p className="mt-2 max-w-md text-slate-400">
              Open a Cursor project folder to install dashboard hooks and start streaming agent
              telemetry in real time.
            </p>
            <button
              type="button"
              onClick={handleOpen}
              className="mt-6 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
            >
              Open project folder
            </button>
          </div>
        ) : (
          <>
            <Panel title="Security Interceptions" subtitle="Metric #7 · Real-time alert ticker" className="mb-3">
              <AlertTicker alerts={metrics.securityAlerts} />
            </Panel>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={panelOrder} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {panelOrder.map((id) => (
                    <SortablePanel key={id} id={id}>
                      {({ dragHandleProps }) => panelContent[id]?.(dragHandleProps)}
                    </SortablePanel>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
      </main>

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onResetLayout={handleResetLayout}
        />
      )}
    </div>
  );
}
