import { useEffect, useRef, useState } from 'react';
import Toolbar from './components/Toolbar';
import LayerSidebar from './components/LayerSidebar';
import GraphCanvas from './components/GraphCanvas';
import NodeEditor from './components/NodeEditor';
import EdgeEditor from './components/EdgeEditor';
import LayerEditor from './components/LayerEditor';
import BatchNodeEditor from './components/BatchNodeEditor';
import DetailPopup from './components/DetailPopup';
import { useGraphStore } from './store/graphStore';
import { parseProjectYaml } from './utils/yaml';

type Mode = 'select' | 'add-node' | 'add-edge';

const DEFAULT_YAML_PATH = '/data/%E4%B8%AD%E4%BF%A1%E9%93%B6%E8%A1%8C2025%E5%B9%B4%E6%8A%A5%E6%A1%88%E4%BE%8B.yaml';

function App() {
  const [mode, setMode] = useState<Mode>('select');
  const loadProject = useGraphStore((state) => state.loadProject);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    fetch(DEFAULT_YAML_PATH)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        loadProject(parseProjectYaml(text));
      })
      .catch((err) => {
        console.error('默认案例加载失败', err);
      });
  }, [loadProject]);

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
      <BatchNodeEditor />
      <DetailPopup />
    </div>
  );
}

export default App;
