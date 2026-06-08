# Application Wide Rule: Drill-Down Navigation

**CRITICAL MANDATE FOR EVERY FEATURE, COMPONENT, AND VIEW:**
Anyplace you display a managed object identifier (e.g., node IDs, link IDs, network IDs, termination points, devices, services, slices, channels, etc.), it MUST be selectable to do a drill-down navigation to the managed objects details window. 

This applies to 100% of every corner of the application—grids, lists, topology views, tables, cards, sidebar tools, logs, etc. This rule MUST always remain true for newly developed features.

**Implementation Standard:**
- Pass the `onNavigate` function (defined in `App.tsx`) via props to all views (`onNavigate?: (id: string, type: any) => void`).
- Wrap identifiers or managed object labels in clickable elements (e.g., `<span className="cursor-pointer hover:underline text-indigo-400" onClick={() => onNavigate(id, type)}>{id}</span>` or equivalent buttons).
- Whenever adding a new type of object or a new viewer, ensure the user can click on the textual identifiers to drill-down into `DetailView`.

# Application Wide Rule: Implementation Plan Linking & Indexing

Whenever the user asks for the plan, or when presenting the implementation plan, the agent MUST always provide the direct, clickable absolute link to the implementation plan file using the `file://` scheme, formatted exactly as:
`[implementation_plan_<index>.md](file:///Users/perkunas/.gemini/antigravity/brain/41cea6fa-646d-4c76-9807-bab12410bcb4/implementation_plan_<index>.md)` (where `<index>` is the plan index, e.g., `1`).
This ensures immediate navigation to the artifact file from the chat interface.

The implementation plan file must contain the index in its filename (e.g., `implementation_plan_1.md`) and inside the file (e.g., `Plan Index: 1`).

