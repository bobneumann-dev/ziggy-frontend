import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ReactFlow, {
  type Node,
  type Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  addEdge,
  ConnectionLineType,
  Panel,
} from 'reactflow';
import type { Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Plus, Edit, Trash2, Undo2, RefreshCcw } from 'lucide-react';
import type { Setor } from '../types';
import api from '../lib/api';

interface SetorOrgChartProps {
  setores: Setor[];
  onNodeClick?: (setor: Setor) => void;
  onHierarchyUpdate?: () => void;
  onAddRoot?: () => void;
  onAddChild?: (setor: Setor) => void;
  onEdit?: (setor: Setor) => void;
  onDelete?: (setor: Setor) => void;
}

export default function SetorOrgChart({
  setores,
  onNodeClick,
  onHierarchyUpdate,
  onAddRoot,
  onAddChild,
  onEdit,
  onDelete,
}: SetorOrgChartProps) {
  const { t } = useTranslation();
  const addChildRef = useRef<(setor: Setor) => void | Promise<void> | undefined>(undefined);
  const editRef = useRef<(setor: Setor) => void | Promise<void> | undefined>(undefined);
  const deleteRef = useRef<(setor: Setor) => void | Promise<void> | undefined>(undefined);
  const buildHierarchy = useCallback(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeMap = new Map<string, { x: number; y: number; level: number }>();

    // Encontrar setores raiz (sem pai)
    const rootSetores = setores.filter(s => !s.setorPaiId);

    // Função recursiva para construir a árvore
    const buildTree = (setor: Setor, level: number, parentX: number, siblingIndex: number, totalSiblings: number) => {
      const nodeId = setor.id.toString();
      const spacing = 250;
      const levelHeight = 150;

      // Calcular posição X baseado nos irmãos
      const x = parentX + (siblingIndex - (totalSiblings - 1) / 2) * spacing;
      const y = level * levelHeight;

      nodeMap.set(nodeId, { x, y, level });

      // Criar nó
      // Criar nó
      nodes.push({
        id: nodeId,
        type: 'default',
        position: { x, y },
        data: {
          label: (
            <div className="org-node-card">
              <div className="org-node-header">
                <div className="org-node-title">
                  <span>{setor.nome}</span>
                </div>
                <div className="org-node-actions">
                  <button
                    className="org-node-icon"
                    onClick={(event) => {
                      event.stopPropagation();
                      editRef.current?.(setor);
                    }}
                    title={t('orgChart.editSector')}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="org-node-icon org-node-icon-danger"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteRef.current?.(setor);
                    }}
                    title={t('orgChart.deleteSector')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="org-node-icon org-node-add"
                    onClick={(event) => {
                      event.stopPropagation();
                      addChildRef.current?.(setor);
                    }}
                    title={t('orgChart.addChildSector')}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="org-node-meta">
                <span>{setor.quantidadeCargos} {t('orgChart.positions')}</span>
                <span>•</span>
                <span>{setor.quantidadePessoas} {t('orgChart.people')}</span>
              </div>
            </div>
          ),
          setor: setor,
        },
        style: {
          background: 'transparent',
          border: 'none',
          borderRadius: '12px',
          padding: 0,
          minWidth: '180px',
          color: 'inherit',
          fontSize: '14px',
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        draggable: true,
      });

      // Criar edge se tiver pai
      if (setor.setorPaiId) {
        edges.push({
          id: `e-${setor.setorPaiId}-${setor.id}`,
          source: setor.setorPaiId.toString(),
          target: nodeId,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#fbbf24', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#fbbf24',
          },
        });
      }

      // Processar filhos
      const children = setores.filter(s => s.setorPaiId === setor.id);
      children.forEach((child, index) => {
        buildTree(child, level + 1, x, index, children.length);
      });
    };

    // Construir árvore a partir dos nós raiz
    rootSetores.forEach((root, index) => {
      buildTree(root, 0, index * 300, 0, 1);
    });

    return { nodes, edges };
  }, [setores]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => buildHierarchy(), [buildHierarchy]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isModified, setIsModified] = useState(false);
  const [lastRemovedEdge, setLastRemovedEdge] = useState<Edge | null>(null);

  useEffect(() => {
    const { nodes: nextNodes, edges: nextEdges } = buildHierarchy();
    setNodes(nextNodes);
    setEdges(nextEdges);
    setIsModified(false);
    setLastRemovedEdge(null);
  }, [setores, setNodes, setEdges]);

  const handleUndoRemove = useCallback(() => {
    if (!lastRemovedEdge) return;
    setEdges(current => {
      if (current.some(e => e.id === lastRemovedEdge.id)) return current;
      return [...current, lastRemovedEdge];
    });
    setIsModified(true);
    setLastRemovedEdge(null);
  }, [lastRemovedEdge, setEdges]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isUndo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z';
      if (!isUndo) return;
      if (!lastRemovedEdge) return;
      event.preventDefault();
      handleUndoRemove();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndoRemove, lastRemovedEdge]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find(node => node.id === connection.source);
      const targetNode = nodes.find(node => node.id === connection.target);

      if (sourceNode && targetNode) {
        // Check for cycles - prevent a node from being connected to its descendants
        const wouldCreateCycle = (sourceId: string, targetId: string): boolean => {
          // Check direct connection (target -> source would create a cycle)
          const directEdge = edges.find(e => e.source === targetId && e.target === sourceId);
          if (directEdge) return true;

          // Check if target is already an ancestor of source
          const findDescendants = (nodeId: string): string[] => {
            const children = edges
              .filter(e => e.source === nodeId)
              .map(e => e.target);

            return children.reduce((acc, childId) => [
              ...acc,
              childId,
              ...findDescendants(childId)
            ], [] as string[]);
          };

          const descendants = findDescendants(targetId);
          return descendants.includes(sourceId);
        };

        if (wouldCreateCycle(connection.source!, connection.target!)) {
          alert(t('orgChart.cycleError'));
          return;
        }

        // Check if target already has a parent
        const existingParentEdge = edges.find(edge => edge.target === connection.target);
        if (existingParentEdge) {
          // Remove existing parent connection before adding new one
          setEdges(eds => eds.filter(e => e.id !== existingParentEdge.id));
        }

        // Add new edge
        const newEdge = {
          ...connection,
          id: `e-${connection.source}-${connection.target}`,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#fbbf24', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#fbbf24',
          },
        };

        setEdges(eds => addEdge(newEdge, eds));
        setIsModified(true);
      }
    },
    [nodes, edges, setEdges]
  );

  const onNodeClickHandler = useCallback((_event: React.MouseEvent, node: Node) => {
    const setor = setores.find(s => s.id.toString() === node.id);
    if (setor && onNodeClick) {
      onNodeClick(setor);
    }
  }, [setores, onNodeClick]);

  async function saveHierarchy() {
    try {
      // Extract parent-child relationships from edges
      const hierarchyUpdates = edges.map(edge => {
        const sourceNodeId = edge.source;
        const targetNodeId = edge.target;

        // Find the corresponding nodes to get the setor data
        const targetNode = nodes.find(node => node.id === targetNodeId);
        const sourceNode = nodes.find(node => node.id === sourceNodeId);

        if (targetNode && sourceNode && targetNode.data.setor && sourceNode.data.setor) {
          return {
            id: targetNode.data.setor.id,
            setorPaiId: sourceNode.data.setor.id
          };
        }
        return null;
      }).filter(Boolean);

      // Send updated hierarchy to backend
      await api.post('/setores/update-hierarchy', { updates: hierarchyUpdates });
      setIsModified(false);

      if (onHierarchyUpdate) {
        onHierarchyUpdate();
      }

      alert(t('orgChart.hierarchySaved'));
      return true;
    } catch (error) {
      console.error('Erro ao salvar hierarquia:', error);
      alert(t('orgChart.hierarchySaveError'));
      return false;
    }
  }

  async function requestSaveIfModified() {
    if (!isModified) return true;
    const shouldSave = window.confirm(t('orgChart.pendingChanges'));
    if (!shouldSave) return false;
    return await saveHierarchy();
  }

  async function handleAddRoot() {
    const canProceed = await requestSaveIfModified();
    if (!canProceed) return;
    onAddRoot?.();
  }

  async function handleAddChild(setor: Setor) {
    const canProceed = await requestSaveIfModified();
    if (!canProceed) return;
    onAddChild?.(setor);
  }

  useEffect(() => {
    addChildRef.current = handleAddChild;
    editRef.current = (setor: Setor) => onEdit?.(setor);
    deleteRef.current = (setor: Setor) => onDelete?.(setor);
  }, [handleAddChild, onEdit, onDelete]);

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={(_event, edge) => {
          setEdges(current => current.filter(e => e.id !== edge.id));
          setLastRemovedEdge(edge);
          setIsModified(true);
        }}
        onNodeClick={onNodeClickHandler}
        fitView
        attributionPosition="bottom-left"
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#fbbf24' }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#fbbf24', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#fbbf24' },
        }}
      >
        <Background color="#334155" gap={20} size={1} />
        <Controls className="rounded-lg bg-slate-800 border border-slate-700" />
        <MiniMap
          className="rounded-lg"
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid #334155'
          }}
          nodeColor="#fbbf24"
          maskColor="rgba(0, 0, 0, 0.7)"
        />
        <Panel position="top-right">
          <div className="flex items-center gap-2">
            <button
              className="org-canvas-add"
              onClick={handleAddRoot}
              title={t('orgChart.addSector')}
            >
              <Plus className="w-4 h-4" />
              <span>{t('orgChart.newSector')}</span>
            </button>
            {isModified && (
              <button
                className="org-canvas-secondary"
                onClick={() => {
                  const { nodes: nextNodes, edges: nextEdges } = buildHierarchy();
                  setNodes(nextNodes);
                  setEdges(nextEdges);
                  setIsModified(false);
                  setLastRemovedEdge(null);
                }}
                title={t('orgChart.resetChanges')}
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            )}
            <button
              className={`flex items-center space-x-2 px-3 py-2 rounded-md ${isModified ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-700 opacity-50 cursor-not-allowed'}`}
              onClick={saveHierarchy}
              disabled={!isModified}
            >
              <Save className="w-4 h-4" />
              <span>{t('orgChart.saveChanges')}</span>
            </button>
          </div>
        </Panel>
        <Panel position="bottom-right">
          <button
            className={`org-canvas-undo ${lastRemovedEdge ? '' : 'is-disabled'}`}
            onClick={handleUndoRemove}
            disabled={!lastRemovedEdge}
            title={t('orgChart.undo')}
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}


