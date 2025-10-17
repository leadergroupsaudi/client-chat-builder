
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Bot, Cog, GitBranch, MessageSquare, Ear, HelpCircle, BookOpen, Code, SquareStack, Globe, ClipboardList } from 'lucide-react';

export const LlmNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-blue-200 dark:border-blue-700 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-blue-500 dark:!bg-blue-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-blue-500 dark:bg-blue-600">
        <Bot size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">LLM Prompt</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const ToolNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-green-200 dark:border-green-700 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-green-500 dark:!bg-green-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-green-500 dark:bg-green-600">
        <Cog size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Tool Execution</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const ConditionNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-amber-200 dark:border-amber-700 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-amber-500 dark:!bg-amber-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-amber-500 dark:bg-amber-600">
        <GitBranch size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Conditional Logic</div>
    <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%' }} className="w-3 h-3 !bg-green-500 dark:!bg-green-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%' }} className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const OutputNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-red-200 dark:border-red-700 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-red-500 dark:bg-red-600">
        <MessageSquare size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Workflow Output</div>
  </div>
);

export const StartNode = ({ data }) => (
    <div className="px-6 py-3 border-2 border-dashed border-emerald-300 dark:border-emerald-600 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
      <div className="flex flex-col items-center gap-1">
        <strong className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{data.label}</strong>
        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Workflow Start</div>
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-emerald-500 dark:!bg-emerald-400 border-2 border-white dark:border-slate-800" />
    </div>
);

export const ListenNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-cyan-200 dark:border-cyan-700 rounded-xl bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/50 dark:to-sky-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-cyan-500 dark:!bg-cyan-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-cyan-500 dark:bg-cyan-600">
        <Ear size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Listen for Input'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Pauses for user input</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const PromptNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-amber-200 dark:border-amber-700 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-amber-500 dark:!bg-amber-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-amber-500 dark:bg-amber-600">
        <HelpCircle size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Prompt for Input'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Asks user a question</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const KnowledgeNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-indigo-500 dark:!bg-indigo-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-indigo-500 dark:bg-indigo-600">
        <BookOpen size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Knowledge Search'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Searches knowledge base</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const CodeNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-slate-600 dark:bg-slate-700">
        <Code size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Code Execution'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Executes Python code</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const DataManipulationNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-sky-200 dark:border-sky-700 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/50 dark:to-blue-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-sky-500 dark:!bg-sky-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-sky-500 dark:bg-sky-600">
        <SquareStack size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Data Manipulation'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Transforms data</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const HttpRequestNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-teal-200 dark:border-teal-700 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-teal-500 dark:!bg-teal-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-teal-500 dark:bg-teal-600">
        <Globe size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'HTTP Request'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Makes HTTP request</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const FormNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-purple-200 dark:border-purple-700 rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/50 dark:to-fuchsia-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-purple-500 dark:!bg-purple-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-purple-500 dark:bg-purple-600">
        <ClipboardList size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Display Form'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Pauses for form input</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
  </div>
);
