import { load, dump } from 'js-yaml';
import { validateProject } from '../model/schema';
import type { ProjectData } from '../model/types';

export function parseProjectYaml(text: string): ProjectData {
  const parsed = load(text);
  return validateProject(parsed);
}

export function stringifyProjectYaml(project: ProjectData): string {
  return dump(project, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
}

export function downloadYaml(project: ProjectData, filename = 'project.yaml') {
  const text = stringifyProjectYaml(project);
  const blob = new Blob([text], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
