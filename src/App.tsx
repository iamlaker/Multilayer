import { useState } from 'react';
import Toolbar from './components/Toolbar';
import LayerSidebar from './components/LayerSidebar';
import GraphCanvas from './components/GraphCanvas';
import NodeEditor from './components/NodeEditor';
import EdgeEditor from './components/EdgeEditor';
import LayerEditor from './components/LayerEditor';
import DetailPopup from './components/DetailPopup';

type Mode = 'select' | 'add-node' | 'add-edge';

function App() {
  const [mode, setMode] = useState<Mode>('select');

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Toolbar mode={mode} setMode={setMode} />
      <div className="flex-1 flex overflow-hidden">
        <LayerSidebar mode={mode} setMode={setMode} />
        <GraphCanvas mode={mode} setMode={setMode} />
      </div>
      <NodeEditor />
      <EdgeEditor />
      <LayerEditor />
      <DetailPopup />
    </div>
  );
}

export default App;
